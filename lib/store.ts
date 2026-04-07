import { buildDefaultTimeBlocks } from "@/lib/time";
import type {
  AvailabilityChoice,
  AvailabilityResponse,
  EventInvite,
  EventRecord,
  NotificationLog,
  PlanChatMessage,
  ResponseConfidence,
  Sport,
  TimeBlock,
} from "@/lib/types";

type EventTimeBlockMap = Record<string, TimeBlock[]>;

type PlanChatStep =
  | "title"
  | "sport"
  | "groupName"
  | "venueArea"
  | "dateIso"
  | "targetPlayers"
  | "invitees"
  | "confirm"
  | "done";

type PlanChatDraft = {
  organizerName: string;
  title?: string;
  sport?: Sport;
  groupName?: string;
  venueArea?: string;
  dateIso?: string;
  targetPlayers?: number;
  inviteesRaw?: string;
};

type PlanChatSession = {
  messages: PlanChatMessage[];
  step: PlanChatStep;
  draft: PlanChatDraft;
  createdEventId?: string;
};

type StoreState = {
  events: EventRecord[];
  invites: EventInvite[];
  responses: AvailabilityResponse[];
  notifications: NotificationLog[];
  eventTimeBlocks: EventTimeBlockMap;
  planChatSessions: Record<string, PlanChatSession>;
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
    planChatSessions: {},
  };
}

declare global {
  var sportsMvpStore: StoreState | undefined;
}

function getStore() {
  if (!globalThis.sportsMvpStore) {
    globalThis.sportsMvpStore = createInitialState();
  }

  if (!globalThis.sportsMvpStore.planChatSessions) {
    globalThis.sportsMvpStore.planChatSessions = {};
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

function parseSportToken(raw: string): Sport | null {
  const t = raw.trim().toLowerCase();
  if (t === "pickleball" || t === "pb" || t === "pickle" || t === "1") {
    return "pickleball";
  }
  if (t === "tennis" || t === "ten" || t === "2") {
    return "tennis";
  }
  return null;
}

function parseDateIsoInput(raw: string): string | null {
  const t = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return null;
  }
  const parsed = new Date(`${t}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return t;
}

function pushMessage(session: PlanChatSession, role: PlanChatMessage["role"], body: string) {
  session.messages.push({
    id: createId("msg"),
    role,
    body,
    createdAtIso: new Date().toISOString(),
  });
}

function ensurePlanChatSession(sessionId: string, organizerName: string) {
  const store = getStore();
  if (store.planChatSessions[sessionId]) {
    store.planChatSessions[sessionId].draft.organizerName = organizerName;
    return;
  }

  const session: PlanChatSession = {
    step: "title",
    draft: { organizerName },
    messages: [],
  };

  pushMessage(
    session,
    "system",
    `Hi ${organizerName}! I'll walk you through creating a session.\n\nWhat should we call this event? (At least 3 characters.)`,
  );

  store.planChatSessions[sessionId] = session;
}

export function initPlanChatSessionState(
  sessionId: string,
  organizerName: string,
): PlanChatMessage[] {
  ensurePlanChatSession(sessionId, organizerName);
  return [...getStore().planChatSessions[sessionId].messages];
}

function formatPlanSummary(draft: PlanChatDraft): string {
  const sportLabel = draft.sport === "pickleball" ? "Pickleball" : "Tennis";
  return [
    "Here's the plan:",
    `• Title: ${draft.title}`,
    `• Sport: ${sportLabel}`,
    `• Group: ${draft.groupName}`,
    `• Venue / area: ${draft.venueArea}`,
    `• Date: ${draft.dateIso}`,
    `• Target players: ${draft.targetPlayers}`,
    `• Invitees: ${draft.inviteesRaw}`,
    "",
    "Reply **yes** to create this event, or **no** to change the invite list.",
  ].join("\n");
}

export function submitPlanChatMessage(
  sessionId: string,
  organizerName: string,
  text: string,
): { messages: PlanChatMessage[]; eventId?: string } {
  const store = getStore();
  ensurePlanChatSession(sessionId, organizerName);
  const session = store.planChatSessions[sessionId];
  const trimmed = text.trim();
  const nowIso = new Date().toISOString();

  if (session.step === "done") {
    session.messages.push({
      id: createId("msg"),
      role: "user",
      body: trimmed,
      createdAtIso: nowIso,
    });
    pushMessage(
      session,
      "system",
      "This chat already created an event. You can close this window and open it from your home list.",
    );
    return { messages: [...session.messages], eventId: session.createdEventId };
  }

  session.messages.push({
    id: createId("msg"),
    role: "user",
    body: trimmed,
    createdAtIso: nowIso,
  });

  const reply = (body: string) => {
    pushMessage(session, "system", body);
  };

  switch (session.step) {
    case "title": {
      if (trimmed.length < 3) {
        reply("Titles need at least 3 characters. What should we call this event?");
        break;
      }
      session.draft.title = trimmed;
      session.step = "sport";
      reply(`Nice — "${trimmed}". Is this **pickleball** or **tennis**?`);
      break;
    }
    case "sport": {
      const sport = parseSportToken(trimmed);
      if (!sport) {
        reply('Please answer with "pickleball" or "tennis".');
        break;
      }
      session.draft.sport = sport;
      session.step = "groupName";
      reply("What group or crew is this for? (At least 2 characters.)");
      break;
    }
    case "groupName": {
      if (trimmed.length < 2) {
        reply("Group names need at least 2 characters. Who is this for?");
        break;
      }
      session.draft.groupName = trimmed;
      session.step = "venueArea";
      reply("Where are you hoping to play? Enter a venue or neighborhood (at least 2 characters).");
      break;
    }
    case "venueArea": {
      if (trimmed.length < 2) {
        reply("Please add a bit more detail for the venue or area (at least 2 characters).");
        break;
      }
      session.draft.venueArea = trimmed;
      session.step = "dateIso";
      reply("What date? Use **YYYY-MM-DD** (for example 2026-04-12).");
      break;
    }
    case "dateIso": {
      const dateIso = parseDateIsoInput(trimmed);
      if (!dateIso) {
        reply("I need a calendar date like **2026-04-12**. What date works?");
        break;
      }
      session.draft.dateIso = dateIso;
      session.step = "targetPlayers";
      reply("How many players are you aiming for? Enter a whole number between **2** and **24**.");
      break;
    }
    case "targetPlayers": {
      const value = Number.parseInt(trimmed, 10);
      if (Number.isNaN(value) || value < 2 || value > 24) {
        reply("Enter a whole number between 2 and 24 for target players.");
        break;
      }
      session.draft.targetPlayers = value;
      session.step = "invitees";
      reply(
        "Who should we invite? Enter comma-separated names (for example: **Alex, Sam, Jordan**).",
      );
      break;
    }
    case "invitees": {
      const invitees = parseInvitees(trimmed);
      if (invitees.length === 0) {
        reply("Add at least one invitee name, separated by commas.");
        break;
      }
      session.draft.inviteesRaw = invitees.join(", ");
      session.step = "confirm";
      reply(formatPlanSummary(session.draft as Required<PlanChatDraft>));
      break;
    }
    case "confirm": {
      const lower = trimmed.toLowerCase();
      const yes =
        lower === "yes" ||
        lower === "y" ||
        lower === "yeah" ||
        lower === "yep" ||
        lower === "confirm" ||
        lower === "create" ||
        lower === "ok" ||
        lower === "okay";
      const no = lower === "no" || lower === "n" || lower === "nope";

      if (!yes && !no) {
        reply('Reply **yes** to create the event or **no** to change the invite list.');
        break;
      }

      if (no) {
        session.step = "invitees";
        reply("No problem — who should we invite? (Comma-separated names.)");
        break;
      }

      const draft = session.draft;
      if (
        !draft.title ||
        !draft.sport ||
        !draft.groupName ||
        !draft.venueArea ||
        !draft.dateIso ||
        draft.targetPlayers === undefined ||
        !draft.inviteesRaw
      ) {
        reply("Something was missing from the plan. Start over by closing and opening Try Chat again.");
        break;
      }

      const event = createEvent({
        title: draft.title,
        sport: draft.sport,
        organizerName: draft.organizerName,
        groupName: draft.groupName,
        venueArea: draft.venueArea,
        dateIso: draft.dateIso,
        targetPlayers: draft.targetPlayers,
        inviteesRaw: draft.inviteesRaw,
      });

      session.step = "done";
      session.createdEventId = event.id;
      reply(
        `All set — **${event.title}** is live. Share the invite link from the event page. I'm taking you there now.`,
      );
      return { messages: [...session.messages], eventId: event.id };
    }
    default: {
      break;
    }
  }

  return { messages: [...session.messages] };
}
