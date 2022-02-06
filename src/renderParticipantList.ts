import { memberNicknameMention } from "@discordjs/builders";
import { User } from "discord.js";
import { Participant, CompletionTimes } from "./types";

function renderParticipantRow(
  participant: Participant,
  completionTimes: CompletionTimes,
  isComplete: boolean,
  index: number
) {
  const completionTime = completionTimes[participant.id];
  const hasFinished = Boolean(completionTime);
  const icon = getIcon(isComplete, hasFinished, index);
  const time = hasFinished ? ` (${completionTime / 1000})` : "";

  return `${icon}  ${participant.username}${time}`;
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
  isComplete: boolean = false
) {
  const sortedParticipants = isComplete
    ? sortParticipantsByCompletionTime(participants, completionTimes)
    : participants;

  return sortedParticipants
    .map((p, i) => renderParticipantRow(p, completionTimes, isComplete, i))
    .join("\n");
}
