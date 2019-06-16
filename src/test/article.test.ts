import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as vscode from 'vscode'
import * as assert from 'assert'
import * as sinon from 'sinon'
import * as rimraf from 'rimraf'
import { deactivate } from '../extension'
import { resetConfig, stripIndent } from './utils'
import { setToken } from '../configuration'
import * as api from '../api'

suite('Article', () => {
  const templatePath = path.join(path.resolve(__dirname, '..', '..'), 'templates', 'devto.template')
  const template = fs.readFileSync(templatePath, { encoding: 'utf8' })

  suite('createArticle', () => {
    test('should create an article', async () => {
      const tmpDir = await setup()
      const filePath = path.join(tmpDir, 'awesome-article.md')

      await act(filePath)

      const text = fs.readFileSync(filePath, { encoding: 'utf8' })
      assert.equal(text, template)

      await teardown(tmpDir)
    })

    test('should append extension md if none is provided', async () => {
      const tmpDir = await setup()
      const filePath = path.join(tmpDir, 'awesome-article')

      await act(filePath)

      const text = fs.readFileSync(filePath + '.md', { encoding: 'utf8' })
      assert.equal(text, template)

      await teardown(tmpDir)
    })

    test('should show an error message if the file already exists', async () => {
      const tmpDir = await setup()
      const filePath = path.join(tmpDir, 'awesome-article.md')

      const spy = sinon.spy(vscode.window, 'showErrorMessage')
      await act(filePath)

      // try to create the file for a second time
      await act(filePath)

      assert.ok(spy.calledOnce)
      assert.equal(spy.firstCall.args[0], `File '${filePath}' already exists`)

      await teardown(tmpDir)
    })

    async function act(filename: string) {
      const stub = await sinon.stub(vscode.window, 'showInputBox').resolves(filename as any)
      await vscode.commands.executeCommand('devto.createArticle')
      stub.restore()
    }
  })

  suite('insertTemplate', () => {
    test('should insert the template in an empty open editor', async () => {
      const tmpDir = await setup()
      const filePath = path.join(tmpDir, 'awesome-article.md')

      fs.writeFileSync(filePath, '')
      const doc = await vscode.workspace.openTextDocument(filePath)
      await vscode.window.showTextDocument(doc)

      await act()

      const text = fs.readFileSync(filePath, { encoding: 'utf8' })
      assert.equal(text, template)

      await teardown(tmpDir)
    })

    test('should insert the template in the open editor on the cursor position', async () => {
      const tmpDir = await setup()
      const filePath = path.join(tmpDir, 'awesome-article.md')

      fs.writeFileSync(filePath, 'some text is already here')
      const doc = await vscode.workspace.openTextDocument(filePath)
      await vscode.window.showTextDocument(doc)

      vscode.window.activeTextEditor!.selection = new vscode.Selection(
        new vscode.Position(0, 10),
        new vscode.Position(0, 10),
      )

      await act()

      const text = fs.readFileSync(filePath, { encoding: 'utf8' })
      const expected = `some text ${template}is already here`
      assert.equal(text, expected)

      await teardown(tmpDir)
    })

    async function act() {
      await vscode.commands.executeCommand('devto.insertTemplate')
    }
  })

  suite('publishArticle', () => {
    test('should show a message if there is no active editor', async () => {
      const tmpDir = await setupPublishArticle({ openFile: false })

      const spy = sinon.spy(vscode.window, 'showErrorMessage')

      await act()

      assert.ok(spy.calledOnce)
      assert.equal(spy.firstCall.args[0], `You have to have the article open in order to publish it`)

      await teardown(tmpDir)
    })

    test('should show a message if there is no token set', async () => {
      const tmpDir = await setupPublishArticle({ token: '' })

      const spy = sinon.spy(vscode.window, 'showErrorMessage')

      await act()

      assert.ok(spy.calledOnce)
      assert.equal(spy.firstCall.args[0], `You must provide a dev.to token`)

      await teardown(tmpDir)
    })

    suite('invalid article', () => {
      test('should show a message if there is no title', async () => {
        const tmpDir = await setupPublishArticle({
          content: stripIndent`
        ---
        description: foo
        ---

        some text here
        `,
        })

        const spy = sinon.spy(vscode.window, 'showErrorMessage')

        await act()

        assert.ok(spy.calledOnce)
        assert.equal(spy.firstCall.args[0], `Title attribute is required`)

        await teardown(tmpDir)
      })

      test('should show a message if there are more than 4 tags', async () => {
        const tmpDir = await setupPublishArticle({
          content: stripIndent`
        ---
        title: foo
        tags: zero, one,two, three, four
        ---
        `,
        })

        const spy = sinon.spy(vscode.window, 'showErrorMessage')

        await act()

        assert.ok(spy.calledOnce)
        assert.equal(spy.firstCall.args[0], `A maximum of 4 tags is supported`)

        await teardown(tmpDir)
      })
    })

    suite('valid article', () => {
      test('should post to the api when valid', async () => {
        const tmpDir = await setupPublishArticle({
          content: stripIndent`
        ---
        title: title
        ---

        some text here
        `,
        })

        const stub = sinon.stub(api)
        stub.postArticle.callsFake(async () => {})

        await act()

        assert.ok(stub.postArticle.calledOnce)

        await teardown(tmpDir)
      })

      test('should parse the frontmatter attributes', async () => {
        const tmpDir = await setupPublishArticle({
          content: stripIndent`
        ---
        title: title
        description: description
        published: false
        tags: foo, bar, baz
        series: series
        publish_under_org: true
        cover_image: cover_image
        canonical_url: canonical_url
        ---

        some text here
        `,
        })

        const stub = sinon.stub(api)
        stub.postArticle.callsFake(async () => {})

        await act()

        assert.ok(stub.postArticle.calledOnce)
        assert.equal(stub.postArticle.firstCall.args[0].article.title, 'title')
        assert.equal(stub.postArticle.firstCall.args[0].article.description, 'description')
        assert.equal(stub.postArticle.firstCall.args[0].article.published, false)
        assert.deepEqual(stub.postArticle.firstCall.args[0].article.tags, ['foo', 'bar', 'baz'])
        assert.equal(stub.postArticle.firstCall.args[0].article.series, 'series')
        assert.equal(stub.postArticle.firstCall.args[0].article.publish_under_org, true)
        assert.equal(stub.postArticle.firstCall.args[0].article.main_image, 'cover_image')
        assert.equal(stub.postArticle.firstCall.args[0].article.canonical_url, 'canonical_url')

        await teardown(tmpDir)
      })

      test('should parse the article post (with frontmatter in the body)', async () => {
        const content = stripIndent`
        ---
        title: title
        ---

        some text here
        `
        const tmpDir = await setupPublishArticle({
          content,
        })

        const stub = sinon.stub(api)
        stub.postArticle.callsFake(async () => {})

        await act()

        assert.ok(stub.postArticle.calledOnce)
        assert.ok(stub.postArticle.firstCall.args[0].article.body_markdown, content)

        await teardown(tmpDir)
      })

      test('should show a message if something went wrong server-side', async () => {
        const tmpDir = await setupPublishArticle({
          content: stripIndent`
        ---
        title: foo
        ---
        `,
        })

        const stub = sinon.stub(api)
        stub.postArticle.callsFake(async () => ({ error: 'foo' }))
        const spy = sinon.spy(vscode.window, 'showErrorMessage')

        await act()

        assert.ok(spy.calledOnce)
        assert.equal(spy.firstCall.args[0], `foo`)

        await teardown(tmpDir)
      })

      test.skip('should open the article in edit mode if not published', async () => {
        const tmpDir = await setupPublishArticle({
          content: stripIndent`
        ---
        title: foo
        published: false
        ---
        `,
        })

        const stub = sinon.stub(api)
        stub.postArticle.callsFake(async () => ({ url: 'foo' }))

        // TODO: can't redefine openExternal?
        const navigateStub = sinon.stub(vscode.env, 'openExternal').resolves(true as any)

        await act()

        assert.ok(navigateStub.calledOnce)
        assert.equal(navigateStub.firstCall.args[0], `foo/edit`)

        await teardown(tmpDir)
      })

      test.skip('should open the article if published', async () => {
        const tmpDir = await setupPublishArticle({
          content: stripIndent`
        ---
        title: foo
        published: true
        ---
        `,
        })

        const stub = sinon.stub(api)
        stub.postArticle.callsFake(async () => ({ url: 'foo' }))

        // TODO: can't redefine openExternal?
        const navigateStub = sinon.stub(vscode.env, 'openExternal').resolves(true as any)

        await act()

        assert.ok(navigateStub.calledOnce)
        assert.equal(navigateStub.firstCall.args[0], `foo`)

        await teardown(tmpDir)
      })
    })

    async function act() {
      await vscode.commands.executeCommand('devto.publishArticle')
    }

    async function setupPublishArticle({ openFile = true, content = template, token = '🤐' } = {}) {
      const tmpDir = await setup()
      await setToken(token)

      const filePath = path.join(tmpDir, 'awesome-article.md')
      fs.writeFileSync(filePath, content)
      if (openFile) {
        const doc = await vscode.workspace.openTextDocument(filePath)
        await vscode.window.showTextDocument(doc)
      }

      return tmpDir
    }
  })

  async function setup() {
    const tmpDir = path.resolve(os.tmpdir(), 'vscode-dev-to-tmp-' + Date.now())
    fs.mkdirSync(tmpDir)
    return tmpDir
  }

  async function teardown(tmpDir: string) {
    sinon.restore()
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
    await resetConfig()
    deactivate()
    rimraf.sync(tmpDir)
  }
})
