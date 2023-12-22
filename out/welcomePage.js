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
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const extension_1 = require("./extension");
function getChatGPTResponse(fileContent, failedTestCases) {
    return __awaiter(this, void 0, void 0, function* () {
        const apiKey = process.env.CHAT_GPT_API_KEY;
        console.log("GPT:", failedTestCases.length);
        // Concatenate failed test cases into a single string
        const failedTestCasesString = failedTestCases.map(testCase => `Failed Test Case: ${testCase}`).join('\n');
        // Prepare messages for ChatGPT
        const messages = [
            { role: 'system', content: 'You are a helpful assistant. You are given a list of failed test cases. For each test case find its test case code in the file. Your goal is not to solve the failed test cases but simply display them, giving the view of the failed test case so the developer can see what test case failed given the file. Output the test case code. Only output the code and do not give any words around the code.' },
            { role: 'user', content: `This is the list of failed test cases: ${failedTestCasesString}\n` },
            { role: 'user', content: `Please find the corresponding test cases from this file and display them. Give me the function definition and everything inside: ${fileContent}}` },
        ];
        console.log(failedTestCasesString);
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
        const chatGPTResponse = response.data.choices[0].message.content;
        console.log(chatGPTResponse);
        return chatGPTResponse;
    });
}
// Function to read the content of a file
function readFile(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const fileContent = yield vscode.workspace.fs.readFile(uri);
            return Buffer.from(fileContent).toString();
        }
        catch (error) {
            console.error(`Error reading file ${uri.fsPath}: ${error}`);
            return undefined;
        }
    });
}
class WelcomePageController {
    static showWelcome(extensionUri, tests) {
        return __awaiter(this, void 0, void 0, function* () {
            if (WelcomePageController._currentPanel) {
                WelcomePageController._currentPanel.dispose();
                WelcomePageController._currentPanel = undefined;
            }
            WelcomePageController._currentPanel = vscode.window.createWebviewPanel('welcomePage', 'Welcome Page', vscode.ViewColumn.One, {
                enableScripts: true,
                retainContextWhenHidden: true,
            });
            WelcomePageController._currentPanel.onDidDispose(() => {
                WelcomePageController._currentPanel = undefined;
            });
            const webViewHtml = this.getWebviewContent(extensionUri, tests);
            WelcomePageController._currentPanel.webview.html = yield webViewHtml;
        });
    }
    static getWebviewContent(extensionUri, tests) {
        return __awaiter(this, void 0, void 0, function* () {
            const stylePath = vscode.Uri.joinPath(extensionUri, 'styles.css');
            const styleUri = stylePath.with({ scheme: 'vscode-resource' });
            // Update this line to include the path to your TypeScript file
            const scriptUri = vscode.Uri.joinPath(extensionUri, 'reactWelcome.tsx').with({ scheme: 'vscode-resource' });
            // Use a regular expression to match the pattern failures=<number>
            const match = tests.match(/failures=(\d+)/);
            // Check if a match is found and extract the number
            let numberOfFailures = 0;
            if (match) {
                numberOfFailures = parseInt(match[1], 10);
            }
            const regex = /FAIL: (\S+)/g;
            let testFail;
            let failedTests = [];
            while ((testFail = regex.exec(tests)) !== null) {
                failedTests.push(testFail[1]);
            }
            // Find strings that start with "traceback" and end with "-" or "="
            const tracebackBlocks = [];
            let currentBlock = '';
            let ranBlock = "";
            let ran = false;
            const lines = tests.split('\n');
            for (const line of lines) {
                if (line.trim().startsWith('Traceback')) {
                    // Start a new traceback block
                    if (currentBlock) {
                        tracebackBlocks.push(currentBlock);
                        currentBlock = '';
                    }
                }
                else if (line.trim().startsWith('Ran')) {
                    // Start a new ran block
                    if (ranBlock) {
                        ranBlock = '';
                    }
                }
                currentBlock += line + '\n';
                ranBlock += line + '\n';
            }
            // Add the last block if any
            if (currentBlock) {
                tracebackBlocks.push(currentBlock);
            }
            if (ranBlock) {
                ranBlock;
            }
            tracebackBlocks.shift();
            console.log("Trace:", tracebackBlocks);
            console.log("Ran:", ranBlock);
            const editor = vscode.window.activeTextEditor;
            let chatBlock;
            if (editor && failedTests.length !== 0) {
                console.log(extension_1.globalTestMap.get(editor.document.fileName), editor.document.fileName);
                const documentUri = editor.document.uri;
                // Read the contents of the file
                const fileContent = yield readFile(documentUri);
                if (fileContent !== undefined) {
                    // Make a request to ChatGPT and get the responses
                    const chatGPTResponses = yield getChatGPTResponse(fileContent, failedTests);
                    const extractedStrings = chatGPTResponses.split(/\bdef\b/).filter(Boolean);
                    if (extractedStrings.length > 0) {
                        extractedStrings.shift(); // Removes the first element
                    }
                    console.log(extractedStrings);
                    chatBlock = extractedStrings.map((str, index) => `
                    <div>
                        <h3>Extracted Function ${index + 1}</h3>
                        <code class="python">${str}</code>
                        <h4> Failing Error </h4>
                        <pre><code class="python">${tracebackBlocks[index]}</code></pre>
                    </div>
                `);
                }
                else {
                    console.log('Failed to read the file.');
                }
            }
            // Calculate the percentage of failed and passed tests
            const totalTests = tests.split("\n")[0].length;
            const passedPercentage = ((totalTests - numberOfFailures) / totalTests) * 100;
            const failedPercentage = (numberOfFailures / totalTests) * 100;
            const htmlContent = `
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Test Progress</title>
            <style>

            code {
                font-family: 'Courier New', Courier, monospace;
                color: #FFFFFF;
                padding: 0.5em;
                border: 1px solid #ddd;
                border-radius: 4px;
                display: inline-block;
            }
            /* Optional: Add different styles for different programming languages */
            code.python {
                color: white;
            }
                .progress-bar {
                    width: 300px;
                    height: 20px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    overflow: hidden;
                }

                .progress-bar-inner {
                    height: 100%;
                    transition: width 0.3s ease-in-out;
                }

                .failed {
                    background-color: #ff6b6b; /* Red color for failed tests */
                }

                .passed {
                    background-color: #6bd16b; /* Green color for passing tests */
                }
            </style>
        </head>
        <body>
            <h2>Test Progress</h2>

            <div class="progress-bar">
                <div class="progress-bar-inner passed" style="width: ${passedPercentage}%;"></div>
                <div class="progress-bar-inner failed" style="width: ${failedPercentage}%;"></div>
            </div>

            <h2> Execution Results </h2>
            <code> ${ranBlock} </code>
            
            <p>${passedPercentage.toFixed(2)}% Passed | ${failedPercentage.toFixed(2)}% Failed</p>

           
            ${chatBlock ? chatBlock.join('\n') : ""}
        </body>
        </html>
        `;
            return htmlContent;
        });
    }
}
exports.default = WelcomePageController;
