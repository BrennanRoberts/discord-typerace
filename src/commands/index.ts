import { Collection } from "discord.js";
import Command from "../types/Command";
import PingCommand from "./ping";

const commands = new Collection<string, Command>();

commands.set(PingCommand.data.name, PingCommand);

export default commands;
