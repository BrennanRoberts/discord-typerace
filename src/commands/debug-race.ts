import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import raceTracker from "../raceTracker";
import Command from "../types/Command";

const Command: Command = {
  data: new SlashCommandBuilder()
    .setName("debug-race")
    .setDescription("[Debug] Start a type race (in dev)"),
  async execute(interaction: BaseCommandInteraction) {
    await raceTracker.createRace(interaction, true);
  },
};

export default Command;
