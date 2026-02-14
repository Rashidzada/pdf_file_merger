# PDF Merger Tool

An offline-first, browser-based PDF merging utility. Built with vanilla HTML, CSS, and JavaScript.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FRashidzada%2Fpdf_file_merger)

## Features
- **Drag & Drop**: Easily add multiple PDF files.
- **Reorder**: Drag and drop files in the list to change their order.
- **Merge**: Combine multiple PDFs into a single file specific order.
- **Offline Capable**: Works without an internet connection (PWA).
- **Privacy Focused**: Files are processed entirely in your browser; no uploads to any server.

## Setup & Running
1. **Download/Clone** this repository.
2. **Open `index.html`** in your browser.
   - *Note*: For the best experience and to avoid CORS issues with some advanced features (like loading web workers or service workers), it is recommended to serve the folder using a local server.
   - **VS Code**: Install "Live Server" extension -> Right-click `index.html` -> "Open with Live Server".
   - **Python**: `python -m http.server`
   - **Node**: `npx serve .`

## Project Structure
- `index.html`: Main entry point.
- `assets/js/`: Application logic.
  - `services/`: Handles PDF processing (using `pdf-lib`).
- `assets/vendor/`: External libraries (vendored for offline use).

## Offline Support
This app uses a Service Worker (`service-worker.js`) to cache core assets. After the first load, it will work even if you go offline.

## Limitations
- **Downloads**: Due to browser security restrictions, the app cannot save directly to a specific folder on your disk without a prompt (in some browsers) or will default to your "Downloads" folder.
- **Password Protected PDFs**: Currently not supported.

## Troubleshooting
- **"Corrupted PDF"**: Some PDF files may not be compatible with the merger library.
- **Drag & Drop Reordering not working**: Ensure JavaScript is enabled.

## Dependencies
- [pdf-lib](https://pdf-lib.js.org/) (MIT License) - Used for PDF manipulation.
