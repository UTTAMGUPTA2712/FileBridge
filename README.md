# FileBridge (MVP)

FileBridge is a local, offline semantic Q&A tool for your codebase. It uses Tauri, Next.js, and Ollama to index your files and answer questions about them.

## Prerequisites

1.  **Node.js** (v18+)
2.  **Rust** (latest stable)
3.  **Ollama** running locally on port 11434.
    *   Install Ollama from [ollama.com](https://ollama.com).
    *   Pull the required models:
        ```bash
        ollama pull nomic-embed-text
        ollama pull qwen2.5-coder:14b
        ```

## Installation

1.  Clone the repo.
2.  Install dependencies:
    ```bash
    npm install
    cd src-tauri && cargo build
    ```

## Development

Run the app in development mode:

```bash
npm run tauri dev
```

## Build

Build the desktop application:

```bash
npm run tauri build
```

## Features (MVP)

*   **Open Folder**: Select any local directory to analyze.
*   **Index Codebase**: Scans supported files (`.ts`, `.tsx`, `.js`, `.py`, `.rs`, etc.), chunks them, and creates embeddings locally.
*   **Chat**: Ask questions about your code. The app retrieves relevant chunks and uses the local LLM to answer.
*   **Offline**: No internet required after model installation.

## Post-MVP Ideas

1.  **Git History Indexing**: Analyze commit messages and diffs to answer questions about *why* code changed.
2.  **Tree-Sitter Chunking**: Use AST-based chunking instead of simple text splitting for better context preservation.
3.  **Multi-Repo Support**: distinct tabs or workspaces for different projects.
4.  **Auto-Update**: ongoing background re-indexing when files change.

## Downloads

You can download the latest version of FileBridge for Linux, macOS, and Windows from our website or the [GitHub Releases](https://github.com/uttamgupta2712/filebridge/releases) page.

## Contributing

We welcome contributions from the community!

1.  **Fork** the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them.
4.  Push to your fork and submit a **Pull Request**.

Please ensure your code follows the existing style and passes all tests.

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
