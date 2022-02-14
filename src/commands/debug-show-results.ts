import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import UserResults from "../models/Users";
import { Command } from "../types";

const Command: Command = {
  isDebug: true,
  data: new SlashCommandBuilder()
    .setName("debug-show-results")
    .setDescription("[Debug] Show Results records"),
  async execute(interaction: BaseCommandInteraction) {
    const results = await UserResults.readTopScorers();
    console.log(results);
    const formattedTopScorers = results
      .map((r) => `<@!${r._id}>: ${r.averageWpm} wpm`)
      .join("\n");
    interaction.reply({ content: formattedTopScorers, ephemeral: true });
  },
};

export default Command;
