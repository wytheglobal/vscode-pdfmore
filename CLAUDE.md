# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **pdfmore**, a VSCode extension that displays and edits PDF files using PDF.js. It registers a custom editor for `*.pdf` files via the `pdf.preview` viewType.

## Commands

```bash
# Compile TypeScript (extension host code)
npm run compile

# Watch mode for TypeScript
npm run watch

# Bundle webview JS with Rollup (run after editing src/entry/*.js or src/entry/less/)
npm run dev         # watch mode
npx rollup -c rollup.config.mjs  # one-time build

# Lint
npm run lint

# Run tests
npm test

# Package extension (.vsix)
npm run package
```

> **Important**: There are two separate build steps. TypeScript (`tsc`) compiles the extension host code to `out/`. Rollup bundles the webview JS to `dist/`. Both must be up to date for the extension to work correctly.

## Architecture

### Two Execution Contexts

The extension runs in two separate contexts that communicate via postMessage:

1. **Extension host** (Node.js, TypeScript → `out/`):
   - `src/extension.ts` — activation entry point, registers `PdfCustomProvider`
   - `src/pdfProvider.ts` — `PdfCustomProvider` implements `CustomReadonlyEditorProvider`, manages `PdfPreview` instances
   - `src/pdfPreview.ts` — `PdfPreview` extends `Disposable`, sets up the webview HTML, handles messages from the webview, watches the file for changes (auto-reload)
   - `src/disposable.ts` — base `Disposable` class for VSCode resource cleanup

2. **Webview** (browser context, bundled to `dist/`):
   - `src/entry/script_prepend_body.js` → `dist/script_prepend_body.js` — runs before the body; imports `main.js` which acquires `acquireVsCodeApi()` and injects theme CSS
   - `src/entry/script_append_body.js` → `dist/script_append_body.js` — runs after body; imports `themeToggle.js` which injects the Dark/Light toggle button into the PDF.js toolbar
   - `src/entry/html_body_tmpl.ts` — exports the full PDF.js viewer HTML body as a string (used in `pdfPreview.ts`)

### PDF.js Integration

The bundled PDF.js lives in `lib/`:
- `lib/build/pdf.mjs` + `lib/build/pdf.worker.mjs` — core PDF.js library
- `lib/web/viewer.mjs` + `lib/web/viewer.css` — PDF.js viewer UI
- `lib/web/viewer.html` — reference HTML (the actual HTML is generated in `pdfPreview.ts::getWebviewContents()`)
- `lib/main.js` — additional PDF.js glue
- `lib/pdf.css` — extension-level CSS overrides

When upgrading PDF.js, follow the steps in `README.md`: extract the prebuilt package over `lib/`, then apply any `viewer.html` changes to the HTML template in `pdfPreview.ts`, and remove the sample PDF / default URL config.

### Webview ↔ Extension Host Messaging

Messages sent from webview to extension host (in `pdfPreview.ts::onDidReceiveMessage`):
- `{ type: 'reopen-as-text' }` — reopens the file with the default text editor
- `{ type: 'function-call', data: { method: 'download', params: { filename, data, url } } }` — saves a PDF file to disk via `src/utils/fs.ts::writeFileExample`

Messages sent from extension to webview:
- `{ type: 'reload' }` — triggered by the file system watcher when the PDF file changes on disk

### Configuration

Extension settings (prefix `pdfmore.*`) are read in `pdfPreview.ts::getWebviewContents()` and injected into the webview via the `#pdf-preview-config` meta element's `data-config` attribute:
- `pdfmore.default.cursor` — `select` | `hand`
- `pdfmore.default.scale` — `auto`, `page-actual`, `page-fit`, `page-width`, or a numeric scale
- `pdfmore.default.sidebar` — boolean
- `pdfmore.default.scrollMode` — `vertical` | `horizontal` | `wrapped`
- `pdfmore.default.spreadMode` — `none` | `odd` | `even`
