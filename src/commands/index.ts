import { Collection } from "discord.js";
import { Command } from "../types";
import PingCommand from "./ping";
import RaceCommand from "./race";
import DebugRaceCommand from "./debug-race";
import "dotenv/config";
const { HIDE_DEBUG_COMMANDS } = process.env || false;

const commands = new Collection<string, Command>();

[PingCommand, RaceCommand, DebugRaceCommand].forEach((command) => {
  if (command.isDebug && HIDE_DEBUG_COMMANDS === "true") return;
  commands.set(command.data.name, command);
});

export default commands;
