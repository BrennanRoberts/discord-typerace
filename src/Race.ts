import {
  BaseCommandInteraction,
  ButtonInteraction,
  User,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js";
const quotes = require("./data/quotes.json");

const DEBUG_WAIT_TIME = 5000;
const WAIT_TIME = 20000;

const DEBUG_AUTOCOMPLETE_TIME = 5000;
const AUTOCOMPLETE_TIME = 30000;

enum RaceState {
  Initialized,
  Waiting,
  InProgress,
  Complete,
  AbortedNoParticipants,
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
    switch (this.state) {
      case RaceState.Waiting:
        this.interaction.editReply(this.renderWaiting());
        break;
      case RaceState.InProgress:
        this.renderInProgress();
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
    } seconds`;

    return {
      content: countdown + "\n" + this.renderParticipantList(),
      components: [buttonRow],
      ephemeral: this.debugMode,
    };
  }

  renderInProgress() {}

  renderParticipantList() {
    return this.participants
      .map((participant) => {
        return `🏎  ${participant.username}`;
      })
      .join("\n");
  }

  renderAbortedNoParticipants() {
    return {
      content: "Race aborted, no participants",
      ephemeral: this.debugMode,
    };
  }

  async start() {
    if (this.participants.length === 0) {
      this.state = RaceState.AbortedNoParticipants;
      await this.interaction.editReply(this.renderAbortedNoParticipants());
      this.cleanup();
      this.onComplete();
      return;
    }

    this.startTime = new Date();
    this.autocompleteTimeout = setTimeout(
      this.autocomplete.bind(this),
      this.debugMode ? DEBUG_AUTOCOMPLETE_TIME : AUTOCOMPLETE_TIME
    );

    await Promise.all(this.participants.map((p) => this.sendStartMessage(p)));
    await this.interaction.followUp({
      content: "Race started",
      ephemeral: this.debugMode,
    });
    this.state = RaceState.InProgress;
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
      await message.author.send("Nope.");
      return;
    }

    await message.author.send("Completed");
    this.markParticipantAsComplete(message.author);

    await this.interaction.followUp({
      content: "Participant finished",
      ephemeral: this.debugMode,
    });

    await this.checkCompletion();
  }

  async consumeButtonInteraction(interaction: ButtonInteraction) {
    if (interaction.customId === "JOIN_RACE") {
      await this.addParticipant(interaction.user);
    }
  }

  async addParticipant(participant: User) {
    if (this.participants.includes(participant)) return;

    this.participants.push(participant);
    participant.send({ content: "Race joined, prepare to type." });
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
    await this.sendCompletionMessage();
    this.state = RaceState.Complete;
    this.onComplete();
    this.cleanup();
  }

  async sendCompletionMessage() {
    const times = Object.entries(this.completionTimes)
      .map(([userId, time]) => {
        const participant = this.participants.find((p) => p.id === userId);
        return `${participant?.username}: ${time / 1000} seconds`;
      })
      .join("\n");

    this.interaction.followUp({
      content: "Race complete\n" + times,
      ephemeral: this.debugMode,
    });
  }

  cleanup() {
    if (this.renderInterval) {
      clearTimeout(this.renderInterval);
    }
  }
}
