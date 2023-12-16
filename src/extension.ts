// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

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
				if(userSelection === "Yes") {
					console.log("yes");
					if(activeEditor && activeTextEditor) {
						console.log(activeTextEditor.document.getText());
					}
					
				} else {
					console.log("no");
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
