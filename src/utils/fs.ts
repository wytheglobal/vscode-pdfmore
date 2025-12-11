import * as vscode from 'vscode';

export async function writeFileExample(pathname: string, data: Uint8Array) {
  // const uri = vscode.Uri.file('/path/to/your/file.txt'); // Replace with your desired file path
  // const content = 'This is the content to write to the file.';
  // const encoder = new TextEncoder();
  // const data = encoder.encode(content);
  // const workspaceFolderUri = vscode.workspace.workspaceFolders[0].uri;
  // const workspacePath = workspaceFolderUri.fsPath;
  // console.log(`Workspace Path: ${workspacePath}`);
  const uri = vscode.Uri.file(pathname);

  try {
    await vscode.workspace.fs.writeFile(uri, data);
    vscode.window.showInformationMessage('File written successfully!');
  } catch (error) {
    console.error(`Error writing file: ${error.message}`);
    vscode.window.showErrorMessage(`Error writing file: ${error.message}`);
  }
}
