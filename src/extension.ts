// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from "axios";
import * as dotenv from 'dotenv';
dotenv.config({ path: '/Users/edwardsong/Documents/CHAT-GPTEST/.env'  });


function getActiveEditor(): string  | undefined {
	const activeTextEditor = vscode.window.activeTextEditor;

	if (activeTextEditor) {
		return activeTextEditor.document.fileName;
	} else {
		return;
	}
}

function inputBox (): Thenable<string | undefined> {
	const items: vscode.QuickPickItem[] = [
		{label: "Yes", description: "Yes"},
		{label: "No", description: "No"}
	];

	return vscode.window.showQuickPick(items, {
		placeHolder: "Would you like to generate unit tests for this file",
	}).then(selected => selected ? selected.label: undefined);
}

async function generateAPITest(language: string, code: string): Promise<string> {
	const apiKey = process.env.CHAT_GPT_API_KEY;
	
	const apiUrl = "https://api.openai.com/v1/chat/completions";
	console.log("Apiskey:", apiKey);
	const headers = {
		"Content-type": "application/json",
		"Authorization": "Bearer ${apiKey}",
	};
	language = "Javascript";
	const input = `You are a programer and you need to write unit tests for this code using the language ${language}. Make sure to thoroughly test all conditions with this code.`;
	
	try {
		const messages = [
			{ role: 'system', content: 'You are a helpful assistant that generates unit tests for code.' },
			{ role: 'user', content: 'Generate unit tests for the following JavaScript function:' },
			{ role: 'assistant', content: code},
			{ role: 'user', content: 'I need tests to cover different cases.' },
		  ];
		  
		  // Define the data for the API request
		  const requestData = {
			messages,
			max_tokens: 150,
			model: "gpt-3.5-turbo-1106"
		  };
		  
		  // Define the headers with your API key
		  const headers = {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`,
		  };
		  
		  // Make the API request using Axios
		  const response = await axios.post(apiUrl, requestData, { headers });

		// Return the generated unit tests
		return response.data.choices[0].message.content.trim();
	} catch(error: any) {
		console.error('API Error:', error.response ? error.response.data : error.message);
    	throw new Error('Error generating unit tests.');
	}

}

export function activate(context: vscode.ExtensionContext) {
	const testCommand =  "chatgptest.test";
	console.log("TEST", process.env);
	const activeEditorCommand = "chatgptest.activeEditor";	
	const activeTextEditor = vscode.window.activeTextEditor;

	const testCommandHandler = (name: string = "world") => {
		console.log("Test command running");
	};

	const activeEditorCommandHandler = () => {
		let activeEditor = getActiveEditor();

		if (!activeEditor) {
			console.log('No active text editor.');
		} else {
			inputBox().then(userSelection => {
				if(userSelection === undefined) {
					console.log("The user did not make a selection");
				} else if(activeTextEditor === undefined) {
					console.log("There currently is no active editor.");
				} else {
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
		console.log("TEST", process.env);
		vscode.window.showInformationMessage('Hello World from chat-gptest!');
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(vscode.commands.registerCommand(testCommand, testCommandHandler));
	context.subscriptions.push(vscode.commands.registerCommand(activeEditorCommand, activeEditorCommandHandler));
}



// This method is called when your extension is deactivated
export function deactivate() {}
