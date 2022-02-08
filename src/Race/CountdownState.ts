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

export class CountdownState extends RaceState {
  onEnter(): void {
    this.race.interaction.reply({
      ephemeral: this.race.debugMode,
      ...this.renderPublicMessage(),
    });
  }

  tick(): void {
    const race = this.race;
    if (race.shouldBroadcastRaceCountdown) {
      race.participants.forEach((p) => this.sendCountdownMessage(p));
    }

    race.remainingRaceCountdownTicks--;

    if (!race.hasRemainingRaceCountdownTicks) {
      this.start();
    }
  }

  async sendCountdownMessage(participant: User) {
    participant.send(this.race.remainingRaceCountdownTicks + "...");
  }

  renderPublicMessage(): WebhookEditMessageOptions {
    const buttonRow = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("JOIN_RACE")
        .setLabel("Join")
        .setStyle("PRIMARY")
    );

    const countdown = `Race starting in ${this.race.remainingRaceCountdownTicks} seconds...`;

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
}
