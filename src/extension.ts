import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const provider = new MarioViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(MarioViewProvider.viewId, provider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );
}

class MarioViewProvider implements vscode.WebviewViewProvider {
  static readonly viewId = 'marioView';
  private readonly extensionUri: vscode.Uri;

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
  }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    const mediaUri = vscode.Uri.joinPath(this.extensionUri, 'media');

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [mediaUri]
    };

    const asUri = (file: string) =>
      webviewView.webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, file));

    const levelUri  = asUri('level.js');
    const gameUri   = asUri('game.js');
    const mainUri   = asUri('main.js');
    const styleUri  = asUri('style.css');
    const csp       = webviewView.webview.cspSource;

    webviewView.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none';
                 style-src ${csp} 'unsafe-inline';
                 script-src ${csp};">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri}">
  <title>Mario</title>
</head>
<body>
  <canvas id="game"></canvas>
  <div id="pause-overlay"><span id="pause-overlay-text"></span></div>
  <script src="${levelUri}"></script>
  <script src="${gameUri}"></script>
  <script src="${mainUri}"></script>
</body>
</html>`;
  }
}

export function deactivate() {}
