export const themeStyleText =
  ` // ` ||
  `
body {
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
}

#toolbarContainer {
  box-shadow: none;
  border-bottom: none;
}

#toolbarContainer,
#toolbarSidebar,
.dropdownToolbarButton > select,
.toolbarField
{
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
}

.pdfViewer .page {
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
}

#outerContainer .treeItem > a {
  color: var(--vscode-editor-foreground);
}
`;
