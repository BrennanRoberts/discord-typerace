import {
  BaseCommandInteraction,
  ButtonInteraction,
  User,
  Message,
} from "discord.js";
import { Participant, CompletionTimes } from "../types";
import quotes from "../data/quotes.json";
import renderParticipantList from "../renderParticipantList";
import { InitializedState } from "./InitializedState";
import { CountdownState } from "./CountdownState";
import { InProgressState } from "./InProgressState";
import { CompleteState } from "./CompleteState";
import { RaceState } from "./RaceState";

const TICK_INTERVAL_MS = 1000;

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
    console.log(this.startTime, new Date());
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
