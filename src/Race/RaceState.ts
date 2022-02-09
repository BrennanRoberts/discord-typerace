import {
  ButtonInteraction,
  Message,
  WebhookEditMessageOptions,
} from "discord.js";
import Race from "../Race/Race";

export class RaceState {
  race: Race;
  constructor(race: Race) {
    this.race = race;
  }
  onEnter(): void {}
  tick(): void {}
  renderPublicMessage(): WebhookEditMessageOptions {
    return {};
  }
  consumeMessage(message: Message) {
    message.author.send("Race isn't active.");
  }
  consumeButtonInteraction(interaction: ButtonInteraction) {}
}
