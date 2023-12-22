import * as vscode from 'vscode';
import axios from "axios";

async function getChatGPTResponse(prompt: string): Promise<string> {
    const apiKey = process.env.CHAT_GPT_API_KEY;
    console.log("Test");
    // Prepare messages for ChatGPT
    const messages = [
        { role: 'system', content: 'You are a test developer and you write tests for the developer submitting the prompt. You must return runnable code. Do not give any other text, only code.'},
        { role: 'user', content:   `This is the instructions for what the developer plans to build. Generate test cases for what the user wants to build: ${prompt}\n` },
    ];

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
}

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('chatgptest.followTest', async () => {
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            const selectedText = editor.document.getText(editor.selection);

            // Run your command on the selectedText
            
            const chatGPTResponse = await getChatGPTResponse(selectedText);
            const trimmedResponse = chatGPTResponse.replace(/```[^]*?```/gs, '');
            console.log('Selected Text:', trimmedResponse);
            if (editor) {
                const selectedText = editor.document.getText(editor.selection);
    
                // Run your command on the selectedText
                console.log('Selected Text:', selectedText);
                const chatGPTResponse = await getChatGPTResponse(selectedText);
              
                const edit = new vscode.WorkspaceEdit();
                const position = new vscode.Position(editor.document.lineCount, 0);
                edit.insert(editor.document.uri, position, `\n${chatGPTResponse}\n`);
    
                await vscode.workspace.applyEdit(edit);
            }
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}