"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
function getActiveEditor() {
    const activeTextEditor = vscode.window.activeTextEditor;
    if (activeTextEditor) {
        return activeTextEditor.document.fileName;
    }
    else {
        return;
    }
}
function inputBox() {
    const items = [
        { label: "Yes", description: "Yes" },
        { label: "No", description: "No" }
    ];
    return vscode.window.showQuickPick(items, {
        placeHolder: "Would you like to generate unit tests for this file",
    }).then(selected => selected ? selected.label : undefined);
}
function activate(context) {
    const testCommand = "chatgptest.test";
    const activeEditorCommand = "chatgptest.activeEditor";
    const testCommandHandler = (name = "world") => {
        console.log("Test command running");
    };
    const activeEditorCommandHandler = () => {
        let activeEditor = getActiveEditor();
        if (!activeEditor) {
            console.log('No active text editor.');
        }
        else {
            inputBox().then(userSelection => {
                if (userSelection === "Yes") {
                    console.log("yes");
                }
                else {
                    console.log("no");
                }
            });
        }
    };
    let disposable = vscode.commands.registerCommand('chatgptest.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from chat-gptest!');
    });
    context.subscriptions.push(disposable);
    context.subscriptions.push(vscode.commands.registerCommand(testCommand, testCommandHandler));
    context.subscriptions.push(vscode.commands.registerCommand(activeEditorCommand, activeEditorCommandHandler));
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map