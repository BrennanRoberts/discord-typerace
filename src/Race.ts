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
  startTime: Date | null;
  completionTimes: CompletionTimes;
  onComplete: onCompleteCallback;
  debugMode: boolean;
  autocompleteTimeout: ReturnType<typeof setTimeout> | null;

  constructor(options: ConstructorOptions) {
    this.state = RaceState.Initialized;
    this.interaction = options.interaction;
    this.onComplete = options.onComplete;
    this.debugMode = options.debugMode || false;
    this.string = this.debugMode ? "test string" : this.selectQuote();
    this.participants = [];
    this.startTime = null;
    this.completionTimes = {};
    this.autocompleteTimeout = null;
  }

  selectQuote() {
    const quote: Quote = quotes[Math.floor(Math.random() * quotes.length)];
    return quote.content;
  }

  async gatherParticipants() {
    this.state = RaceState.Waiting;

    const buttonRow = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("JOIN_RACE")
        .setLabel("Join")
        .setStyle("PRIMARY")
    );

    const waitTime = this.debugMode ? DEBUG_WAIT_TIME : WAIT_TIME;
    this.interaction.reply({
      content: `Race created, starting in ${waitTime / 1000} seconds`,
      components: [buttonRow],
      ephemeral: this.debugMode,
    });
    setTimeout(this.start.bind(this), waitTime);
  }

  async start() {
    if (this.participants.length === 0) {
      await this.interaction.followUp({
        content: "Race aborted, no participants",
        ephemeral: this.debugMode,
      });

      this.state = RaceState.Complete;
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
      interaction.reply({ content: "Race joined", ephemeral: true });
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
}
