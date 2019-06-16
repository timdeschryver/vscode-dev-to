import * as vscode from 'vscode'
import { getTags } from '../configuration'
import { getArticles } from '../api'

type Tag = string

interface Article {
  id: string
  title: string
  url: string
}

export class DevtoExplorer implements vscode.Disposable {
  constructor(private treeDataProvider: DevtoTreeDataProvider) {
    vscode.window.createTreeView('devto.Articles', { treeDataProvider })
  }

  refresh = () => {
    this.treeDataProvider.refresh()
  }

  dispose() {
    this.treeDataProvider.dispose()
  }
}

export class DevtoTreeDataProvider implements vscode.TreeDataProvider<Tag | Article>, vscode.Disposable {
  private _onDidChangeTreeData: vscode.EventEmitter<Tag | Article | undefined> = new vscode.EventEmitter<
    Tag | Article | undefined
  >()
  private tagsLoaded: string[] = []
  private _disposables: vscode.Disposable[] = []
  readonly onDidChangeTreeData: vscode.Event<Tag | Article | undefined> = this._onDidChangeTreeData.event

  constructor() {
    this._disposables.push(
      vscode.workspace.onDidChangeConfiguration(() => {
        if (JSON.stringify(this.tagsLoaded) !== JSON.stringify(getTags())) {
          this.refresh()
        }
      }),
    )
  }

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: Tag | Article): vscode.TreeItem {
    if (typeof element === 'string') {
      const tag = new vscode.TreeItem(`${element} articles`, vscode.TreeItemCollapsibleState.Expanded)
      tag.contextValue = 'tag'
      return tag
    }

    const article = new vscode.TreeItem(element.title, vscode.TreeItemCollapsibleState.None)
    article.command = { command: 'devto.openArticle', title: 'Open Article', arguments: [element.url] }
    article.tooltip = 'Open Article'
    article.contextValue = 'article'
    return article
  }

  async getChildren(element?: Tag | Article): Promise<(Tag | Article)[]> {
    if (typeof element === 'string') {
      const articles = await getArticles(element)

      return articles.map((article: any) => ({
        id: article.id,
        title: article.title,
        url: article.url,
      }))
    }

    this.tagsLoaded = getTags()
    return this.tagsLoaded
  }

  dispose() {
    this._disposables.forEach(d => d.dispose())
  }
}
