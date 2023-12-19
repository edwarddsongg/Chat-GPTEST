// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from "axios";
import * as dotenv from 'dotenv';
import * as fs from "fs";
import * as path from "path";
import { match } from 'assert';
import execute from "./execute";
import { exec } from 'child_process';

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
	}).then(selected => selected ? selected.label: undefined);
}

async function generateAPITest(language: string, code: string): Promise<string> {
	const apiKey = process.env.CHAT_GPT_API_KEY;
	
	const apiUrl = "https://api.openai.com/v1/chat/completions";
	
	const headers = {
		"Content-type": "application/json",
		"Authorization": "Bearer ${apiKey}",
	};
	
	try {
		const curEditor = vscode.window.activeTextEditor;
					
		if(curEditor) {
			const messages = [
				{ role: 'system', content: `You are a helpful assistant that generates unit tests for code using ${language}. Make sure to only output code and any text should be documented inside the code.` },
				{ role: 'user', content: 'Generate unit tests for the following ${language}. Do not give any text around the code:' },
				{ role: 'assistant', content: code},
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
			const response = await axios.post(apiUrl, requestData, { headers });

			// Return the generated unit tests
			return response.data.choices[0].message.content.trim();
		} else {
			throw new Error("No active text editor");
		}
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
					
						if(curEditor) {
							const curFileURI = curEditor.document.uri;
							
							const directoryPath = path.dirname(curFileURI.fsPath);
							let matchTestFile = middleLines[0].match(/\btests?\.\w+\b/ig);
							let filename = "";

							if(matchTestFile === null) {
								filename = "tests.txt";
							} else {
								filename = matchTestFile[0];
							}

							const absolutePath = path.join(directoryPath, filename);

							if(fs.existsSync(absolutePath)) {
								vscode.window.showInformationMessage("This file exists, do you want to overwrite it?", "Yes", "No").then(answer => {
									if(answer === "Yes") {
										fs.writeFileSync(absolutePath, tests, 'utf-8');
									}
								});
							} else {
								vscode.window.showInformationMessage("Writing into file:", absolutePath);
								fs.writeFileSync(absolutePath, tests, 'utf-8');
							}
								
						} else {

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
	context.subscriptions.push(execute);
}



// This method is called when your extension is deactivated
export function deactivate() {}
