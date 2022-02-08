import { WebhookEditMessageOptions } from "discord.js";
import { RaceState } from "./RaceState";

export class CompleteState extends RaceState {
  renderPublicMessage(): WebhookEditMessageOptions {
    return {
      content:
        "```" + this.race.string + "```\n" + this.race.renderParticipantList(),
      components: [],
    };
  }
}
