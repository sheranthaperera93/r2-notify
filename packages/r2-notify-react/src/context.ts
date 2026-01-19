
import React from "react";
import type { R2NotifyState } from "./types";
import type { R2NotifyClient } from "r2-notify-client";

export interface R2NotifyContextValue {
  client: R2NotifyClient | null;
  state: R2NotifyState;
  actions: {
    markAsRead: () => void;
    markAppAsRead: (appId: string) => void;
    markGroupAsRead: (appId: string, groupId: string) => void;
    markNotificationAsRead: (id: string) => void;

    deleteNotifications: () => void;
    deleteAppNotifications: (appId: string) => void;
    deleteGroupNotifications: (appId: string, groupId: string) => void;
    deleteNotification: (id: string) => void;

    reloadNotifications: () => void;
    toggleNotificationStatus: (appId: string, enabled: boolean) => void;
  };
}

export const R2NotifyContext = React.createContext<R2NotifyContextValue | null>(null);
