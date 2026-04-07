export type Sport = "pickleball" | "tennis";

export type EventStatus = "draft" | "polling" | "finalized";

export type ResponseConfidence = "yes" | "maybe" | "no";

export type TimeBlock = {
  id: string;
  startIso: string;
  endIso: string;
  label: string;
};

export type EventRecord = {
  id: string;
  title: string;
  sport: Sport;
  organizerName: string;
  groupName: string;
  venueArea: string;
  dateIso: string;
  targetPlayers: number;
  status: EventStatus;
  inviteToken: string;
  createdAtIso: string;
  finalizedTimeBlockId: string | null;
  finalizedAtIso: string | null;
};

export type EventInvite = {
  id: string;
  eventId: string;
  inviteeName: string;
  inviteeEmail: string | null;
  inviteToken: string;
  responded: boolean;
};

export type AvailabilityChoice = {
  timeBlockId: string;
  confidence: ResponseConfidence;
};

export type AvailabilityResponse = {
  id: string;
  eventId: string;
  inviteToken: string;
  playerName: string;
  note: string;
  choices: AvailabilityChoice[];
  submittedAtIso: string;
};

export type NotificationLog = {
  id: string;
  eventId: string;
  kind: "invite" | "finalized";
  recipient: string;
  message: string;
  createdAtIso: string;
};

export type PlanChatMessageRole = "user" | "system";

export type PlanChatMessage = {
  id: string;
  role: PlanChatMessageRole;
  body: string;
  createdAtIso: string;
};
