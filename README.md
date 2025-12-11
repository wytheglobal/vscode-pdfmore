# pdf

## Change Log 
v1.0.2 2025-12-11
1. update PDF.js to latest version 5.4.449.
2. support modify pdf and save feature.
3. support dark theme mode.


Display and modify pdf in VSCode.

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

## Change log
See [CHANGELOG.md](CHANGELOG.md).

## License
Please see [LICENSE](./LICENSE)
