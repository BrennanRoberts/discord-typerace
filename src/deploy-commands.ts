import fs from "fs";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import commands from "./commands/index";
const { clientId, guildId, token } = require("../config.json");

const rest = new REST({ version: "9" }).setToken(token);

rest
  .put(Routes.applicationGuildCommands(clientId, guildId), {
    body: commands.map((c) => c.data.toJSON()),
  })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);
