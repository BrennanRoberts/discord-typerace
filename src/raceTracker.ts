import { BaseCommandInteraction, Message, ButtonInteraction } from "discord.js";
import Race from "./Race/Race";

class RaceTracker {
  currentRace: Race | null;

  constructor() {
    this.currentRace = null;
  }

  async createRace(interaction: BaseCommandInteraction, debugMode = false) {
    if (this.currentRace) {
      await interaction.reply({
        content: "A race is already active",
        ephemeral: true,
      });
      return;
    }

    console.log("Creating a race");
    const race = new Race({
      interaction: interaction,
      onComplete: this.onRaceComplete.bind(this),
      debugMode: debugMode,
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
    if (!this.currentRace) {
      return;
    }

    await this.currentRace.consumeButtonInteraction(interaction);
  }
}

export default new RaceTracker();
