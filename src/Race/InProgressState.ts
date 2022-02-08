import { Message, WebhookEditMessageOptions } from "discord.js";
import { RaceState } from "./RaceState";

export class InProgressState extends RaceState {
  onEnter(): void {
    this.race.startTime = new Date();
    this.race.participants.forEach((p) => this.race.sendStartMessage(p));
  }

  tick(): void {
    this.race.remainingAutocompleteTicks--;
    if (!this.race.hasRemainingAutocompleteTicks) {
      this.race.autocomplete();
    }
  }

  renderPublicMessage(): WebhookEditMessageOptions {
    return {
      content:
        "Race in progress\n" +
        this.race.renderParticipantList() +
        "\nRace ending in " +
        this.race.remainingAutocompleteTicks +
        " seconds",
      components: [],
    };
  }

  consumeMessage(message: Message): void {
    let inputText = message.content;
    if (!this.race.isInputTextAccurate(inputText)) {
      message.author.send("Oops, something wasn't quite right.");
      return;
    }

    message.author.send("Completed");
    this.race.markParticipantAsComplete(message.author);
    this.race.checkCompletion();
  }
}
