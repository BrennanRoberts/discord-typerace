import {
  BaseCommandInteraction,
  ButtonInteraction,
  User,
  Message,
  MessageActionRow,
  MessageButton,
  WebhookEditMessageOptions,
  CacheType,
} from "discord.js";
import { Participant, CompletionTimes } from "./types";
import quotes from "./data/quotes.json";
import renderParticipantList from "./renderParticipantList";

const STARTING_RACE_COUNTDOWN_TICKS = 20;
const STARTING_RACE_COUNTDOWN_BROADCAST_THRESHOLD = 5;
const AUTOCOMPLETE_TICKS = 30;
const TICK_INTERVAL_MS = 1000;

const DEBUG_STARTING_RACE_COUNTDOWN_TICKS = 5;
const DEBUG_AUTOCOMPLETE_TICKS = 5;

interface onCompleteCallback {
  (): void;
}

interface ConstructorOptions {
  interaction: BaseCommandInteraction;
  onComplete: onCompleteCallback;
  debugMode: boolean;
}

interface Quote {
  content: string;
}

class RaceState {
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

class InitializedState extends RaceState {}
class CountdownState extends RaceState {
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
    if (race.hasNoParticipants) {
      race.setState(AbortedState);
      race.cleanup();
      race.onComplete();
      return;
    }

    race.startTime = new Date();

    race.setState(InProgressState);
  }
}

class InProgressState extends RaceState {
  onEnter(): void {
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

class CompleteState extends RaceState {
  renderPublicMessage(): WebhookEditMessageOptions {
    return {
      content:
        "```" + this.race.string + "```\n" + this.race.renderParticipantList(),
      components: [],
    };
  }
}

class AbortedState extends RaceState {
  renderPublicMessage(): WebhookEditMessageOptions {
    return {
      content: "Race aborted, no participants",
      components: [],
    };
  }
}

export default class Race {
  state: RaceState;
  string: string;
  interaction: BaseCommandInteraction;
  participants: User[];
  remainingRaceCountdownTicks: number;
  remainingAutocompleteTicks: number;
  startTime: Date | null;
  completionTimes: CompletionTimes;
  onComplete: onCompleteCallback;
  debugMode: boolean;
  tickInterval: ReturnType<typeof setInterval> | null;

  constructor(options: ConstructorOptions) {
    this.state = new InitializedState(this);
    this.interaction = options.interaction;
    this.onComplete = options.onComplete;
    this.debugMode = options.debugMode || false;
    this.string = this.debugMode ? "test string" : this.selectQuote();
    this.participants = [];
    this.remainingRaceCountdownTicks = this.debugMode
      ? DEBUG_STARTING_RACE_COUNTDOWN_TICKS
      : STARTING_RACE_COUNTDOWN_TICKS;
    this.remainingAutocompleteTicks = this.debugMode
      ? DEBUG_STARTING_RACE_COUNTDOWN_TICKS + DEBUG_AUTOCOMPLETE_TICKS
      : STARTING_RACE_COUNTDOWN_TICKS + AUTOCOMPLETE_TICKS;
    this.startTime = null;
    this.completionTimes = {};
    this.tickInterval = null;
  }

  setState(stateClass: { new (race: Race): RaceState }) {
    this.state = new stateClass(this);
    this.state.onEnter();
  }

  selectQuote() {
    const quote: Quote = quotes[Math.floor(Math.random() * quotes.length)];
    return quote.content;
  }

  async gatherParticipants() {
    this.setState(CountdownState);

    this.tickInterval = setInterval(this.tick.bind(this), TICK_INTERVAL_MS);
  }

  async tick() {
    console.log(this.state.constructor.name);
    this.state.tick();
    this.renderPublicStateMessage();
  }

  renderPublicStateMessage() {
    this.interaction.editReply(this.state.renderPublicMessage());
  }

  renderParticipantList(): string {
    return renderParticipantList(
      <Participant[]>this.participants,
      this.completionTimes,
      this.state instanceof CompleteState,
      this.string
    );
  }

  async sendStartMessage(participant: User) {
    participant.send("Go! \n```" + this.string.replace(/ /g, "\u2002") + "```");
  }

  async consumeMessage(message: Message) {
    this.state.consumeMessage(message);
  }

  async consumeButtonInteraction(interaction: ButtonInteraction) {
    this.state.consumeButtonInteraction(interaction);
  }

  async addParticipant(interaction: ButtonInteraction) {
    const participant = interaction.user;
    if (this.hasParticipant(participant)) return;

    this.participants.push(participant);
    participant.send({ content: "Race joined, prepare to type." });

    // Every interaction needs some sort of response or it will show an
    // "Interaction Failed" error. This is a no-op to keep it happy.
    interaction.update({});

    this.renderPublicStateMessage();
  }

  markParticipantAsComplete(participant: User) {
    if (!this.startTime) {
      return;
    }
    const completionTime = new Date().getTime() - this.startTime.getTime();
    this.completionTimes[participant.id] = completionTime;
  }

  async checkCompletion() {
    if (this.allParticipantsAreFinished) {
      this.complete();
    }
  }

  async autocomplete() {
    this.notifyUnfinishedParticipants();
    this.complete();
  }

  async notifyUnfinishedParticipants() {
    const unfinisedParticipants = this.participants.filter((p) => {
      return !this.completionTimes[p.id];
    });

    return Promise.all(
      unfinisedParticipants.map((p) => {
        p.send("❌  The race has ended.");
      })
    );
  }

  async complete() {
    this.setState(CompleteState);
    this.onComplete();
    this.cleanup();
  }

  cleanup() {
    this.renderPublicStateMessage();
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }
  }

  // CONDITIONALS
  get hasRemainingRaceCountdownTicks() {
    return this.remainingRaceCountdownTicks > 0;
  }
  get hasRemainingAutocompleteTicks() {
    return this.remainingAutocompleteTicks > 0;
  }
  get shouldBroadcastRaceCountdown() {
    return (
      this.remainingRaceCountdownTicks <=
      STARTING_RACE_COUNTDOWN_BROADCAST_THRESHOLD
    );
  }
  get hasNoParticipants() {
    return this.participants.length === 0;
  }
  get isRaceStateInProgress() {
    return this.state instanceof InProgressState;
  }
  isInputTextAccurate(messageContent: string) {
    return messageContent === this.string;
  }
  isJoinRaceButton(interactionId: string) {
    return interactionId === "JOIN_RACE";
  }
  hasParticipant(participant: User) {
    return this.participants.includes(participant);
  }
  get allParticipantsAreFinished() {
    return Object.keys(this.completionTimes).length >= this.participants.length;
  }
}
