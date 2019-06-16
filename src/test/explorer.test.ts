import * as vscode from 'vscode'
import * as assert from 'assert'
import * as sinon from 'sinon'
import { DevtoTreeDataProvider, DevtoExplorer } from '../views'
import { setTags } from '../configuration'
import * as api from '../api'
import { resetConfig } from './utils'

suite('Devto explorer', () => {
  test('should group tags', async () => {
    await setup(['Angular', 'Vue'])
    const provider = new DevtoTreeDataProvider()
    const explorer = new DevtoExplorer(provider)

    const rootNodes = await provider.getChildren()
    assert(rootNodes.every(n => provider.getTreeItem(n).collapsibleState === vscode.TreeItemCollapsibleState.Expanded))
    assert(rootNodes.every(n => provider.getTreeItem(n).contextValue === 'tag'))
    assert.deepEqual(rootNodes.map(n => provider.getTreeItem(n).label), ['Angular articles', 'Vue articles'])

    await teardown(explorer)
  })

  test('should show articles for tags', async () => {
    await setup(['one', 'two'])

    const articles = {
      one: [createArticle({ id: 47 }), createArticle({ id: 33 }), createArticle({ id: 6 })],
      two: [createArticle({ id: 132 })],
    }
    const stub = sinon.stub(api)
    stub.getArticles.callsFake(async tag => (articles as any)[tag!] as api.Article[])

    const provider = new DevtoTreeDataProvider()
    const explorer = new DevtoExplorer(provider)

    const rootNodes = await provider.getChildren()

    const oneNodes = await provider.getChildren(rootNodes[0])
    assert(oneNodes.every(n => provider.getTreeItem(n).collapsibleState === vscode.TreeItemCollapsibleState.None))
    assert.deepEqual(oneNodes.map(n => provider.getTreeItem(n).label), articles.one.map(a => a.title))

    const twoNodes = await provider.getChildren(rootNodes[1])
    assert(twoNodes.every(n => provider.getTreeItem(n).collapsibleState === vscode.TreeItemCollapsibleState.None))
    assert.deepEqual(twoNodes.map(n => provider.getTreeItem(n).label), articles.two.map(a => a.title))

    assert.ok(stub.getArticles.withArgs('one').calledOnce)
    assert.ok(stub.getArticles.withArgs('two').calledOnce)

    await teardown(explorer)
  })

  test('should refresh view when config is changed', async () => {
    await setup(['one'])

    const provider = new DevtoTreeDataProvider()
    const explorer = new DevtoExplorer(provider)

    const rootNodes = await provider.getChildren()
    assert.deepEqual(rootNodes, ['one'])

    await setTags(['one', 'two'])

    const rootNodesAfterRefresh = await provider.getChildren()
    assert.deepEqual(rootNodesAfterRefresh, ['one', 'two'])

    await teardown(explorer)
  })

  test('should open article on click', async () => {
    await setup(['one', 'two'])

    const articles = [createArticle({ id: 47 }), createArticle({ id: 33 }), createArticle({ id: 6 })]
    const stub = sinon.stub(api)
    stub.getArticles.callsFake(async () => articles as api.Article[])

    const provider = new DevtoTreeDataProvider()
    const explorer = new DevtoExplorer(provider)

    const rootNodes = await provider.getChildren()

    const oneNodes = await provider.getChildren(rootNodes[0])
    assert(oneNodes.every(n => provider.getTreeItem(n).collapsibleState === vscode.TreeItemCollapsibleState.None))
    assert(oneNodes.every(n => provider.getTreeItem(n).contextValue === 'article'))
    assert(oneNodes.every(n => provider.getTreeItem(n).command!.command === 'devto.openArticle'))
    assert(oneNodes.every((n, i) => provider.getTreeItem(n).command!.arguments![0] === articles[i].url))

    await teardown(explorer)
  })

  async function setup(tags: string[] = []) {
    await setTags(tags)
  }

  async function teardown(explorer: DevtoExplorer) {
    explorer.dispose()
    sinon.restore()
    await resetConfig()
  }

  function createArticle({ id = 47 } = {}): Partial<api.Article> {
    return {
      id,
      title: `title ${id}`,
      url: `url ${id}`,
    }
  }
})
