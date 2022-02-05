import { BaseCommandInteraction, Message } from "discord.js";
import Race from "./Race";
const quotes = require("./data/quotes.json");

interface Quote {
  content: string;
}

class RaceTracker {
  currentRace: Race | null;

  constructor() {
    this.currentRace = null;
  }

  async startRace(interaction: BaseCommandInteraction) {
    console.log("Starting race");
    const quote: Quote = quotes[Math.floor(Math.random() * quotes.length)];
    const race = new Race({
      string: quote.content,
      interaction: interaction,
    });
    await interaction.reply({ content: "Starting race", ephemeral: true });
    this.currentRace = race;
    race.start();
  }

  async consumeMessage(message: Message) {
    if (!this.currentRace) {
      message.author.send("No active race");
      return false;
    }

    await this.currentRace.consumeMessage(message);
    if (this.currentRace.isOver()) {
      await this.currentRace.sendCompletionMessage();
      this.currentRace = null;
    }
  }
}

export default new RaceTracker();
