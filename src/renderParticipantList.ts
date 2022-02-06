import { User } from "discord.js";

interface CompletionTimes {
  [id: string]: number;
}

interface Participant {
  id: number;
  username: string;
}

function renderParticipantRow(
  participant: Participant,
  completionTimes: CompletionTimes
) {
  const completionTime = completionTimes[participant.id];
  const completeMark = completionTime ? ` ✅ (${completionTime / 1000})` : "";
  return `🏎  ${participant.username}${completeMark}`;
}

export default function renderParticipantList(
  participants: Participant[],
  completionTimes: CompletionTimes
) {
  return participants
    .map((p) => renderParticipantRow(p, completionTimes))
    .join("\n");
}
