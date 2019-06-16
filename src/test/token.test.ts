import * as vscode from 'vscode'
import * as assert from 'assert'
import * as sinon from 'sinon'
import { setToken, getToken } from '../configuration'
import { deactivate } from '../extension'
import { resetConfig } from './utils'

suite('Token', () => {
  suite('setToken', () => {
    test('should create a token', async () => {
      await setup('')

      const token = await act('secure-token')

      assert.equal(token, 'secure-token')

      await teardown()
    })

    test('should update the token', async () => {
      await setup('secure-token')

      const token = await act('')

      assert.equal(token, '')

      await teardown()
    })

    async function act(token: string) {
      const stub = await sinon.stub(vscode.window, 'showInputBox').resolves(token as any)
      await vscode.commands.executeCommand('devto.setToken')
      stub.restore()
      const tokenConfig = getToken()
      return tokenConfig
    }
  })

  suite('getToken', () => {
    test('should get the token', async () => {
      await setup('tim-was-here')

      const token = getToken()

      assert.equal(token, 'tim-was-here')

      await teardown()
    })
  })

  async function setup(token: string) {
    await setToken(token)
  }

  async function teardown() {
    sinon.restore()
    deactivate()
    await resetConfig()
  }
})
