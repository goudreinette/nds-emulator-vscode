import * as path from 'path';
import * as vscode from 'vscode';
import { Disposable } from './disposable';

function escapeAttribute(value: string | vscode.Uri): string {
  return value.toString().replace(/"/g, '&quot;');
}

type PreviewState = 'Disposed' | 'Visible' | 'Active';

export class NDSPreview extends Disposable {
  private _previewState: PreviewState = 'Visible';

  constructor(
    private readonly extensionRoot: vscode.Uri,
    private readonly resource: vscode.Uri,
    private readonly webviewEditor: vscode.WebviewPanel
  ) {
    super();
    const resourceRoot = resource.with({
      path: resource.path.replace(/\/[^/]+?\.\w+$/, '/'),
    });

    webviewEditor.webview.options = {
      enableScripts: true,
      localResourceRoots: [resourceRoot, extensionRoot],
    };

    this._register(
      webviewEditor.webview.onDidReceiveMessage((message) => {
        switch (message.type) {
          case 'reopen-as-text': {
            vscode.commands.executeCommand(
              'vscode.openWith',
              resource,
              'default',
              webviewEditor.viewColumn
            );
            break;
          }
        }
      })
    );

    this._register(
      webviewEditor.onDidChangeViewState(() => {
        this.update();
      })
    );

    this._register(
      webviewEditor.onDidDispose(() => {
        this._previewState = 'Disposed';
      })
    );

    const watcher = this._register(
      vscode.workspace.createFileSystemWatcher(resource.fsPath)
    );
    this._register(
      watcher.onDidChange((e) => {
        if (e.toString() === this.resource.toString()) {
          this.reload();
        }
      })
    );
    this._register(
      watcher.onDidDelete((e) => {
        if (e.toString() === this.resource.toString()) {
          this.webviewEditor.dispose();
        }
      })
    );

    this.webviewEditor.webview.html = this.getWebviewContents();
    this.update();
  }

  private reload(): void {
    if (this._previewState !== 'Disposed') {
      this.webviewEditor.webview.postMessage({ type: 'reload' });
    }
  }

  private update(): void {
    if (this._previewState === 'Disposed') {
      return;
    }

    if (this.webviewEditor.active) {
      this._previewState = 'Active';
      return;
    }
    this._previewState = 'Visible';
  }

  private getWebviewContents(): string {
    const webview = this.webviewEditor.webview;
    const docPath = webview.asWebviewUri(this.resource);
    const cspSource = webview.cspSource;
    const resolveAsUri = (...p: string[]): vscode.Uri => {
      const uri = vscode.Uri.file(path.join(this.extensionRoot.path, ...p));
      return webview.asWebviewUri(uri);
    };

    const html = `
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



    const head = ``;

    const body = ``;

    const tail = ['</html>'].join('\n');

    return html; //head + body + tail;
  }
}