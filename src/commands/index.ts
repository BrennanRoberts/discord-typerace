import { Collection } from "discord.js";
import Command from "../types/Command";
import PingCommand from "./ping";
import RaceCommand from "./race";

const commands = new Collection<string, Command>();

[PingCommand, RaceCommand].forEach((command) => {
  commands.set(command.data.name, command);
});

export default commands;
