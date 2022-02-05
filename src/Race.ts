import { isMessageComponentGuildInteraction } from "discord-api-types/utils/v9";
import { BaseCommandInteraction, User, Message } from "discord.js";

interface ConstructorOptions {
  string: string;
  interaction: BaseCommandInteraction;
}

interface CompletionTimes {
  [id: string]: number;
}

export default class Race {
  string: string;
  interaction: BaseCommandInteraction;
  participants: User[];
  startTime: Date;
  completionTimes: CompletionTimes;

  constructor(options: ConstructorOptions) {
    this.string = options.string;
    this.interaction = options.interaction;
    this.participants = [this.interaction.user];
    this.startTime = new Date();
    this.completionTimes = {};
  }

  async start() {
    await Promise.all(this.participants.map((p) => this.sendStartMessage(p)));
  }

  async consumeMessage(message: Message) {
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
  }

  markParticipantAsComplete(participant: User) {
    const completionTime = new Date().getTime() - this.startTime.getTime();
    this.completionTimes[participant.id] = completionTime;
  }

  async sendStartMessage(participant: User) {
    participant.send("Go! \n```" + this.string + "```");
  }

  isOver(): boolean {
    return Object.keys(this.completionTimes).length >= this.participants.length;
  }

  async sendCompletionMessage() {
    this.interaction.followUp({ content: "Race complete", ephemeral: true });
  }
}
