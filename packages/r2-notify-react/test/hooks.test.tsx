import React from "react";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { R2NotifyProvider } from "../src/R2NotifyProvider";
import { useR2Notify, useNotifications, useNotifyActions, useNotifyClient, useNotifyEvent } from "../src/hooks";
import { R2NotifyClient } from "r2-notify-client";

// ── Mock: r2-notify-client ─────────────────────────────────────────────────────

vi.mock("r2-notify-client", () => {
  let _last: any = null;

  function createClient() {
    const listeners = new Map<string, Array<(p: unknown) => void>>();
    const inst: any = {
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
      markAsRead: vi.fn(),
      markAppAsRead: vi.fn(),
      markGroupAsRead: vi.fn(),
      markNotificationAsRead: vi.fn(),
      deleteNotifications: vi.fn(),
      deleteAppNotifications: vi.fn(),
      deleteGroupNotifications: vi.fn(),
      deleteNotification: vi.fn(),
      reloadNotifications: vi.fn(),
      setNotificationStatus: vi.fn(),
      on: vi.fn().mockImplementation((event: string, fn: (p: unknown) => void) => {
        listeners.set(event, [...(listeners.get(event) ?? []), fn]);
        return inst;
      }),
      off: vi.fn().mockImplementation((event: string, fn: (p: unknown) => void) => {
        listeners.set(event, (listeners.get(event) ?? []).filter((l) => l !== fn));
        return inst;
      }),
      emit(event: string, payload?: unknown) {
        (listeners.get(event) ?? []).forEach((l) => l(payload));
      },
    };
    _last = inst;
    return inst;
  }

  const ClientMock = vi.fn().mockImplementation(createClient);
  (ClientMock as any).getLast = () => _last;

  return { R2NotifyClient: ClientMock };
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function getLastClient() {
  return (R2NotifyClient as any).getLast();
}

const defaultWrapper = ({ children }: { children: React.ReactNode }) => (
  <R2NotifyProvider serverUrl="http://localhost" apiKey="test-key">
    {children}
  </R2NotifyProvider>
);

const noApiKeyWrapper = ({ children }: { children: React.ReactNode }) => (
  <R2NotifyProvider serverUrl="http://localhost" apiKey="">
    {children}
  </R2NotifyProvider>
);

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("useR2Notify", () => {
  it("throws when used outside of R2NotifyProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useR2Notify())).toThrow("useR2Notify must be used within <R2NotifyProvider>");
    consoleSpy.mockRestore();
  });

  it("returns context object with state, actions and client", () => {
    const { result } = renderHook(() => useR2Notify(), { wrapper: defaultWrapper });
    expect(result.current).toHaveProperty("state");
    expect(result.current).toHaveProperty("actions");
    expect(result.current).toHaveProperty("client");
  });
});

describe("useNotifications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns initial state with isConnected=false and all optional fields undefined", () => {
    const { result } = renderHook(() => useNotifications(), { wrapper: defaultWrapper });
    expect(result.current.isConnected).toBe(false);
    expect(result.current.listNotifications).toBeUndefined();
    expect(result.current.newNotification).toBeUndefined();
    expect(result.current.listConfigurations).toBeUndefined();
    expect(result.current.lastError).toBeUndefined();
  });

  it("reflects isConnected=true after connected event", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper: defaultWrapper });
    await act(async () => {
      getLastClient().emit("connected");
    });
    expect(result.current.isConnected).toBe(true);
  });

  it("reflects lastError after error event", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper: defaultWrapper });
    await act(async () => {
      getLastClient().emit("error", new Error("something broke"));
    });
    expect(result.current.lastError?.message).toBe("something broke");
  });

  it("reflects listNotifications after listNotifications event", async () => {
    const notifications = [
      {
        id: "1",
        appId: "app1",
        userId: "u1",
        groupKey: "g1",
        message: "Hi",
        status: "info" as const,
        readStatus: false,
        createdAt: "",
        updatedAt: "",
      },
    ];
    const { result } = renderHook(() => useNotifications(), { wrapper: defaultWrapper });
    await act(async () => {
      getLastClient().emit("listNotifications", notifications);
    });
    expect(result.current.listNotifications).toEqual(notifications);
  });

  it("reflects newNotification after newNotification event", async () => {
    const notification = {
      id: "n1",
      appId: "app1",
      userId: "u1",
      groupKey: "g1",
      message: "New",
      status: "success" as const,
      readStatus: false,
      createdAt: "",
      updatedAt: "",
    };
    const { result } = renderHook(() => useNotifications(), { wrapper: defaultWrapper });
    await act(async () => {
      getLastClient().emit("newNotification", notification);
    });
    expect(result.current.newNotification).toEqual(notification);
  });

  it("reflects listConfigurations after listConfigurations event", async () => {
    const config = { id: "cfg1", userId: "u1", enableNotification: false };
    const { result } = renderHook(() => useNotifications(), { wrapper: defaultWrapper });
    await act(async () => {
      getLastClient().emit("listConfigurations", config);
    });
    expect(result.current.listConfigurations).toEqual(config);
  });
});

describe("useNotifyActions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all expected action methods", () => {
    const { result } = renderHook(() => useNotifyActions(), { wrapper: defaultWrapper });
    const a = result.current;
    expect(typeof a.markAsRead).toBe("function");
    expect(typeof a.markAppAsRead).toBe("function");
    expect(typeof a.markGroupAsRead).toBe("function");
    expect(typeof a.markNotificationAsRead).toBe("function");
    expect(typeof a.deleteNotifications).toBe("function");
    expect(typeof a.deleteAppNotifications).toBe("function");
    expect(typeof a.deleteGroupNotifications).toBe("function");
    expect(typeof a.deleteNotification).toBe("function");
    expect(typeof a.reloadNotifications).toBe("function");
    expect(typeof a.setNotificationStatus).toBe("function");
  });

  it("delegates markAsRead to client", () => {
    const { result } = renderHook(() => useNotifyActions(), { wrapper: defaultWrapper });
    result.current.markAsRead();
    expect(getLastClient().markAsRead).toHaveBeenCalledOnce();
  });

  it("delegates markAppAsRead to client with appId", () => {
    const { result } = renderHook(() => useNotifyActions(), { wrapper: defaultWrapper });
    result.current.markAppAsRead("app1");
    expect(getLastClient().markAppAsRead).toHaveBeenCalledWith("app1");
  });

  it("delegates markGroupAsRead to client with appId and groupKey", () => {
    const { result } = renderHook(() => useNotifyActions(), { wrapper: defaultWrapper });
    result.current.markGroupAsRead("app1", "group1");
    expect(getLastClient().markGroupAsRead).toHaveBeenCalledWith("app1", "group1");
  });

  it("delegates markNotificationAsRead to client with id", () => {
    const { result } = renderHook(() => useNotifyActions(), { wrapper: defaultWrapper });
    result.current.markNotificationAsRead("notif-1");
    expect(getLastClient().markNotificationAsRead).toHaveBeenCalledWith("notif-1");
  });

  it("delegates deleteNotifications to client", () => {
    const { result } = renderHook(() => useNotifyActions(), { wrapper: defaultWrapper });
    result.current.deleteNotifications();
    expect(getLastClient().deleteNotifications).toHaveBeenCalledOnce();
  });

  it("delegates deleteAppNotifications to client with appId", () => {
    const { result } = renderHook(() => useNotifyActions(), { wrapper: defaultWrapper });
    result.current.deleteAppNotifications("app1");
    expect(getLastClient().deleteAppNotifications).toHaveBeenCalledWith("app1");
  });

  it("delegates deleteGroupNotifications to client with appId and groupKey", () => {
    const { result } = renderHook(() => useNotifyActions(), { wrapper: defaultWrapper });
    result.current.deleteGroupNotifications("app1", "grp");
    expect(getLastClient().deleteGroupNotifications).toHaveBeenCalledWith("app1", "grp");
  });

  it("delegates deleteNotification to client with id", () => {
    const { result } = renderHook(() => useNotifyActions(), { wrapper: defaultWrapper });
    result.current.deleteNotification("n-1");
    expect(getLastClient().deleteNotification).toHaveBeenCalledWith("n-1");
  });

  it("delegates reloadNotifications to client", () => {
    const { result } = renderHook(() => useNotifyActions(), { wrapper: defaultWrapper });
    result.current.reloadNotifications();
    expect(getLastClient().reloadNotifications).toHaveBeenCalledOnce();
  });

  it("delegates setNotificationStatus to client with boolean value", () => {
    const { result } = renderHook(() => useNotifyActions(), { wrapper: defaultWrapper });
    result.current.setNotificationStatus(false);
    expect(getLastClient().setNotificationStatus).toHaveBeenCalledWith(false);
  });
});

describe("useNotifyClient", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the R2NotifyClient instance", () => {
    const { result } = renderHook(() => useNotifyClient(), { wrapper: defaultWrapper });
    expect(result.current).toBe(getLastClient());
  });

  it("returns null when no apiKey is provided", () => {
    const { result } = renderHook(() => useNotifyClient(), { wrapper: noApiKeyWrapper });
    expect(result.current).toBeNull();
  });
});

describe("useNotifyEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("registers an event listener on the client", () => {
    const handler = vi.fn();
    renderHook(() => useNotifyEvent("listNotifications", handler), { wrapper: defaultWrapper });
    expect(getLastClient().on).toHaveBeenCalledWith("listNotifications", expect.any(Function));
  });

  it("calls the handler when the event fires", async () => {
    const handler = vi.fn();
    renderHook(() => useNotifyEvent("listNotifications", handler), { wrapper: defaultWrapper });
    await act(async () => {
      getLastClient().emit("listNotifications", []);
    });
    expect(handler).toHaveBeenCalledWith([]);
  });

  it("unregisters the listener when the hook unmounts", () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useNotifyEvent("newNotification", handler), {
      wrapper: defaultWrapper,
    });
    unmount();
    expect(getLastClient().off).toHaveBeenCalledWith("newNotification", expect.any(Function));
  });

  it("does not register a listener when client is null", () => {
    const handler = vi.fn();
    // noApiKeyWrapper means no client is created
    renderHook(() => useNotifyEvent("listNotifications", handler), { wrapper: noApiKeyWrapper });
    // R2NotifyClient was never called, so there is no client to attach to
    expect(R2NotifyClient).not.toHaveBeenCalled();
  });
});
