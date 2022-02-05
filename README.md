# Discrace

Discord bot for type racing

## Dependencies

- Node 16 or greater

## Setup

`npm install`, then create a `config.json` file with values:
| Key | Value |
| ----------- | ----------- |
| clientId | Get this from the Discord developer portal for the app, in the `Oauth2` page |
| guildId | Turn on `Developer Mode` in your Discord app settings, right-click on the server name, select `Copy ID` |
| token | Get this from the Discord developer portal for the app, under the `Bot` page |

If the bot has not been added to the server yet, create a link for the server administrator from the Discord developer portal `OAuth2 > URL Generator` page with the following permissions:

- Scopes > Bot
- Bot Permissions > General Permissions > Read Messages/View Channels
- Bot Permissions > Text Permissions > Send Messages

## NPM Scripts

- **start**: Runs the development server in watch mode
- **deploy-commands**: Deploy the list of commands; only needed when changing the available commands

## Production Deployment

No such thing yet.
