import { BaseCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

interface CommandExecuteFn {
  (interaction: BaseCommandInteraction): Promise<void>;
}

export default interface Command {
  data: SlashCommandBuilder;
  execute: CommandExecuteFn;
}
