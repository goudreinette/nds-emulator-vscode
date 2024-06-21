import * as vscode from 'vscode';
import { GBAPreview } from './GBAPreview';

export class GBACustomProvider implements vscode.CustomReadonlyEditorProvider {
    public static readonly viewType = 'nds-emulator-vscode.preview-gba';

    private readonly _previews = new Set<GBAPreview>();
    private _activePreview: GBAPreview | undefined;

    constructor(private readonly extensionRoot: vscode.Uri) { }

    public openCustomDocument(uri: vscode.Uri): vscode.CustomDocument {
        return { uri, dispose: (): void => { } };
    }

    public async resolveCustomEditor(
        document: vscode.CustomDocument,
        webviewEditor: vscode.WebviewPanel
    ): Promise<void> {
        const preview = new GBAPreview(
            this.extensionRoot,
            document.uri,
            webviewEditor
        );



        this._previews.add(preview);
        this.setActivePreview(preview);

        webviewEditor.onDidDispose(() => {
            preview.dispose();
            this._previews.delete(preview);
        });

        webviewEditor.onDidChangeViewState(() => {
            if (webviewEditor.active) {
                this.setActivePreview(preview);
            } else if (this._activePreview === preview && !webviewEditor.active) {
                this.setActivePreview(undefined);
            }
        });
    }

    public get activePreview(): GBAPreview | undefined {
        return this._activePreview;
    }

    private setActivePreview(value: GBAPreview | undefined): void {
        this._activePreview = value;
    }
}