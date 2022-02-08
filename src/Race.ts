import {
  BaseCommandInteraction,
  ButtonInteraction,
  User,
  Message,
  MessageActionRow,
  MessageButton,
  WebhookEditMessageOptions,
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

enum RaceState {
  Initialized = "initialized",
  Countdown = "countdown",
  ReadyToStart = "readytostart",
  InProgress = "inprogress",
  Complete = "complete",
  AbortedNoParticipants = "abortednoparticipants",
}

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
    this.state = RaceState.Initialized;
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

  selectQuote() {
    const quote: Quote = quotes[Math.floor(Math.random() * quotes.length)];
    return quote.content;
  }

  async gatherParticipants() {
    this.state = RaceState.Countdown;

    this.interaction.reply({
      ephemeral: this.debugMode,
      ...this.renderCountdown(),
    });

    this.tickInterval = setInterval(
      await this.tick.bind(this),
      TICK_INTERVAL_MS
    );
  }

  async tick() {
    if (this.isRaceStateReadyToStart) {
      this.start();
    }
    if (this.isRaceStateCountdown) {
      await this.handleRaceCountdown();
    }
    this.renderPublicStateMessage();
    this.handleAutocompleteTimeout();
  }

  handleAutocompleteTimeout() {
    this.remainingAutocompleteTicks--;
    if (!this.hasRemainingAutocompleteTicks) {
      this.autocomplete();
    }
  }

  async handleRaceCountdown() {
    if (this.shouldBroadcastRaceCountdown) {
      await Promise.all(
        this.participants.map((p) => this.sendCountdownMessage(p))
      );
    }
    this.remainingRaceCountdownTicks--;
    if (!this.hasRemainingRaceCountdownTicks) {
      this.state = RaceState.ReadyToStart;
    }
  }

  renderPublicStateMessage() {
    console.log("rendering " + this.state);
    switch (this.state) {
      case RaceState.Countdown:
      case RaceState.ReadyToStart:
        this.interaction.editReply(this.renderCountdown());
        break;
      case RaceState.InProgress:
        this.interaction.editReply(this.renderInProgress());
        break;
      case RaceState.Complete:
        this.interaction.editReply(this.renderComplete());
        break;
      case RaceState.AbortedNoParticipants:
        this.interaction.editReply(this.renderAbortedNoParticipants());
        break;
    }
  }

  renderCountdown(): WebhookEditMessageOptions {
    const buttonRow = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("JOIN_RACE")
        .setLabel("Join")
        .setStyle("PRIMARY")
    );

    const countdown = `Race starting in ${this.remainingRaceCountdownTicks} seconds...`;

    return {
      content: countdown + "\n" + this.renderParticipantList(),
      components: [buttonRow],
    };
  }

  renderInProgress(): WebhookEditMessageOptions {
    return {
      content:
        "Race in progress\n" +
        this.renderParticipantList() +
        "\nRace ending in " +
        this.remainingAutocompleteTicks +
        " seconds",
      components: [],
    };
  }

  renderComplete(): WebhookEditMessageOptions {
    return {
      content: "```" + this.string + "```\n" + this.renderParticipantList(),
      components: [],
    };
  }

  renderParticipantList(): string {
    return renderParticipantList(
      <Participant[]>this.participants,
      this.completionTimes,
      this.state == RaceState.Complete,
      this.string
    );
  }

  renderAbortedNoParticipants() {
    return {
      content: "Race aborted, no participants",
      components: [],
      ephemeral: this.debugMode,
    };
  }

  async start() {
    if (this.hasNoParticipants) {
      this.state = RaceState.AbortedNoParticipants;
      this.cleanup();
      this.onComplete();
      return;
    }

    this.startRace();
  }

  async startRace() {
    this.startTime = new Date();

    await Promise.all(this.participants.map((p) => this.sendStartMessage(p)));
    this.state = RaceState.InProgress;
  }

  async sendCountdownMessage(participant: User) {
    participant.send(this.remainingRaceCountdownTicks + "...");
  }

  async sendStartMessage(participant: User) {
    participant.send("Go! \n```" + this.string.replace(/ /g, "\u2002") + "```");
  }

  async consumeMessage(message: Message) {
    if (!this.isRaceStateInProgress) {
      await message.author.send("Race isn't active.");
      return;
    }

    let inputText = message.content;
    if (!this.isInputTextAccurate(inputText)) {
      await message.author.send("Oops, something wasn't quite right.");
      return;
    }

    await message.author.send("Completed");
    this.markParticipantAsComplete(message.author);

    await this.checkCompletion();
  }

  async consumeButtonInteraction(interaction: ButtonInteraction) {
    let buttonId = interaction.customId;
    if (this.isJoinRaceButton(buttonId)) {
      await this.addParticipant(interaction);
    }
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
    this.state = RaceState.Complete;
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
  get isRaceStateReadyToStart() {
    return this.state === RaceState.ReadyToStart;
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
  get isRaceStateCountdown() {
    return this.state === RaceState.Countdown;
  }
  get hasNoParticipants() {
    return this.participants.length === 0;
  }
  get isRaceStateInProgress() {
    return this.state === RaceState.InProgress;
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
