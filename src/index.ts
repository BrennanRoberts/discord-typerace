import {
  Client,
  Intents,
  Interaction,
  ButtonInteraction,
  Message,
} from "discord.js";
import commands from "./commands/index";
import raceTracker from "./raceTracker";
import "dotenv/config";

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES],
});

client.once("ready", (client) => {
  console.log(`Ready! Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (interaction.isButton()) {
    return await raceTracker.consumeButtonInteraction(
      <ButtonInteraction>interaction
    );
  }

  if (!interaction.isCommand()) return;

  const command = commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

client.on("message", async (message: Message) => {
  if (message.author.bot) return;

  raceTracker.consumeMessage(message);
});

client.login(process.env.TOKEN);
