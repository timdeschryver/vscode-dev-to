import * as vscode from 'vscode'
import * as assert from 'assert'
import * as sinon from 'sinon'
import { setTags, getTags } from '../configuration'
import { deactivate } from '../extension'
import { resetConfig } from './utils'

suite('Tags', () => {
  suite('addTag', () => {
    test('should add a tag to the config', async () => {
      await setup(['Vue'])

      const tags = await act('Angular')

      assert.deepStrictEqual(tags, ['Vue', 'Angular'])

      await teardown()
    })

    test('should add multiple tags to the config', async () => {
      await setup()

      const tags = await act('Angular, React')

      assert.deepStrictEqual(tags, ['Angular', 'React'])

      await teardown()
    })

    async function act(tag: string) {
      const stub = await sinon.stub(vscode.window, 'showInputBox').resolves(tag)
      await vscode.commands.executeCommand('devto.addTag')
      stub.restore()
      const tagsConfig = getTags()
      return tagsConfig
    }
  })

  suite('removeTag', () => {
    test('should remove a tag to the config', async () => {
      await setup(['Angular'])

      const tags = await act(['Angular'])

      assert.deepStrictEqual(tags, [])

      await teardown()
    })

    test('should remove multiple tags to the config', async () => {
      await setup(['Angular', 'React', 'Vue'])

      const tags = await act(['Angular', 'React'])

      assert.deepStrictEqual(tags, ['Vue'])

      await teardown()
    })

    async function act(tags: string[]) {
      const stub = await sinon.stub(vscode.window, 'showQuickPick').resolves(tags as any)
      await vscode.commands.executeCommand('devto.removeTag')
      stub.restore()
      const tagsConfig = getTags()
      return tagsConfig
    }
  })

  async function setup(tags: string[] = []) {
    await setTags(tags)
  }

  async function teardown() {
    sinon.restore()
    deactivate()
    await resetConfig()
  }
})
