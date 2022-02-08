import { Message, WebhookEditMessageOptions } from "discord.js";
import { RaceState } from "./RaceState";

const AUTOCOMPLETE_TICKS = 30;
const DEBUG_AUTOCOMPLETE_TICKS = 10;

export class InProgressState extends RaceState {
  remainingTicks: number = 0;
  onEnter(): void {
    this.remainingTicks = this.race.debugMode
      ? DEBUG_AUTOCOMPLETE_TICKS
      : AUTOCOMPLETE_TICKS;
    this.race.startTime = new Date();
    this.race.participants.forEach((p) => this.race.sendStartMessage(p));
  }

  tick(): void {
    this.remainingTicks--;
    if (this.remainingTicks <= 0) {
      this.race.autocomplete();
    }
  }

  renderPublicMessage(): WebhookEditMessageOptions {
    return {
      content:
        "Race in progress\n" +
        this.race.renderParticipantList() +
        "\nRace ending in " +
        this.remainingTicks +
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
