export const themeStyleText = `
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

/* icon color */
.toolbarButton::before {
  background-color: var(--vscode-editor-foreground);
}

.toolbarButton:is(:hover,:focus-visible) {
  background-color: var(--vscode-inputOption-hoverBackground);
}

.toolbarButton:is(:hover,:focus-visible)::before {
  background-color: var(--vscode-editor-foreground);
  // background-color: var(--vscode-inputOption-hoverBackground);
}

.toolbarButton.toggled {
  background-color:var(--vscode-inputOption-activeBackground)
}

.toolbarButton.toggled::before {
  background-color: var(--vscode-inputOption-activeForeground);
}

.pdfViewer .page {
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
  filter: invert(100%);
}

#outerContainer .treeItem > a {
  color: var(--vscode-editor-foreground);
}
`;
