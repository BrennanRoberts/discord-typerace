import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import UserResults from "../models/Users";
import { Command } from "../types";

const Command: Command = {
  isDebug: true,
  data: new SlashCommandBuilder()
    .setName("debug-save-result")
    .setDescription("[Debug] Save a Results record"),
  async execute(interaction: BaseCommandInteraction) {
    await UserResults.save(
      interaction.user.id,
      Math.floor(Math.random() * 100),
      0
    );
    interaction.reply({ content: "ok", ephemeral: true });
  },
};

export default Command;
