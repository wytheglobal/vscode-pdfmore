# pdf

Display and modify PDF files in VSCode with the latest PDF.js library. Supports dark theme mode.

## Core Features

1. **PDF.js Integration**: Utilizes the latest PDF.js library (version 6.0.227) for robust PDF rendering and manipulation capabilities.
2. **PDF Editing & Persistence**: Provides comprehensive PDF modification capabilities with seamless save functionality, enabling users to edit and preserve changes to their documents.
3. **Dark Mode Support**: Features a fully integrated dark theme mode for enhanced visual comfort and reduced eye strain during extended viewing sessions.


![screenshot](https://raw.githubusercontent.com/wytheglobal/vscode-pdfmore/420cc03be2219c6e11d8e54547f212c84debb4bc/docs/images/edit.png)

![screenshot](https://github.com/wytheglobal/vscode-pdfmore/blob/420cc03be2219c6e11d8e54547f212c84debb4bc/docs/images/dark-theme.png?raw=true)

## Contribute

### Upgrade PDF.js

1. Download latest [Prebuilt(older browsers)](https://mozilla.github.io/pdf.js/getting_started/#download).
1. Extract the ZIP file.
1. Overwrite ./lib/* by extracted directories.
   - If lib/web/viewer.html has changes, apply these changes to HTML template at pdfPreview.ts.
1. To not use sample pdf.
  - Remove sample pdf called `compressed.tracemonkey-pldi-09.pdf`.
  - Remove code about using sample pdf from lib/web/viewer.js.
    ```js
    defaultUrl: {
      value: "", // "compressed.tracemonkey-pldi-09.pdf"
      kind: OptionKind.VIEWER
    },
    ```
1. Apply download method modification to ./lib/web/viewer.mjs:


## Change log
See [CHANGELOG.md](CHANGELOG.md).

## License
Please see [LICENSE](./LICENSE)
