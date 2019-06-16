import * as vscode from 'vscode'

export function getConfig(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration('devto')
}

export function getTags(): Config['tags'] {
  return getConfig().get('tags', [])
}

export async function setTags(tags: Config['tags']): Promise<void> {
  return await getConfig().update('tags', tags, vscode.ConfigurationTarget.Global)
}

export function getToken(): Config['token'] {
  return getConfig().get('token', '')
}

export async function setToken(token: string) {
  return await getConfig().update('token', token, vscode.ConfigurationTarget.Global)
}

export interface Config {
  tags: string[]
  showExplorer: boolean
  token: string
}
