import * as path from 'path';
import * as vscode from 'vscode';
import { Disposable } from './disposable';



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
            
            // needs to be different to reload
            this.webviewEditor.webview.html = this.webviewEditor.webview.html + ' ';
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
                    <desmond-player id="player"></desmond-player>
                    <script src="${resolveAsUri('lib', 'desmond.min.js')}"></script>

                    <script>
                        var player = document.querySelector('desmond-player');

                        addEventListener('load', () => {
                            player.loadURL("${docPath.toString()}", function(){
                                // player.enableMicrophone();
                            })
                        });

                        var style = document.createElement('style')
                        style.innerHTML = '#player { display: flex; flex-direction: column; max-width: 600px; width: 100%; grid-gap: 10px}'
                        player.shadowRoot.appendChild(style)
                    </script>

                    <style>
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

        return html;
    }
}