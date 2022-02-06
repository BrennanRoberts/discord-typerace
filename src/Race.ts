import {
  BaseCommandInteraction,
  ButtonInteraction,
  User,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js";
import quotes from "./data/quotes.json";

const DEBUG_WAIT_TIME = 5000;
const WAIT_TIME = 20000;
const STARTING_RACE_COUNTDOWN_TICKS = 5;
const RACE_COUNTDOWN_INTERVAL = 1000;

const DEBUG_AUTOCOMPLETE_TIME = 5000;
const AUTOCOMPLETE_TIME = 30000;

enum RaceState {
  Initialized = "initialized",
  Waiting = "waiting",
  RaceCountdown = "racecountdown",
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

interface CompletionTimes {
  [id: string]: number;
}

interface Quote {
  content: string;
}

export default class Race {
  state: RaceState;
  string: string;
  interaction: BaseCommandInteraction;
  participants: User[];
  waitingEndTime: number | null;
  remainingRaceCountdownTicks: number;
  startTime: Date | null;
  completionTimes: CompletionTimes;
  onComplete: onCompleteCallback;
  debugMode: boolean;
  autocompleteTimeout: ReturnType<typeof setTimeout> | null;
  renderInterval: ReturnType<typeof setInterval> | null;

  constructor(options: ConstructorOptions) {
    this.state = RaceState.Initialized;
    this.interaction = options.interaction;
    this.onComplete = options.onComplete;
    this.debugMode = options.debugMode || false;
    this.string = this.debugMode ? "test string" : this.selectQuote();
    this.participants = [];
    this.waitingEndTime = null;
    this.remainingRaceCountdownTicks = STARTING_RACE_COUNTDOWN_TICKS;
    this.startTime = null;
    this.completionTimes = {};
    this.autocompleteTimeout = null;
    this.renderInterval = null;
  }

  selectQuote() {
    const quote: Quote = quotes[Math.floor(Math.random() * quotes.length)];
    return quote.content;
  }

  async gatherParticipants() {
    this.state = RaceState.Waiting;

    const waitTime = this.debugMode ? DEBUG_WAIT_TIME : WAIT_TIME;
    this.waitingEndTime = Date.now() + waitTime;
    this.interaction.reply(this.renderWaiting());
    this.renderInterval = setInterval(this.render.bind(this), 1000);
    setTimeout(this.start.bind(this), waitTime);
  }

  render() {
    console.log("rendering " + this.state);
    switch (this.state) {
      case RaceState.Waiting:
        this.interaction.editReply(this.renderWaiting());
        break;
      case RaceState.RaceCountdown:
        this.interaction.editReply(this.renderRaceCountdown());
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

  renderWaiting() {
    const buttonRow = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("JOIN_RACE")
        .setLabel("Join")
        .setStyle("PRIMARY")
    );

    const countdown = `Race starting in ${
      this.waitingEndTime
        ? Math.ceil((this.waitingEndTime - Date.now()) / 1000)
        : 0
    } seconds...`;

    return {
      content: countdown + "\n" + this.renderParticipantList(),
      components: [buttonRow],
      ephemeral: this.debugMode,
    };
  }

  renderRaceCountdown() {
    return {
      content: `Race is beginning in ${this.remainingRaceCountdownTicks} seconds...`,
      components: [],
      ephemeral: this.debugMode,
    };
  }

  renderInProgress() {
    return {
      content: "Race in progress\n" + this.renderParticipantList(),
      components: [],
      ephemeral: this.debugMode,
    };
  }

  renderComplete() {
    return {
      content: "Race complete\n" + this.renderParticipantList(),
      components: [],
      ephemeral: this.debugMode,
    };
  }

  renderParticipantList() {
    return this.participants
      .map((participant) => {
        const completionTime = this.completionTimes[participant.id];
        const completeMark = completionTime
          ? ` ✅ (${completionTime / 1000})`
          : "";
        return `🏎  ${participant.username}${completeMark}`;
      })
      .join("\n");
  }

  renderAbortedNoParticipants() {
    return {
      content: "Race aborted, no participants",
      components: [],
      ephemeral: this.debugMode,
    };
  }

  async start() {
    if (this.participants.length === 0) {
      this.state = RaceState.AbortedNoParticipants;
      this.cleanup();
      this.onComplete();
      return;
    }

    this.startRaceCountdown();
  }

  async startRaceCountdown() {
    await this.tickRaceCountdown();
    this.state = RaceState.RaceCountdown;
  }

  async tickRaceCountdown() {
    await Promise.all(
      this.participants.map((p) => this.sendCountdownMessage(p))
    );
    this.remainingRaceCountdownTicks--;
    setTimeout(this.nextTickAction.bind(this), RACE_COUNTDOWN_INTERVAL);
  }

  get nextTickAction() {
    return this.remainingRaceCountdownTicks
      ? this.tickRaceCountdown
      : this.startRace;
  }

  async startRace() {
    this.startTime = new Date();
    this.autocompleteTimeout = setTimeout(
      this.autocomplete.bind(this),
      this.debugMode ? DEBUG_AUTOCOMPLETE_TIME : AUTOCOMPLETE_TIME
    );

    await Promise.all(this.participants.map((p) => this.sendStartMessage(p)));
    this.state = RaceState.InProgress;
  }

  async sendCountdownMessage(participant: User) {
    participant.send(this.remainingRaceCountdownTicks + "...");
  }

  async sendStartMessage(participant: User) {
    participant.send("Go! \n```" + this.string + "```");
  }

  async consumeMessage(message: Message) {
    if (this.state !== RaceState.InProgress) {
      await message.author.send("Race isn't active.");
      return;
    }

    if (message.content !== this.string) {
      await message.author.send("Oops, something wasn't quite right.");
      return;
    }

    await message.author.send("Completed");
    this.markParticipantAsComplete(message.author);

    await this.checkCompletion();
  }

  async consumeButtonInteraction(interaction: ButtonInteraction) {
    if (interaction.customId === "JOIN_RACE") {
      await this.addParticipant(interaction);
    }
  }

  async addParticipant(interaction: ButtonInteraction) {
    const participant = interaction.user;
    if (this.participants.includes(participant)) return;

    this.participants.push(participant);
    participant.send({ content: "Race joined, prepare to type." });

    // Every interaction needs some sort of response or it will show an
    // "Interaction Failed" error. This is a no-op to keep it happy.
    interaction.update({});

    this.render();
  }

  markParticipantAsComplete(participant: User) {
    if (!this.startTime) {
      return;
    }
    const completionTime = new Date().getTime() - this.startTime.getTime();
    this.completionTimes[participant.id] = completionTime;
  }

  async checkCompletion() {
    if (Object.keys(this.completionTimes).length >= this.participants.length) {
      this.complete();
    }
  }

  async autocomplete() {
    this.complete();
  }

  async complete() {
    if (this.autocompleteTimeout) {
      clearTimeout(this.autocompleteTimeout);
    }
    this.state = RaceState.Complete;
    this.onComplete();
    this.cleanup();
  }

  cleanup() {
    this.render();
    if (this.renderInterval) {
      clearTimeout(this.renderInterval);
    }
  }
}
