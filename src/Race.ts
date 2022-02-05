import {
  BaseCommandInteraction,
  ButtonInteraction,
  User,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js";
const { debug } = require("../config.json");

const WAIT_TIME = 20000;

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
  string: string;
  interaction: BaseCommandInteraction;
  onComplete: onCompleteCallback;
}

interface CompletionTimes {
  [id: string]: number;
}

export default class Race {
  state: RaceState;
  string: string;
  interaction: BaseCommandInteraction;
  participants: User[];
  startTime: Date | null;
  completionTimes: CompletionTimes;
  onComplete: onCompleteCallback;

  constructor(options: ConstructorOptions) {
    this.state = RaceState.Initialized;
    this.string = options.string;
    this.interaction = options.interaction;
    this.onComplete = options.onComplete;
    this.participants = [];
    //this.participants = [this.interaction.user];
    this.startTime = null;
    this.completionTimes = {};
  }

  async gatherParticipants() {
    this.state = RaceState.Waiting;

    const buttonRow = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("JOIN_RACE")
        .setLabel("Join")
        .setStyle("PRIMARY")
    );

    this.interaction.reply({
      content: `Race created, starting in ${WAIT_TIME} seconds`,
      components: [buttonRow],
      ephemeral: debug,
    });
    setTimeout(this.start.bind(this), WAIT_TIME);
  }

  async start() {
    if (this.participants.length === 0) {
      await this.interaction.followUp({
        content: "Race aborted, no participants",
        ephemeral: debug,
      });

      this.state = RaceState.Complete;
      this.onComplete();
      return;
    }

    this.startTime = new Date();
    await Promise.all(this.participants.map((p) => this.sendStartMessage(p)));
    await this.interaction.followUp({
      content: "Race started",
      ephemeral: debug,
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
      ephemeral: debug,
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
      await this.sendCompletionMessage();
      this.state = RaceState.Complete;
      this.onComplete();
    }
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
      ephemeral: debug,
    });
  }
}
