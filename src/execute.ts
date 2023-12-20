import * as vscode from "vscode";
import * as cp from "child_process";
import WelcomePage from "./welcomePage";

function getPythonFilePath() {
    const editor = vscode.window.activeTextEditor;

    if(editor && editor.document.languageId === "python") {
        const filepath = editor.document.fileName;

        return filepath;
    }

    return undefined;
}

async function executePythonTests() {
    const pythonExec = "python";
    const filepath = getPythonFilePath();
    

    if(filepath !== undefined) {
        cp.exec(`${pythonExec} "${filepath}"`, (error, stdout, stderr) => {
            const editor = vscode.window.activeTextEditor?.document.uri;
           
            if(editor) {
                WelcomePage.showWelcome(editor, stderr);
            } else {
                vscode.window.showErrorMessage("There is no active editor.");
            }
        });
    } else {
        console.log("Undefined filepath");
    }
    

}




const disposable = vscode.commands.registerCommand("chatgptest.executePythonTests", executePythonTests);

export default disposable;

