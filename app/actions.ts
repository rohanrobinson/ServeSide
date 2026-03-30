"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createEvent,
  deleteEvent,
  finalizeEvent,
  getEventById,
  getEventByToken,
  getEventTimeBlocks,
  submitAvailability,
} from "@/lib/store";
import { getCurrentUser } from "@/lib/current-user";
import {
  ACTIVE_USER_COOKIE,
  DEFAULT_TEST_USER,
  isTestUser,
} from "@/lib/test-users";
import type { AvailabilityChoice } from "@/lib/types";

export type ActionState = {
  ok: boolean;
  message: string;
  eventId?: string;
};

const createEventSchema = z.object({
  title: z.string().min(3, "Event title must be at least 3 characters."),
  sport: z.enum(["pickleball", "tennis"]),
  organizerName: z.string().min(2, "Organizer name is required."),
  groupName: z.string().min(2, "Group name is required."),
  venueArea: z.string().min(2, "Venue area is required."),
  dateIso: z.string().min(10, "Date is required."),
  targetPlayers: z.coerce
    .number()
    .int()
    .min(2, "Target players must be at least 2.")
    .max(24, "Target players should be 24 or fewer."),
  inviteesRaw: z.string().min(1, "Add at least one invitee."),
});

export async function createEventAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createEventSchema.safeParse({
    title: formData.get("title"),
    sport: formData.get("sport"),
    organizerName: formData.get("organizerName"),
    groupName: formData.get("groupName"),
    venueArea: formData.get("venueArea"),
    dateIso: formData.get("dateIso"),
    targetPlayers: formData.get("targetPlayers"),
    inviteesRaw: formData.get("inviteesRaw"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid event data.",
    };
  }

  const event = createEvent(parsed.data);
  return { ok: true, message: "Event created.", eventId: event.id };
}

function getChoicesFromFormData(formData: FormData, timeBlockIds: string[]) {
  const choices: AvailabilityChoice[] = [];
  for (const timeBlockId of timeBlockIds) {
    const value = String(formData.get(`slot-${timeBlockId}`) ?? "no");
    if (value !== "yes" && value !== "maybe" && value !== "no") {
      continue;
    }
    choices.push({ timeBlockId, confidence: value });
  }
  return choices;
}

export async function submitAvailabilityAction(
  inviteToken: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const event = getEventByToken(inviteToken);
  if (!event) {
    return { ok: false, message: "Invite link is invalid." };
  }

  const playerName = String(formData.get("playerName") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (playerName.length < 2) {
    return { ok: false, message: "Enter your name so organizer can identify you." };
  }

  const timeBlocks = getEventTimeBlocks(event.id);
  const choices = getChoicesFromFormData(
    formData,
    timeBlocks.map((block) => block.id),
  );

  if (choices.length === 0) {
    return { ok: false, message: "Set availability for at least one time block." };
  }

  submitAvailability({ inviteToken, playerName, note, choices });
  return { ok: true, message: "Availability saved. You can close this tab." };
}

export async function finalizeEventAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const selectedTimeBlockIdRaw = String(formData.get("selectedTimeBlockId") ?? "");
  const selectedTimeBlockId = selectedTimeBlockIdRaw || undefined;

  if (!eventId) {
    throw new Error("Event ID is required.");
  }

  finalizeEvent(eventId, selectedTimeBlockId);
  redirect(`/events/${eventId}`);
}

export async function deleteEventAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) {
    throw new Error("Event ID is required.");
  }

  const event = getEventById(eventId);
  if (!event) {
    redirect("/");
  }

  const currentUser = await getCurrentUser();
  if (event.organizerName.toLowerCase() !== currentUser.toLowerCase()) {
    throw new Error("Only the organizer can delete this event.");
  }

  deleteEvent(eventId);
  redirect("/");
}

export async function setActiveUserAction(formData: FormData) {
  const selectedUser = String(formData.get("selectedUser") ?? "");
  if (!isTestUser(selectedUser)) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_USER_COOKIE, selectedUser, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearActiveUserAction() {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_USER_COOKIE, DEFAULT_TEST_USER, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
