# Discrace

Discord bot for type racing

## Dependencies

- Node 17.4 or greater
- A Discord application, created from the developer portal

## Setup

`npm install`, then create a `.env` file with values:
| Key | Value |
| ----------- | ----------- |
| CLIENT_ID | Get this from the Discord developer portal for the app, in the `Oauth2` page |
| GUILD_ID | Turn on `Developer Mode` in your Discord app settings, right-click on the server name, select `Copy ID` |
| TOKEN | Get this from the Discord developer portal for the app, under the `Bot` page |
| HIDE_DEBUG_COMMANDS | Boolean to control whether debug commands are exposed |

If the bot has not been added to the server yet, create a link for the server administrator from the Discord developer portal `OAuth2 > URL Generator` page with the following permissions:

- Scopes > bot
- Scopes > application.commands
- Bot Permissions > General Permissions > Read Messages/View Channels
- Bot Permissions > Text Permissions > Send Messages

## NPM Scripts

- **dev**: Runs the development server in watch mode
- **build**: Create distribution
- **start**: Run distribution
- **deploy-commands**: Deploy the list of commands; only needed when changing the available commands

## Production Deployment

`main` branch automatically deploys to Heroku.
