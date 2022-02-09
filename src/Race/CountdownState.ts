import {
  ButtonInteraction,
  User,
  MessageActionRow,
  MessageButton,
  WebhookEditMessageOptions,
  CacheType,
} from "discord.js";
import { RaceState } from "./RaceState";
import { AbortedState } from "./AbortedState";
import { InProgressState } from "./InProgressState";

const STARTING_RACE_COUNTDOWN_TICKS = 20;
const DEBUG_STARTING_RACE_COUNTDOWN_TICKS = 5;
const STARTING_RACE_COUNTDOWN_BROADCAST_THRESHOLD = 5;

export class CountdownState extends RaceState {
  remainingTicks: number = 0;
  onEnter(): void {
    this.remainingTicks = this.race.debugMode
      ? DEBUG_STARTING_RACE_COUNTDOWN_TICKS
      : STARTING_RACE_COUNTDOWN_TICKS;
    this.race.interaction.reply({
      ephemeral: this.race.debugMode,
      ...this.renderPublicMessage(),
    });
  }

  tick(): void {
    const race = this.race;
    if (this.shouldBroadcastRaceCountdown) {
      race.participants.forEach((p) => this.sendCountdownMessage(p));
    }

    this.remainingTicks--;

    if (this.remainingTicks <= 0) {
      this.start();
    }
  }

  async sendCountdownMessage(participant: User) {
    participant.send(this.remainingTicks + "...");
  }

  renderPublicMessage(): WebhookEditMessageOptions {
    const buttonRow = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("JOIN_RACE")
        .setLabel("Join")
        .setStyle("PRIMARY")
    );

    const countdown = `Race starting in ${this.remainingTicks} seconds...`;

    return {
      content: countdown + "\n" + this.race.renderParticipantList(),
      components: [buttonRow],
    };
  }

  consumeButtonInteraction(interaction: ButtonInteraction<CacheType>): void {
    let buttonId = interaction.customId;
    if (this.race.isJoinRaceButton(buttonId)) {
      this.race.addParticipant(interaction);
    }
  }

  start() {
    const race = this.race;
    if (race.hasNoParticipants) return race.setState(AbortedState);

    race.setState(InProgressState);
  }

  get shouldBroadcastRaceCountdown() {
    return this.remainingTicks <= STARTING_RACE_COUNTDOWN_BROADCAST_THRESHOLD;
  }
}
