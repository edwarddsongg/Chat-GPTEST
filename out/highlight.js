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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
function getChatGPTResponse(prompt) {
    return __awaiter(this, void 0, void 0, function* () {
        const apiKey = process.env.CHAT_GPT_API_KEY;
        console.log("Test");
        // Prepare messages for ChatGPT
        const messages = [
            { role: 'system', content: 'You are a test developer and you write tests for the developer submitting the prompt. You must return runnable code. Do not give any other text, only code.' },
            { role: 'user', content: `This is the instructions for what the developer plans to build. Generate test cases for what the user wants to build: ${prompt}\n` },
        ];
        const apiUrl = "https://api.openai.com/v1/chat/completions";
        const response = yield axios_1.default.post(apiUrl, {
            messages,
            model: "gpt-3.5-turbo-1106",
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
        });
        // Extract the response from ChatGPT
        let chatGPTResponse = response.data.choices[0].message.content;
        // Split the response into lines
        let lines = chatGPTResponse.split('\n');
        // Filter out lines starting with triple backticks
        lines = lines.filter(line => !line.startsWith('```'));
        console.log(lines);
        // Rejoin the remaining lines
        chatGPTResponse = lines.join('\n');
        console.log(chatGPTResponse);
        return chatGPTResponse;
    });
}
function activate(context) {
    let disposable = vscode.commands.registerCommand('chatgptest.followTest', () => __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selectedText = editor.document.getText(editor.selection);
            // Run your command on the selectedText
            const chatGPTResponse = yield getChatGPTResponse(selectedText);
            const trimmedResponse = chatGPTResponse.replace(/```[^]*?```/gs, '');
            console.log('Selected Text:', trimmedResponse);
            if (editor) {
                const selectedText = editor.document.getText(editor.selection);
                // Run your command on the selectedText
                console.log('Selected Text:', selectedText);
                const chatGPTResponse = yield getChatGPTResponse(selectedText);
                const edit = new vscode.WorkspaceEdit();
                const position = new vscode.Position(editor.document.lineCount, 0);
                edit.insert(editor.document.uri, position, `\n${chatGPTResponse}\n`);
                yield vscode.workspace.applyEdit(edit);
            }
        }
    }));
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
