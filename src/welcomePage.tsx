import * as vscode from 'vscode';
import * as path from 'path';
import axios from "axios";
import { globalTestMap } from './extension';
import { trace } from 'console';

async function getChatGPTResponse(fileContent: string, failedTestCases: string[]): Promise<string> {
    const apiKey = process.env.CHAT_GPT_API_KEY;
    console.log("GPT:", failedTestCases.length);

    // Concatenate failed test cases into a single string
    const failedTestCasesString = failedTestCases.map(testCase => `Failed Test Case: ${testCase}`).join('\n');

    // Prepare messages for ChatGPT
    const messages = [
        { role: 'system', content: 'You are a helpful assistant. You are given a list of failed test cases. For each test case find its test case code in the file. Your goal is not to solve the failed test cases but simply display them, giving the view of the failed test case so the developer can see what test case failed given the file. Output the test case code. Only output the code and do not give any words around the code.' },
        { role: 'user', content:   `This is the list of failed test cases: ${failedTestCasesString}\n` },
        { role: 'user', content: `Please find the corresponding test cases from this file and display them. Give me the function definition and everything inside: ${fileContent}}` },
    ];
    console.log(failedTestCasesString);
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const response = await axios.post(
        apiUrl,
        {
            messages,
            model: "gpt-3.5-turbo-1106",
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
        }
    );

    // Extract the response from ChatGPT
    const chatGPTResponse = response.data.choices[0].message.content;
    console.log(chatGPTResponse);
    return chatGPTResponse;
}
// Function to read the content of a file
async function readFile(uri: vscode.Uri): Promise<string | undefined> {
    try {
        const fileContent = await vscode.workspace.fs.readFile(uri);
        return Buffer.from(fileContent).toString();
    } catch (error) {
        console.error(`Error reading file ${uri.fsPath}: ${error}`);
        return undefined;
    }
}

export default class WelcomePageController {
    private static _currentPanel: vscode.WebviewPanel | undefined;

    public static async showWelcome(extensionUri: vscode.Uri, tests: string) {
        if (WelcomePageController._currentPanel) {
            WelcomePageController._currentPanel.dispose();
            WelcomePageController._currentPanel = undefined;
        }

        WelcomePageController._currentPanel = vscode.window.createWebviewPanel(
            'welcomePage',
            'Welcome Page',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        WelcomePageController._currentPanel.onDidDispose(() => {
            WelcomePageController._currentPanel = undefined;
        });
        
       

        const webViewHtml = this.getWebviewContent(extensionUri, tests);
        WelcomePageController._currentPanel.webview.html = await webViewHtml;
    }

    private static async getWebviewContent(extensionUri: vscode.Uri, tests: string): Promise<string> {
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
            } else if (line.trim().startsWith('Ran')) {
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
       

        if(editor && failedTests.length !== 0) {
            console.log(globalTestMap.get(editor.document.fileName), editor.document.fileName);

            const documentUri = editor.document.uri;

         // Read the contents of the file
            const fileContent = await readFile(documentUri);
         
            if (fileContent !== undefined) {
                
                // Make a request to ChatGPT and get the responses
                const chatGPTResponses = await getChatGPTResponse(fileContent, failedTests);
                
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


            } else {
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

           
            ${chatBlock ? chatBlock.join('\n'): ""}
        </body>
        </html>
        `;

        return htmlContent;
    }
}
