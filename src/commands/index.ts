import { Collection } from "discord.js";
import { Command } from "../types";
import PingCommand from "./ping";
import RaceCommand from "./race";
import DebugRaceCommand from "./debug-race";

const commands = new Collection<string, Command>();

[PingCommand, RaceCommand, DebugRaceCommand].forEach((command) => {
  commands.set(command.data.name, command);
});

export default commands;
