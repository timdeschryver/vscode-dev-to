# Dev.to in Visual Studio Code

![Image showing the dev.to explorer and a new article template](https://raw.githubusercontent.com/timdeschryver/vscode-dev-to/master/other/devto.png)

## Commands

### The dev.to explorer

| Command          | Description                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Refresh Articles | Refreshes the articles                                                                            |
| Add Tag          | Adds a new tag, you can add multiple tags at once with a comma-delimited value (`React, Angular`) |
| Remove Tag       | Removes a tag(s)                                                                                  |

### Writing an article

| Command         | Description                                                |
| --------------- | ---------------------------------------------------------- |
| Create Article  | Creates a new markdown file based on the dev.to template   |
| Insert Template | Inserts the dev.to template at the current cursor position |
| Publish Article | Publishes the current file to dev.to                       |
| Set Token       | Sets the dev.to token in VSCode's settings file            |

## Settings

| Property             | Type     | Default   | Description                      |
| -------------------- | -------- | --------- | -------------------------------- |
| `devto.showExplorer` | boolean  | `true`    | Show or hide the dev.to explorer |
| `devto.tags`         | string[] | `['Top']` | Tags array                       |
| `devto.token`        | string   | `''`      | Your dev.to token                |

## Creating a dev.to token

The token is required in order to publish articles.

To create a token, go to [dev.to/settings/account](https://dev.to/settings/account) and click on "Generate Token".

## The dev.to template

```md
---
title:
published: false
description:
tags:
---
```
