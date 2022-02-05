import {
  BaseCommandInteraction,
  ButtonInteraction,
  User,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js";

const WAIT_TIME = 10000;

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
  startTime: Date;
  completionTimes: CompletionTimes;
  onComplete: onCompleteCallback;

  constructor(options: ConstructorOptions) {
    this.state = RaceState.Initialized;
    this.string = options.string;
    this.interaction = options.interaction;
    this.onComplete = options.onComplete;
    this.participants = [];
    //this.participants = [this.interaction.user];
    this.startTime = new Date();
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
      ephemeral: true,
    });
    setTimeout(this.start.bind(this), WAIT_TIME);
  }

  async start() {
    if (this.participants.length === 0) {
      await this.interaction.followUp({
        content: "Race aborted, no participants",
        ephemeral: true,
      });

      this.state = RaceState.Complete;
      this.onComplete();
      return;
    }

    await Promise.all(this.participants.map((p) => this.sendStartMessage(p)));
    await this.interaction.followUp({
      content: "Race started",
      ephemeral: true,
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
      ephemeral: true,
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
    this.interaction.followUp({ content: "Race complete", ephemeral: true });
  }
}
