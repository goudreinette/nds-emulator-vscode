import * as path from 'path';
import * as vscode from 'vscode';
import { Disposable } from './disposable';



type PreviewState = 'Disposed' | 'Visible' | 'Active';

export class GBAPreview extends Disposable {
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
            <canvas></canvas>

            <div class="loading">loading...</div>


            <script type="module">
                import mGBA from "${resolveAsUri('js', 'mgba.js')}";

                const $loading = document.querySelector('.loading')

                let loading = ''

                console.log('${resolveAsUri('js', 'mgba.js')}')
                window.MGBA_WASM_URI = '${resolveAsUri('js', 'mgba.wasm')}'

                fetch('${docPath.toString()}').then((response) => {
                    window.Module = {
                        canvas: document.querySelector('canvas')
                    };
                    
                    let gameblob = response.blob().then((blob) => {
                        $loading.innerHTML = "Loading emulator..";
                        mGBA(window.Module).then(() => {
                            window.Module.FS.mkdir("/hh-gba-data");
                            window.Module.FS.mount(
                                window.Module.FS.filesystems.IDBFS,
                                {},
                                "/hh-gba-data",
                            );

                            blob.arrayBuffer().then((data) => {
                                window.Module.FS.writeFile(
                                    "/hh-gba-data/game.gba",
                                    new Uint8Array(data),
                                );
                                window.Module.loadFile("/hh-gba-data/game.gba");
                                $loading.innerHTML = "";
                                window.Module._setVolume(0.1);
                            });
                        });
                    });
                })
            </script>


            <style>
                canvas {
                    width: 100%;
                    image-rendering: pixelated;
                }
            </style>
        `;

        return html;
    }
}