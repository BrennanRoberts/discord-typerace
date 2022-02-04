import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import Command from "../types/Command";

const PingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  async execute(interaction: BaseCommandInteraction) {
    await interaction.reply({
      content: "Pong!",
      ephemeral: true,
    });
  },
};

export default PingCommand;
