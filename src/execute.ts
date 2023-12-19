import * as vscode from "vscode";

function executePythonTests() {
    vscode.window.showInformationMessage("Executing tests");
}

const disposable = vscode.commands.registerCommand("chatgptest.executePythonTests", executePythonTests);

export default disposable;