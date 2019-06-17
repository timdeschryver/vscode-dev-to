import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import * as frontMatter from 'front-matter'
import { getToken } from '../configuration'
import { postArticle, PostArticle } from '../api'

export async function createArticleHandler(args: any) {
  if (!args) {
    args = { _fsPath: vscode.workspace.rootPath }
  }

  const fileInput = await vscode.window.showInputBox({
    ignoreFocusOut: true,
    prompt: 'Please enter the filename',
    value: `article.md`,
  })

  if (typeof fileInput === 'undefined') {
    return
  }

  const filename = path.isAbsolute(fileInput) ? fileInput : path.join(args._fsPath, fileInput)

  const filepath = correctExtension(filename)
  if (fs.existsSync(filepath)) {
    vscode.window.showErrorMessage(`File '${filepath}' already exists`)
    return
  }

  fs.writeFileSync(filepath, '', { encoding: 'utf8' })

  const doc = await vscode.workspace.openTextDocument(filepath)
  await vscode.window.showTextDocument(doc)
  await vscode.commands.executeCommand('devto.insertTemplate')
}

export async function insertTemplateHandler() {
  const templatePath = getTemplate()
  const doc = await vscode.workspace.openTextDocument(templatePath)
  const text = doc.getText()

  if (!vscode.window.activeTextEditor) {
    return
  }

  await vscode.window.activeTextEditor.edit(editBuilder => {
    vscode.window.activeTextEditor!.selections.forEach(selection => {
      editBuilder.replace(selection, '')
      editBuilder.insert(selection.active, text)
    })
  })

  await vscode.window.activeTextEditor!.document.save()
}

export function publishArticleHandler() {
  if (!vscode.window.activeTextEditor) {
    vscode.window.showErrorMessage('You have to have the article open in order to publish it')
    return
  }

  const token = getToken()
  if (!token) {
    vscode.window.showErrorMessage('You must provide a dev.to token')
    return
  }

  try {
    const post = vscode.window.activeTextEditor.document.getText()
    const { attributes, body }: { attributes: any; body: string } = frontMatter(post)
    publish(body, attributes, token)
  } catch (err) {
    vscode.window.showErrorMessage(err)
  }
}

function correctExtension(filename: string, extension = 'md') {
  if (path.extname(filename) === `.${extension}`) {
    return filename
  }

  if (filename.endsWith('.')) {
    return `${filename}${extension}`
  }

  return `${filename}.${extension}`
}

function getTemplate() {
  const extensionPath = vscode.extensions.getExtension('timdeschryver.vscode-dev-to')!.extensionPath
  return `${extensionPath}/templates/devto.template`
}

async function publish(body: string, frontMatter: any, token: string) {
  const data: PostArticle = {
    article: {
      title: frontMatter['title'],
      description: frontMatter['description'],
      published: frontMatter['published'],
      tags: frontMatter['tags'] ? frontMatter['tags'].split(',').map((p: string) => p.trim()) : [],
      series: frontMatter['series'],
      organization_id: frontMatter['organization_id'],
      main_image: frontMatter['cover_image'],
      canonical_url: frontMatter['canonical_url'],
      body_markdown: body,
    },
  }

  // The docs mention this isn't required, but it's required?
  if (!data.article.title) {
    vscode.window.showErrorMessage('Title attribute is required')
    return
  }

  if (data.article.tags && data.article.tags.length > 4) {
    vscode.window.showErrorMessage('A maximum of 4 tags is supported')
    return
  }

  await postArticle(data, token)
    .then((response: any) => {
      if (response.error) {
        vscode.window.showErrorMessage(response.error)
      } else {
        vscode.window.showInformationMessage(`Post has successfully been published to dev.to`)

        // the post will only be accessible if it's published
        const url = data.article.published ? response.url : `${response.url}/edit`
        vscode.commands.executeCommand('devto.openArticle', url)
      }
    })
    .catch((err: any) => {
      vscode.window.showErrorMessage(err)
    })
}
