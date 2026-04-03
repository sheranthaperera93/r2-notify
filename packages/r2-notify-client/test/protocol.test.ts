import { describe, it, expect } from "vitest";
import { makeAction, isServerEventEnvelope } from "../src/protocol";

// ── makeAction ────────────────────────────────────────────────────────────────

describe("makeAction", () => {
  it("returns an envelope with the given action and no data when payload is omitted", () => {
    const result = makeAction("markAsRead");
    expect(result).toEqual({ event: "markAsRead", data: undefined });
  });

  it("returns an envelope with the given action and payload", () => {
    const result = makeAction("markAppAsRead", { appId: "app1" });
    expect(result).toEqual({ event: "markAppAsRead", data: { appId: "app1" } });
  });

  it("preserves arbitrary payload shapes", () => {
    const payload = { appId: "a", groupKey: "g" };
    const result = makeAction("markGroupAsRead", payload);
    expect(result.data).toBe(payload); // same reference
  });
});

// ── isServerEventEnvelope ────────────────────────────────────────────────────

describe("isServerEventEnvelope", () => {
  it("returns true for a valid envelope with string event and data", () => {
    expect(isServerEventEnvelope({ event: "listNotifications", data: [] })).toBe(true);
  });

  it("returns true when data value is null (key is present)", () => {
    expect(isServerEventEnvelope({ event: "newNotification", data: null })).toBe(true);
  });

  it("returns true when data value is 0 (falsy but key present)", () => {
    expect(isServerEventEnvelope({ event: "listConfigurations", data: 0 })).toBe(true);
  });

  it("returns false for null", () => {
    expect(isServerEventEnvelope(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isServerEventEnvelope(undefined)).toBe(false);
  });

  it("returns false for a plain string", () => {
    expect(isServerEventEnvelope("listNotifications")).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isServerEventEnvelope(42)).toBe(false);
  });

  it("returns false for an array", () => {
    // Arrays are objects but won't have a string .event
    expect(isServerEventEnvelope([])).toBe(false);
  });

  it("returns false when event key is missing", () => {
    expect(isServerEventEnvelope({ data: [] })).toBe(false);
  });

  it("returns false when event is a number instead of a string", () => {
    expect(isServerEventEnvelope({ event: 42, data: [] })).toBe(false);
  });

  it("returns false when data key is absent", () => {
    expect(isServerEventEnvelope({ event: "listNotifications" })).toBe(false);
  });
});
