import { WebhookEditMessageOptions } from "discord.js";
import { RaceState } from "./RaceState";

export class AbortedState extends RaceState {
  renderPublicMessage(): WebhookEditMessageOptions {
    return {
      content: "Race aborted, no participants",
      components: [],
    };
  }
}
