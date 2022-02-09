import { WebhookEditMessageOptions } from "discord.js";
import { RaceState } from "./RaceState";

export class AbortedState extends RaceState {
  onEnter() {
    this.race.cleanup();
    this.race.onComplete();
  }
  renderPublicMessage(): WebhookEditMessageOptions {
    return {
      content: "Race aborted, no participants",
      components: [],
    };
  }
}
