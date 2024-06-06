// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';


const webviewHtml = `<!DOCTYPE html>
	<html>
	<head>
		<title>NDS Embed</title>
	</head>

	<body>
		<input type="file" id="load"></input>
		<button id="reload">Reload</button>

		<desmond-player id="player"></desmond-player>
		
		<script src="https://cdn.jsdelivr.net/gh/Unzor/desmond/cdn/desmond.min.js"></script>

		<script>
			let btn = document.getElementById('load');
			let reload = document.getElementById('reload');

			btn.onchange = () => {
				let nds = URL.createObjectURL(btn.files[0]);
				document.getElementById("player").loadURL(nds);
			}

			reload.onclick = () => {
				window.location.reload();
			}

			var host = document.querySelector('desmond-player')
			var style = document.createElement('style')
			style.innerHTML = '#player { display: flex; flex-direction: column; max-width: 600px; width: 100%; grid-gap: 10px}'
			host.shadowRoot.appendChild(style)
		</script>

		<style>
			body {
			/* background-color: grey;*/
			}
			desmond-player {
				image-rendering: pixelated;
				width: 100%;
				display: flex;
				align-items: center;
				flex-direction: column;
			}
		</style>
	</body>

	</html>
`;


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('nds-emulatorjs-vscode.openNDSView', () => {
		  // Create and show panel
		  const panel = vscode.window.createWebviewPanel(
			'nds-emulatorjs-vscode',
			'NDS Emulator',
			vscode.ViewColumn.Two,
			{
				enableScripts: true
			}
		  );

		  
	
		  // And set its HTML content
		  panel.webview.html = webviewHtml;
		})
	  );
	}





// This method is called when your extension is deactivated
export function deactivate() {}


