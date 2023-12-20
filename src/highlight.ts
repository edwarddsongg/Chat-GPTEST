import * as vscode from 'vscode';
import axios from "axios";

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

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('chatgptest.followTest', () => {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
      const selectedText = editor.document.getText(editor.selection);

      // Run your command on the selectedText
      console.log('Selected Text:', selectedText);
      // Add your logic to run a command on the highlighted code
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}