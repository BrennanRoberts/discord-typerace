import {
  BaseCommandInteraction,
  Message,
  ButtonInteraction,
  MessageComponentInteraction,
} from "discord.js";
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

  async createRace(interaction: BaseCommandInteraction) {
    if (this.currentRace) {
      await interaction.reply({
        content: "A race is already active",
        ephemeral: true,
      });
      return;
    }

    console.log("Creating a race");
    const quote: Quote = quotes[Math.floor(Math.random() * quotes.length)];
    const race = new Race({
      string: quote.content,
      interaction: interaction,
      onComplete: this.onRaceComplete.bind(this),
    });

    await race.gatherParticipants();
    this.currentRace = race;
  }

  async consumeMessage(message: Message) {
    if (!this.currentRace) {
      message.author.send("No active race");
      return false;
    }

    await this.currentRace.consumeMessage(message);
  }

  onRaceComplete() {
    this.currentRace = null;
  }

  async consumeButtonInteraction(interaction: ButtonInteraction) {
    console.log(interaction.customId);
    if (!this.currentRace) {
      return;
    }

    await this.currentRace.consumeButtonInteraction(interaction);
  }
}

export default new RaceTracker();
