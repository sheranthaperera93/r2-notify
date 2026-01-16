import type { ActionEnvelope, NotifyAction, NotifyEvent, ServerEventEnvelope } from "../types";

/**
 * Creates an ActionEnvelope with the given action and optional payload.
 * @param action The action to include in the envelope.
 * @param payload Optional payload to include in the envelope.
 * @returns An ActionEnvelope with the given action and optional payload.
 * @template TPayload The type of the payload.
 */
export function makeAction<TPayload = unknown>(
  action: NotifyAction,
  payload?: TPayload,
): ActionEnvelope<TPayload> {
  return { action, payload };
}

/**
 * Checks if the given value is a ServerEventEnvelope.
 *
 * A ServerEventEnvelope is an object with an "event" property.
 * @param x The value to check.
 * @returns True if x is a ServerEventEnvelope, false otherwise.
 */
export function isServerEventEnvelope(x: unknown): x is ServerEventEnvelope {
  return !!x && typeof x === "object" && "event" in (x as any);
}

export type EventHandlers = Partial<Record<NotifyEvent, (payload: any) => void>>;
