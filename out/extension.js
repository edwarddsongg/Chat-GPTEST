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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const execute_1 = __importDefault(require("./execute"));
dotenv.config({ path: '/Users/edwardsong/Documents/CHAT-GPTEST/.env' });
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
        { label: "Python", description: "Python" },
        { label: "Java", description: "Java" },
        { label: "JavaScript", description: "JavaScript" },
        { label: "C", description: "C" },
        { label: "C++", description: "C++" },
        { label: "C#", description: "C#" },
        { label: "Swift", description: "Swift" },
        { label: "Objective-C", description: "Objective-C" },
        { label: "Ruby", description: "Ruby" },
        { label: "Go", description: "Go" },
        { label: "Rust", description: "Rust" },
        { label: "Kotlin", description: "Kotlin" },
        { label: "TypeScript", description: "TypeScript" }
    ];
    return vscode.window.showQuickPick(items, {
        placeHolder: "Which language do you want to develop the tests in?",
    }).then(selected => selected ? selected.label : undefined);
}
async function generateAPITest(language, code) {
    const apiKey = process.env.CHAT_GPT_API_KEY;
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const headers = {
        "Content-type": "application/json",
        "Authorization": "Bearer ${apiKey}",
    };
    try {
        const curEditor = vscode.window.activeTextEditor;
        if (curEditor) {
            const messages = [
                { role: 'system', content: `You are a helpful assistant that generates unit tests for code using ${language}. Make sure to only output code and any text should be documented inside the code.` },
                { role: 'user', content: 'Generate unit tests for the following ${language}. Do not give any text around the code:' },
                { role: 'assistant', content: code },
                { role: 'user', content: `On the first line, specify the file name as tests. and add the corresponding file type to ${language} I need tests to cover different cases. Make sure for each language you do the correct imports.
				The test file will be in the same directory as the current file. Give documentation for each test case. Include a main that calls on this test suite. This is the file path ${curEditor.document.uri.fsPath}` },
            ];
            // Define the data for the API request
            const requestData = {
                messages,
                max_tokens: 150,
                model: "gpt-3.5-turbo-1106",
                temperature: 0.5
            };
            // Define the headers with your API key
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            };
            // Make the API request using Axios
            const response = await axios_1.default.post(apiUrl, requestData, { headers });
            // Return the generated unit tests
            return response.data.choices[0].message.content.trim();
        }
        else {
            throw new Error("No active text editor");
        }
    }
    catch (error) {
        console.error('API Error:', error.response ? error.response.data : error.message);
        throw new Error('Error generating unit tests.');
    }
}
function activate(context) {
    const testCommand = "chatgptest.test";
    console.log("TEST", process.env);
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
                    let tests = "";
                    generateAPITest(userSelection, activeTextEditor.document.getText()).then((response) => {
                        console.log("Generated unit tests:\n", response);
                        const lines = response.split('\n');
                        // Exclude the first and last lines
                        const middleLines = lines.slice(1, -1);
                        // Join the remaining lines back into a string
                        const tests = middleLines.join('\n');
                        console.log("Generated unit tests:\n", tests);
                        const curEditor = vscode.window.activeTextEditor;
                        if (curEditor) {
                            const curFileURI = curEditor.document.uri;
                            const directoryPath = path.dirname(curFileURI.fsPath);
                            let matchTestFile = middleLines[0].match(/\btests?\.\w+\b/ig);
                            let filename = "";
                            if (matchTestFile === null) {
                                filename = "tests.txt";
                            }
                            else {
                                filename = matchTestFile[0];
                            }
                            const absolutePath = path.join(directoryPath, filename);
                            if (fs.existsSync(absolutePath)) {
                                vscode.window.showInformationMessage("This file exists, do you want to overwrite it?", "Yes", "No").then(answer => {
                                    if (answer === "Yes") {
                                        fs.writeFileSync(absolutePath, tests, 'utf-8');
                                    }
                                });
                            }
                            else {
                                vscode.window.showInformationMessage("Writing into file:", absolutePath);
                                fs.writeFileSync(absolutePath, tests, 'utf-8');
                            }
                        }
                        else {
                        }
                    })
                        .catch((error) => {
                        vscode.window.showInformationMessage("Error:", error.message);
                    });
                }
            });
        }
    };
    let disposable = vscode.commands.registerCommand('chatgptest.helloWorld', () => {
        console.log("TEST", process.env);
        vscode.window.showInformationMessage('Hello World from chat-gptest!');
    });
    context.subscriptions.push(disposable);
    context.subscriptions.push(vscode.commands.registerCommand(testCommand, testCommandHandler));
    context.subscriptions.push(vscode.commands.registerCommand(activeEditorCommand, activeEditorCommandHandler));
    context.subscriptions.push(execute_1.default);
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map