import { BaseCommandInteraction, User } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

interface CommandExecuteFn {
  (interaction: BaseCommandInteraction): Promise<void>;
}

export interface Command {
  isDebug?: boolean;
  data: SlashCommandBuilder;
  execute: CommandExecuteFn;
}

export interface Participant {
  id: string;
  renderName: string;
}

export interface CompletionTimes {
  [id: string]: number;
}

export type DiscracedUser = User & { renderName: string }
