# FileBridge

![GitHub Release](https://img.shields.io/github/v/release/uttamgupta2712/FileBridge?style=flat-square)
![License](https://img.shields.io/github/license/uttamgupta2712/FileBridge?style=flat-square)

FileBridge is a Tauri-based desktop application that instantly turns your PC into a local file-sharing server. Select any folder on your computer, and FileBridge generates a web interface accessible via a **QR code**. You can then use your phone (or any other device on the network) to view, upload, and delete files seamlessly. 

Need to share files across different networks? FileBridge integrates with `localtunnel` to give you a public URL instantly—no complex ngrok authentication required.

Built with **Tauri**, **Next.js**, and **Rust (axum)**.

---

## 🌐 Website & Downloads

Visit the official **[FileBridge Documentation Site](https://uttamgupta2712.github.io/FileBridge/)** for more details.

You can download the latest version of FileBridge for **Linux**, **macOS**, and **Windows** directly from our **[GitHub Releases](https://github.com/uttamgupta2712/FileBridge/releases/latest)** page. 

*Note: New releases are automatically built and published via GitHub Actions when a new version tag (e.g., `v1.0.0`) is pushed.*

---

## ✨ Key Features

*   **Instant Local Server**: Select a folder and start sharing instantly on your local network.
*   **QR Code Access**: Scan the generated QR code with your phone's camera to immediately access the web UI.
*   **Two-Way File Management**: View, delete, and upload files directly from your mobile device to your PC.
*   **Public Sharing (localtunnel)**: Expose your local server to the internet with a single click using integrated `localtunnel` support.
*   **Cross-Platform**: Available as a native desktop application for Windows, macOS, and Linux.

---

## 🚀 How It Works

1.  **Select a Folder**: Open the desktop app and choose the directory you want to share.
2.  **Start the Server**: FileBridge spins up a lightweight Rust (`axum`) web server on port `8080`.
3.  **Scan & Access**: 
    - If on the same WiFi network, scan the Local IP QR code.
    - If you enabled the Public URL option, `localtunnel` will provide a secure internet-accessible link.
4.  **Manage Files**: The beautiful mobile-friendly web interface lets you interact with your PC's files from anywhere.

---

## 🛠️ Development Setup

### Prerequisites

1.  **Node.js** (v18 or higher)
2.  **Rust** (latest stable version)
3.  **Tauri CLI** installed globally or via npm.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/uttamgupta2712/FileBridge.git
   cd FileBridge
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Build the Rust backend:
   ```bash
   cd src-tauri && cargo build
   ```

### Running the App

Start the development server:

```bash
npm run tauri dev
```

### Building for Production

To build the executable for your current operating system:

```bash
npm run tauri build
```

---

## ⚙️ CI/CD & Deployments

This project utilizes **GitHub Actions** for automated CI/CD:
- **Releases**: Pushing a tag starting with `v` (e.g., `v1.0.0`) triggers an automated build process that compiles the Tauri binaries for Windows, macOS, and Linux, and publishes them to GitHub Releases.
- **GitHub Pages**: Pushing a tag also triggers the deployment of the `docs/` folder to GitHub Pages to update the project website.

---

## 🤝 Contributing

We welcome contributions from the community!

1.  **Fork** the repository.
2.  Create a new branch: `git checkout -b feature/your-feature-name`.
3.  Make your changes and commit them: `git commit -m 'Add some feature'`.
4.  Push to the branch: `git push origin feature/your-feature-name`.
5.  Submit a **Pull Request**.

Please ensure your code follows the existing style and passes all tests.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
