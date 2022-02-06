import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import commands from "./commands/index";
import "dotenv/config";
const { CLIENT_ID, GUILD_ID, TOKEN } = process.env;

if (!CLIENT_ID || !GUILD_ID || !TOKEN)  process.exit();

const rest = new REST({ version: "9" }).setToken(TOKEN);

rest
  .put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
    body: commands.map((c) => c.data.toJSON()),
  })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);
