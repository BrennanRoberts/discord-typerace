import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import raceTracker from "../raceTracker";
import { Command } from "../types";

const Command: Command = {
  isDebug: true,
  data: new SlashCommandBuilder()
    .setName("debug-race")
    .setDescription("[Debug] Start a type race"),
  async execute(interaction: BaseCommandInteraction) {
    await raceTracker.createRace(interaction, true);
  },
};

export default Command;
