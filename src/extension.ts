// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from "axios";
import * as dotenv from 'dotenv';
dotenv.config();

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
	const input = "You are a programer and you need to write unit tests for this code using the language ${language}. Make sure to thoroughly test all conditions with this code: \n\n${code}";

	try {
		const response = await axios.post(
			apiUrl,
			{
				prompt: input,
				temperature: 0.8,
			},
			{
				headers: {
					"Content-Type": "application/json",
					"Authorization": "Bearer ${apiKey}",
				},
			}
		);
		const unitTests = response.data.choices[0].text.trim();
		return unitTests;
	} catch(error: any) {
		console.error("Error making API call:", error.message);
		console.log("Apikey:", apiKey);
		throw error;
	}

}

export function activate(context: vscode.ExtensionContext) {
	const testCommand =  "chatgptest.test";
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
		vscode.window.showInformationMessage('Hello World from chat-gptest!');
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(vscode.commands.registerCommand(testCommand, testCommandHandler));
	context.subscriptions.push(vscode.commands.registerCommand(activeEditorCommand, activeEditorCommandHandler));
}



// This method is called when your extension is deactivated
export function deactivate() {}
