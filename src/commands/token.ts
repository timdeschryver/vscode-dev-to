import * as vscode from 'vscode'
import { setToken } from '../configuration'

export async function setTokenHandler() {
  const token = await vscode.window.showInputBox({
    ignoreFocusOut: true,
    prompt: 'Please enter your dev.to token, the token can be generated at https://dev.to/settings/account',
    value: ``,
  })

  return await setToken(token || '')
}
