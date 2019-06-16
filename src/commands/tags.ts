import * as vscode from 'vscode'
import { getTags, setTags } from '../configuration'

export async function addTagHandler() {
  const tagToAdd = await vscode.window.showInputBox({
    ignoreFocusOut: true,
    prompt: 'Please enter the tag you want to add (use , to add multiple tags)',
    value: ``,
  })
  if (!tagToAdd) {
    return
  }

  const currentTags = getTags()
  const tagsToAdds = tagToTags(tagToAdd)
  const newTags = [...new Set(currentTags.concat(tagsToAdds))]
  return await setTags(newTags)
}

export async function removeTagHandler(tag: string | undefined) {
  const currentTags = getTags()
  // removing can be done by clicking on the remove button or via the command palette
  // via the button tagToRemove will be the tag, otherwise ask for the task
  const tagsToRemove = tag
    ? tagToTags(tag)
    : (await vscode.window.showQuickPick(currentTags, {
        ignoreFocusOut: true,
        canPickMany: true,
      })) || []

  const newTags = currentTags.filter(tag => !tagsToRemove.includes(tag))
  return await setTags(newTags)
}

function tagToTags(tag: string) {
  return (tag || '').split(',').map(t => t.trim())
}
