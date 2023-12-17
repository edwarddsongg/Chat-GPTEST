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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
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
async function generateAPITest(language, code) {
    const apiKey = process.env.CHAT_GPT_API_KEY;
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    console.log("Apiskey:", apiKey);
    const headers = {
        "Content-type": "application/json",
        "Authorization": "Bearer ${apiKey}",
    };
    language = "Javascript";
    const input = "You are a programer and you need to write unit tests for this code using the language ${language}. Make sure to thoroughly test all conditions with this code: \n\n${code}";
    try {
        const response = await axios_1.default.post(apiUrl, {
            prompt: input,
            temperature: 0.8,
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer ${apiKey}",
            },
        });
        const unitTests = response.data.choices[0].text.trim();
        return unitTests;
    }
    catch (error) {
        console.error("Error making API call:", error.message);
        console.log("Apikey:", apiKey);
        throw error;
    }
}
function activate(context) {
    const testCommand = "chatgptest.test";
    const activeEditorCommand = "chatgptest.activeEditor";
    const activeTextEditor = vscode.window.activeTextEditor;
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
                if (userSelection === undefined) {
                    console.log("The user did not make a selection");
                }
                else if (activeTextEditor === undefined) {
                    console.log("There currently is no active editor.");
                }
                else {
                    generateAPITest(userSelection, activeTextEditor.document.getText()).then((response) => {
                        console.log("Generated unit tests:\n", response);
                    })
                        .catch((error) => {
                        console.error("Error:", error.message);
                    });
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