// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { NDSCustomProvider } from './NDSProvider';
import { GBACustomProvider } from './GBAProvider';



export function activate(context: vscode.ExtensionContext): void {
	const extensionRoot = vscode.Uri.file(context.extensionPath);
	// Register our custom editor provider
	const provider = new NDSCustomProvider(extensionRoot);
	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			NDSCustomProvider.viewType,
			provider,
			{
				webviewOptions: {
					enableFindWidget: false, // default
					retainContextWhenHidden: true,
				},
			}
		)
	);


	const providerGBA = new GBACustomProvider(extensionRoot);
	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			GBACustomProvider.viewType,
			providerGBA,
			{
				webviewOptions: {
					enableFindWidget: false, // default
					retainContextWhenHidden: true,
				},
			}
		)
	);
}


// This method is called when your extension is deactivated
export function deactivate() { }


