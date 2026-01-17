import type { ActionEnvelope, NotifyAction, NotifyEvent, ServerEventEnvelope } from "../types";

/**
 * Creates an ActionEnvelope with the given action and optional payload.
 * @param action The action to include in the envelope.
 * @param payload Optional payload to include in the envelope.
 * @returns An ActionEnvelope with the given action and optional payload.
 * @template TPayload The type of the payload.
 */
export function makeAction<TPayload = unknown>(action: NotifyAction, data?: TPayload): ActionEnvelope<TPayload> {
  return { event: action, data };
}

/**
 * Checks if the given value is a ServerEventEnvelope.
 *
 * A ServerEventEnvelope is an object with an "event" property.
 * @param x The value to check.
 * @returns True if x is a ServerEventEnvelope, false otherwise.
 */
export function isServerEventEnvelope(x: any): x is ServerEventEnvelope {
  return !!x && typeof x === "object" && typeof x.event === "string" && ("payload" in x || "data" in x);
}

export type EventHandlers = Partial<Record<NotifyEvent, (payload: any) => void>>;
