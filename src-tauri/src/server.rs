use axum::{
    body::Body,
    extract::{Path, State},
    http::{header, StatusCode},
    response::{Html, IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use local_ip_address::local_ip;
use multer::Multipart;

use once_cell::sync::Lazy;
use serde::Serialize;
use std::sync::Mutex;
use std::{net::SocketAddr, sync::Arc};
use tokio::fs;
use tokio::task::JoinHandle;

// Global tracker for background tasks (Server + Localtunnel)
static ACTIVE_TASKS: Lazy<Mutex<Vec<JoinHandle<()>>>> = Lazy::new(|| Mutex::new(Vec::new()));

pub async fn stop_server() -> Result<(), String> {
    let mut tasks = ACTIVE_TASKS.lock().map_err(|e| e.to_string())?;
    for task in tasks.drain(..) {
        task.abort();
    }
    Ok(())
}

#[derive(Clone)]
struct AppState {
    folder_path: String,
}

#[derive(Serialize)]
struct FileInfo {
    name: String,
    is_dir: bool,
}

// Embedded HTML UI
const PHONE_UI_HTML: &str = include_str!("phone_ui.html");

pub async fn start_server(folder_path: String, use_ngrok: bool) -> Result<String, String> {
    let state = AppState {
        folder_path: folder_path.clone(),
    };

    let app = Router::new()
        .route("/", get(serve_ui))
        .route("/files", get(list_files))
        .route("/files/:name", get(get_file).delete(delete_file))
        .route("/upload", post(upload_file))
        .with_state(Arc::new(state));

    let port: u16 = 8080;

    // Ensure previous instances are stopped to avoid port collisions
    let _ = stop_server().await;

    // To allow the app to actually run properly without hanging the main thread,
    // we need to spawn it in a tokio task. However, since we return the URL,
    // we will start it up here.

    let local_ip_url = match local_ip() {
        Ok(ip) => format!("http://{}:{}", ip, port),
        Err(_) => format!("http://localhost:{}", port),
    };

    let mut public_url = local_ip_url.clone();

    // Always bind to 0.0.0.0 so we can be accessed from other devices
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|e| e.to_string())?;

    if use_ngrok {
        use std::process::Stdio;
        use tokio::io::{AsyncBufReadExt, BufReader};
        use tokio::process::Command;

        let mut child = Command::new("npx")
            .arg("localtunnel")
            .arg("--port")
            .arg(port.to_string())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true) // Crucial to close the node process on abort
            .spawn()
            .map_err(|e| format!("Failed to spawn localtunnel: {}", e))?;

        let stdout = child.stdout.take().unwrap();
        let mut reader = BufReader::new(stdout).lines();

        while let Ok(Some(line)) = reader.next_line().await {
            if line.contains("your url is: ") {
                let url = line.replace("your url is: ", "").trim().to_string();
                public_url = url;
                break;
            }
        }

        // Keep localtunnel running in the background as long as the server is up
        let tunnel_handle = tokio::spawn(async move {
            let _ = child.wait().await;
        });

        ACTIVE_TASKS.lock().unwrap().push(tunnel_handle);
    }

    let server_handle = tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });

    ACTIVE_TASKS.lock().unwrap().push(server_handle);

    Ok(public_url)
}

// Handler: serve phone UI
async fn serve_ui() -> Html<&'static str> {
    Html(PHONE_UI_HTML)
}

// Handler: list files
async fn list_files(State(state): State<Arc<AppState>>) -> Result<Json<Vec<FileInfo>>, StatusCode> {
    let mut entries = fs::read_dir(&state.folder_path)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut files = Vec::new();
    while let Some(entry) = entries.next_entry().await.unwrap_or(None) {
        let metadata = entry.metadata().await.unwrap();
        files.push(FileInfo {
            name: entry.file_name().into_string().unwrap_or_default(),
            is_dir: metadata.is_dir(),
        });
    }

    Ok(Json(files))
}

// Handler: view file
async fn get_file(
    State(state): State<Arc<AppState>>,
    Path(name): Path<String>,
) -> impl IntoResponse {
    let path = std::path::Path::new(&state.folder_path).join(&name);

    // Simple path traversal check
    if !path.starts_with(&state.folder_path) || name.contains("..") {
        return Err(StatusCode::FORBIDDEN);
    }

    let Ok(file_bytes) = fs::read(&path).await else {
        return Err(StatusCode::NOT_FOUND);
    };

    let extension = path.extension().and_then(|e| e.to_str()).unwrap_or("");
    let mime_type = match extension.to_lowercase().as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "svg" => "image/svg+xml",
        "pdf" => "application/pdf",
        "txt" => "text/plain",
        _ => "application/octet-stream",
    };

    let response = Response::builder()
        .header(header::CONTENT_TYPE, mime_type)
        .body(Body::from(file_bytes))
        .unwrap();

    Ok(response)
}

// Handler: delete file
async fn delete_file(State(state): State<Arc<AppState>>, Path(name): Path<String>) -> StatusCode {
    let path = std::path::Path::new(&state.folder_path).join(&name);

    if !path.starts_with(&state.folder_path) || name.contains("..") {
        return StatusCode::FORBIDDEN;
    }

    match fs::remove_file(path).await {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

// Handler: upload file
async fn upload_file(
    State(state): State<Arc<AppState>>,
    request: axum::extract::Request,
) -> Result<StatusCode, (StatusCode, String)> {
    let content_type = request
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|val| val.to_str().ok());

    let boundary = content_type
        .and_then(|ct| multer::parse_boundary(ct).ok())
        .ok_or((StatusCode::BAD_REQUEST, "Missing boundary".to_string()))?;

    let stream = request.into_body().into_data_stream();
    let mut multipart = Multipart::new(stream, boundary);

    while let Some(mut field) = multipart
        .next_field()
        .await
        .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?
    {
        let name = field.file_name().unwrap_or("unnamed_file").to_string();

        let mut data = Vec::new();
        while let Some(chunk) = field
            .chunk()
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        {
            data.extend_from_slice(&chunk);
        }

        let path = std::path::Path::new(&state.folder_path).join(&name);
        fs::write(&path, data)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    Ok(StatusCode::OK)
}
