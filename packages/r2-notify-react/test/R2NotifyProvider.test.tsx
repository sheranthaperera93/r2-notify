import React from "react"; // required for JSX with react-jsx transform in tests
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { R2NotifyProvider } from "../src/R2NotifyProvider";
import { useR2Notify } from "../src/hooks";
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

function StateDisplay() {
  const { state } = useR2Notify();
  return (
    <div>
      <span data-testid="connected">{String(state.isConnected)}</span>
      <span data-testid="error">{state.lastError?.message ?? ""}</span>
      <span data-testid="notifications">{JSON.stringify(state.listNotifications ?? null)}</span>
      <span data-testid="new-notification">{JSON.stringify(state.newNotification ?? null)}</span>
      <span data-testid="configurations">{JSON.stringify(state.listConfigurations ?? null)}</span>
    </div>
  );
}

function Wrapper({ apiKey = "test-key", autoConnect = true, ...rest }: any) {
  return (
    <R2NotifyProvider serverUrl="http://localhost:3000" apiKey={apiKey} autoConnect={autoConnect} {...rest}>
      <StateDisplay />
    </R2NotifyProvider>
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("R2NotifyProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children", () => {
    render(
      <R2NotifyProvider serverUrl="http://localhost" apiKey="test-key">
        <span data-testid="child">hello</span>
      </R2NotifyProvider>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("creates R2NotifyClient with correct options when apiKey is provided", () => {
    render(<Wrapper apiKey="my-key" />);
    expect(R2NotifyClient).toHaveBeenCalledOnce();
    expect(R2NotifyClient).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: "my-key", serverUrl: "http://localhost:3000" }),
    );
  });

  it("does not create R2NotifyClient when apiKey is empty", () => {
    render(<Wrapper apiKey="" />);
    expect(R2NotifyClient).not.toHaveBeenCalled();
  });

  it("calls connect() when autoConnect is true (default)", () => {
    render(<Wrapper />);
    expect(getLastClient().connect).toHaveBeenCalledOnce();
  });

  it("does not call connect() when autoConnect is false", () => {
    render(<Wrapper autoConnect={false} />);
    expect(getLastClient().connect).not.toHaveBeenCalled();
  });

  it("closes the client on unmount", () => {
    const { unmount } = render(<Wrapper />);
    const client = getLastClient();
    unmount();
    expect(client.close).toHaveBeenCalled();
  });

  it("closes old client and creates a new one when apiKey changes", async () => {
    const { rerender } = render(<Wrapper apiKey="key-1" />);
    const firstClient = getLastClient();

    await act(async () => {
      rerender(<Wrapper apiKey="key-2" />);
    });

    expect(firstClient.close).toHaveBeenCalled();
    expect(R2NotifyClient).toHaveBeenCalledTimes(2);
    expect(getLastClient()).not.toBe(firstClient);
  });

  it("initial state has isConnected=false", () => {
    render(<Wrapper />);
    expect(screen.getByTestId("connected").textContent).toBe("false");
  });

  it("sets isConnected=true on connected event", async () => {
    render(<Wrapper />);
    await act(async () => {
      getLastClient().emit("connected");
    });
    expect(screen.getByTestId("connected").textContent).toBe("true");
  });

  it("clears lastError on connected event", async () => {
    render(<Wrapper />);
    // First trigger an error, then reconnect
    await act(async () => {
      getLastClient().emit("error", new Error("oops"));
    });
    expect(screen.getByTestId("error").textContent).toBe("oops");

    await act(async () => {
      getLastClient().emit("connected");
    });
    expect(screen.getByTestId("error").textContent).toBe("");
  });

  it("sets isConnected=false on disconnected event", async () => {
    render(<Wrapper />);
    await act(async () => {
      getLastClient().emit("connected");
    });
    expect(screen.getByTestId("connected").textContent).toBe("true");

    await act(async () => {
      getLastClient().emit("disconnected");
    });
    expect(screen.getByTestId("connected").textContent).toBe("false");
  });

  it("sets isConnected=false and lastError on error event with an Error", async () => {
    render(<Wrapper />);
    await act(async () => {
      getLastClient().emit("connected");
    });

    await act(async () => {
      getLastClient().emit("error", new Error("connection failed"));
    });

    expect(screen.getByTestId("connected").textContent).toBe("false");
    expect(screen.getByTestId("error").textContent).toBe("connection failed");
  });

  it("wraps non-Error payloads into a generic Error on error event", async () => {
    render(<Wrapper />);
    await act(async () => {
      getLastClient().emit("error", "some string");
    });
    expect(screen.getByTestId("error").textContent).toBe("Connection error occurred");
  });

  it("updates listNotifications on listNotifications event", async () => {
    const notifications = [
      {
        id: "1",
        appId: "app1",
        userId: "u1",
        groupKey: "g1",
        message: "Test",
        status: "info" as const,
        readStatus: false,
        createdAt: "",
        updatedAt: "",
      },
    ];
    render(<Wrapper />);
    await act(async () => {
      getLastClient().emit("listNotifications", notifications);
    });
    expect(screen.getByTestId("notifications").textContent).toBe(JSON.stringify(notifications));
  });

  it("updates newNotification on newNotification event when id is present", async () => {
    const notification = {
      id: "n1",
      appId: "app1",
      userId: "u1",
      groupKey: "g1",
      message: "New!",
      status: "info" as const,
      readStatus: false,
      createdAt: "",
      updatedAt: "",
    };
    render(<Wrapper />);
    await act(async () => {
      getLastClient().emit("newNotification", notification);
    });
    expect(screen.getByTestId("new-notification").textContent).toBe(JSON.stringify(notification));
  });

  it("ignores newNotification event when payload has no id", async () => {
    render(<Wrapper />);
    await act(async () => {
      getLastClient().emit("newNotification", { message: "no id here", appId: "app1" });
    });
    expect(screen.getByTestId("new-notification").textContent).toBe("null");
  });

  it("updates listConfigurations on listConfigurations event", async () => {
    const config = { id: "cfg1", userId: "u1", enableNotification: true };
    render(<Wrapper />);
    await act(async () => {
      getLastClient().emit("listConfigurations", config);
    });
    expect(screen.getByTestId("configurations").textContent).toBe(JSON.stringify(config));
  });

  it("registers all six event handlers on the client", () => {
    render(<Wrapper />);
    const { on } = getLastClient();
    const registeredEvents = (on as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0] as string);
    expect(registeredEvents).toContain("connected");
    expect(registeredEvents).toContain("disconnected");
    expect(registeredEvents).toContain("error");
    expect(registeredEvents).toContain("listNotifications");
    expect(registeredEvents).toContain("newNotification");
    expect(registeredEvents).toContain("listConfigurations");
  });

  it("removes all event handlers from the client on unmount", () => {
    const { unmount } = render(<Wrapper />);
    const { off } = getLastClient();
    unmount();
    const removedEvents = (off as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0] as string);
    expect(removedEvents).toContain("connected");
    expect(removedEvents).toContain("disconnected");
    expect(removedEvents).toContain("error");
    expect(removedEvents).toContain("listNotifications");
    expect(removedEvents).toContain("newNotification");
    expect(removedEvents).toContain("listConfigurations");
  });
});
