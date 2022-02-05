import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import raceTracker from "../raceTracker";
import Command from "../types/Command";

const PingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("race")
    .setDescription("Start a type race (in dev)"),
  async execute(interaction: BaseCommandInteraction) {
    await raceTracker.startRace(interaction);
  },
};

export default PingCommand;
