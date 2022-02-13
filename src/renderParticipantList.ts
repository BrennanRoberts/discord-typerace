import { memberNicknameMention } from "@discordjs/builders";
import { User } from "discord.js";
import { Participant, CompletionTimes } from "./types";

function renderParticipantRow(
  participant: Participant,
  completionTimes: CompletionTimes,
  isComplete: boolean,
  wordCount: number,
  index: number
) {
  const completionTime = completionTimes[participant.id];
  const hasFinished = Boolean(completionTime);
  const icon = getIcon(isComplete, hasFinished, index);

  const completionInfo = function () {
    if (!isComplete || !hasFinished) return "";
    const time = completionTime / 1000;
    const wpm = Math.round(wordCount / (time / 60));
    return ` - ${time} seconds (${wpm} WPM)`;
  };

  return `${icon}  <@!${participant.id}>${completionInfo()}`;
}

function getIcon(isComplete: boolean, hasFinished: boolean, placement: number) {
  if (isComplete) {
    if (!hasFinished) return "❌";

    return (
      {
        0: "🥇",
        1: "🥈",
        2: "🥉",
      }[placement] || "🏎"
    );
  }

  return hasFinished ? "🏁" : "🏎";
}

function sortParticipantsByCompletionTime(
  participants: Participant[],
  completionTimes: CompletionTimes
): Participant[] {
  return participants.sort((a, b) => {
    const aCompletionTime = completionTimes[a.id];
    const bCompletionTime = completionTimes[b.id];

    if (aCompletionTime === undefined) {
      return 1;
    }

    if (bCompletionTime === undefined) {
      return -1;
    }

    return aCompletionTime < bCompletionTime ? -1 : 1;
  });
}

export default function renderParticipantList(
  participants: Participant[],
  completionTimes: CompletionTimes,
  isComplete: boolean = false,
  string: string = ""
): string {
  const wordCount = Math.round(string.length / 5);

  const sortedParticipants = isComplete
    ? sortParticipantsByCompletionTime(participants, completionTimes)
    : participants;

  return sortedParticipants
    .map((p, i) =>
      renderParticipantRow(p, completionTimes, isComplete, wordCount, i)
    )
    .join("\n");
}
