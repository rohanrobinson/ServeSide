import { buildDefaultTimeBlocks } from "@/lib/time";
import type {
  AvailabilityChoice,
  AvailabilityResponse,
  EventInvite,
  EventRecord,
  NotificationLog,
  ResponseConfidence,
  TimeBlock,
} from "@/lib/types";

type EventTimeBlockMap = Record<string, TimeBlock[]>;

type StoreState = {
  events: EventRecord[];
  invites: EventInvite[];
  responses: AvailabilityResponse[];
  notifications: NotificationLog[];
  eventTimeBlocks: EventTimeBlockMap;
};

type CreateEventInput = Pick<
  EventRecord,
  "title" | "sport" | "organizerName" | "groupName" | "venueArea" | "dateIso" | "targetPlayers"
> & {
  inviteesRaw: string;
};

type SubmitAvailabilityInput = {
  inviteToken: string;
  playerName: string;
  note: string;
  choices: AvailabilityChoice[];
};

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function parseInvitees(raw: string) {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function makeSeedEvent(): {
  event: EventRecord;
  invites: EventInvite[];
  timeBlocks: TimeBlock[];
} {
  const eventId = createId("evt");
  const inviteToken = createId("invite");
  const date = new Date();
  date.setDate(date.getDate() + 2);
  const dateIso = date.toISOString().slice(0, 10);

  const event: EventRecord = {
    id: eventId,
    title: "Saturday Morning Tennis",
    sport: "tennis",
    organizerName: "Rohan",
    groupName: "Weekend Racquet Crew",
    venueArea: "Palo Alto courts",
    dateIso,
    targetPlayers: 4,
    status: "polling",
    inviteToken,
    createdAtIso: new Date().toISOString(),
    finalizedTimeBlockId: null,
    finalizedAtIso: null,
  };

  const invites = ["Alex", "Sam", "Jordan"].map((name) => ({
    id: createId("inv"),
    eventId,
    inviteeName: name,
    inviteeEmail: null,
    inviteToken,
    responded: false,
  }));

  return { event, invites, timeBlocks: buildDefaultTimeBlocks(dateIso) };
}

function createInitialState(): StoreState {
  const seed = makeSeedEvent();

  return {
    events: [seed.event],
    invites: seed.invites,
    responses: [],
    notifications: [],
    eventTimeBlocks: { [seed.event.id]: seed.timeBlocks },
  };
}

declare global {
  var sportsMvpStore: StoreState | undefined;
}

function getStore() {
  if (!globalThis.sportsMvpStore) {
    globalThis.sportsMvpStore = createInitialState();
  }

  return globalThis.sportsMvpStore;
}

export function listEvents() {
  return [...getStore().events].sort((a, b) =>
    a.createdAtIso > b.createdAtIso ? -1 : 1,
  );
}

export function listEventsForUser(userName: string) {
  const lowered = userName.toLowerCase();
  const visibleEventIds = new Set<string>();

  for (const event of getStore().events) {
    if (event.organizerName.toLowerCase() === lowered) {
      visibleEventIds.add(event.id);
    }
  }

  for (const invite of getStore().invites) {
    if (invite.inviteeName.toLowerCase() === lowered) {
      visibleEventIds.add(invite.eventId);
    }
  }

  return listEvents().filter((event) => visibleEventIds.has(event.id));
}

export function createEvent(input: CreateEventInput) {
  const store = getStore();
  const eventId = createId("evt");
  const inviteToken = createId("invite");
  const nowIso = new Date().toISOString();

  const event: EventRecord = {
    id: eventId,
    title: input.title,
    sport: input.sport,
    organizerName: input.organizerName,
    groupName: input.groupName,
    venueArea: input.venueArea,
    dateIso: input.dateIso,
    targetPlayers: input.targetPlayers,
    status: "polling",
    inviteToken,
    createdAtIso: nowIso,
    finalizedTimeBlockId: null,
    finalizedAtIso: null,
  };

  const invitees = parseInvitees(input.inviteesRaw);
  const invites = invitees.map((inviteeName) => ({
    id: createId("inv"),
    eventId,
    inviteeName,
    inviteeEmail: null,
    inviteToken,
    responded: false,
  }));

  const notifications = invitees.map((recipient) => ({
    id: createId("ntf"),
    eventId,
    kind: "invite" as const,
    recipient,
    message: `You're invited to ${event.title}.`,
    createdAtIso: nowIso,
  }));

  store.events.push(event);
  store.invites.push(...invites);
  store.notifications.push(...notifications);
  store.eventTimeBlocks[eventId] = buildDefaultTimeBlocks(input.dateIso);

  return event;
}

export function deleteEvent(eventId: string) {
  const store = getStore();
  const event = getEventById(eventId);
  if (!event) {
    return false;
  }

  store.events = store.events.filter((entry) => entry.id !== eventId);
  store.invites = store.invites.filter((entry) => entry.eventId !== eventId);
  store.responses = store.responses.filter((entry) => entry.eventId !== eventId);
  store.notifications = store.notifications.filter((entry) => entry.eventId !== eventId);
  delete store.eventTimeBlocks[eventId];

  return true;
}

export function getEventById(eventId: string) {
  const store = getStore();
  return store.events.find((event) => event.id === eventId) ?? null;
}

export function getEventByToken(inviteToken: string) {
  const store = getStore();
  return store.events.find((event) => event.inviteToken === inviteToken) ?? null;
}

export function getEventTimeBlocks(eventId: string) {
  return getStore().eventTimeBlocks[eventId] ?? [];
}

export function getInvitesForEvent(eventId: string) {
  return getStore().invites.filter((invite) => invite.eventId === eventId);
}

export function getResponsesForEvent(eventId: string) {
  return getStore().responses.filter((response) => response.eventId === eventId);
}

export function submitAvailability(input: SubmitAvailabilityInput) {
  const store = getStore();
  const event = getEventByToken(input.inviteToken);
  if (!event) {
    throw new Error("Invite not found.");
  }

  const existing = store.responses.find(
    (response) =>
      response.eventId === event.id &&
      response.playerName.toLowerCase() === input.playerName.toLowerCase(),
  );

  const nowIso = new Date().toISOString();

  if (existing) {
    existing.note = input.note;
    existing.choices = input.choices;
    existing.submittedAtIso = nowIso;
  } else {
    store.responses.push({
      id: createId("rsp"),
      eventId: event.id,
      inviteToken: input.inviteToken,
      playerName: input.playerName,
      note: input.note,
      choices: input.choices,
      submittedAtIso: nowIso,
    });
  }

  for (const invite of store.invites) {
    if (
      invite.eventId === event.id &&
      invite.inviteeName.toLowerCase() === input.playerName.toLowerCase()
    ) {
      invite.responded = true;
    }
  }
}

function confidenceScore(confidence: ResponseConfidence) {
  if (confidence === "yes") return 2;
  if (confidence === "maybe") return 1;
  return 0;
}

export function getRecommendation(eventId: string) {
  const blocks = getEventTimeBlocks(eventId);
  const responses = getResponsesForEvent(eventId);

  const perBlock = blocks.map((block) => {
    let yesCount = 0;
    let maybeCount = 0;
    let noCount = 0;
    let score = 0;

    for (const response of responses) {
      const choice = response.choices.find((entry) => entry.timeBlockId === block.id);
      if (!choice) continue;

      if (choice.confidence === "yes") yesCount += 1;
      if (choice.confidence === "maybe") maybeCount += 1;
      if (choice.confidence === "no") noCount += 1;
      score += confidenceScore(choice.confidence);
    }

    return { block, yesCount, maybeCount, noCount, score };
  });

  const recommended =
    [...perBlock].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.yesCount !== a.yesCount) return b.yesCount - a.yesCount;
      return a.block.startIso > b.block.startIso ? 1 : -1;
    })[0] ?? null;

  return {
    recommended,
    perBlock,
  };
}

export function finalizeEvent(eventId: string, selectedTimeBlockId?: string) {
  const store = getStore();
  const event = getEventById(eventId);
  if (!event) {
    throw new Error("Event not found.");
  }

  const recommendation = getRecommendation(eventId).recommended;
  const selected = selectedTimeBlockId ?? recommendation?.block.id;
  if (!selected) {
    throw new Error("No available slot to finalize.");
  }

  event.finalizedTimeBlockId = selected;
  event.finalizedAtIso = new Date().toISOString();
  event.status = "finalized";

  const nowIso = new Date().toISOString();
  const recipients = getInvitesForEvent(eventId).map((invite) => invite.inviteeName);
  for (const recipient of recipients) {
    store.notifications.push({
      id: createId("ntf"),
      eventId,
      kind: "finalized",
      recipient,
      message: `${event.title} has a finalized time.`,
      createdAtIso: nowIso,
    });
  }
}

export function getFinalizedBlock(eventId: string) {
  const event = getEventById(eventId);
  if (!event?.finalizedTimeBlockId) return null;
  return getEventTimeBlocks(eventId).find((slot) => slot.id === event.finalizedTimeBlockId) ?? null;
}

export function listNotifications(eventId: string) {
  return getStore().notifications.filter((entry) => entry.eventId === eventId);
}

export function finalizePendingEvents(minResponses = 3) {
  const pending = listEvents().filter((event) => event.status !== "finalized");
  let finalizedCount = 0;

  for (const event of pending) {
    const responseCount = getResponsesForEvent(event.id).length;
    if (responseCount >= minResponses) {
      finalizeEvent(event.id);
      finalizedCount += 1;
    }
  }

  return finalizedCount;
}

export function getKpiSnapshot() {
  const events = listEvents();
  const finalizedEvents = events.filter((event) => event.status === "finalized");
  const responsesByEvent = events.map((event) => ({
    eventId: event.id,
    invited: getInvitesForEvent(event.id).length,
    responded: getResponsesForEvent(event.id).length,
  }));

  const responseRateByEvent = responsesByEvent.map((entry) => ({
    eventId: entry.eventId,
    responseRate: entry.invited === 0 ? 0 : entry.responded / entry.invited,
  }));

  return {
    totalEvents: events.length,
    finalizedEvents: finalizedEvents.length,
    averageResponseRate:
      responseRateByEvent.length === 0
        ? 0
        : responseRateByEvent.reduce((sum, entry) => sum + entry.responseRate, 0) /
          responseRateByEvent.length,
    responseRateByEvent,
  };
}
