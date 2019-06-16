import * as vscode from 'vscode'
import {
  addTagHandler,
  removeTagHandler,
  createArticleHandler,
  insertTemplateHandler,
  setTokenHandler,
  publishArticleHandler,
} from './commands'
import { DevtoExplorer, DevtoTreeDataProvider } from './views'

let explorer: DevtoExplorer

export function activate(_context: vscode.ExtensionContext) {
  explorer = new DevtoExplorer(new DevtoTreeDataProvider())

  vscode.commands.registerCommand('devto.refreshArticles', explorer.refresh)
  vscode.commands.registerCommand('devto.addTag', addTagHandler)
  vscode.commands.registerCommand('devto.removeTag', removeTagHandler)
  vscode.commands.registerCommand('devto.setToken', setTokenHandler)
  vscode.commands.registerCommand('devto.createArticle', createArticleHandler)
  vscode.commands.registerCommand('devto.insertTemplate', insertTemplateHandler)
  vscode.commands.registerCommand('devto.publishArticle', publishArticleHandler)

  vscode.commands.registerCommand('devto.openArticle', resource => {
    // VS Code 1.31+ VS Older browsers
    if (vscode.env.openExternal) {
      vscode.env.openExternal(vscode.Uri.parse(resource))
    } else {
      vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(resource))
    }
  })
}

export function deactivate() {
  explorer && explorer.dispose()
}
