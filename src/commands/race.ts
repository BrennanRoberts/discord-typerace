import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import raceTracker from "../raceTracker";
import { Command } from "../types";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("race")
    .setDescription("Start a type race"),
  async execute(interaction: BaseCommandInteraction) {
    await raceTracker.createRace(interaction);
  },
};

export default command;
