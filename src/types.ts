import { BaseCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

interface CommandExecuteFn {
  (interaction: BaseCommandInteraction): Promise<void>;
}

export interface Command {
  data: SlashCommandBuilder;
  execute: CommandExecuteFn;
}

export interface Participant {
  id: string;
  username: string;
}

export interface CompletionTimes {
  [id: string]: number;
}
