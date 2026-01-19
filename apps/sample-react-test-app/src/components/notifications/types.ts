export interface NotificationMessage {
  id: string;
  appId: string;
  userId: string;
  groupKey: string;
  message: string;
  status: "success" | "error" | "warning" | "info";
  readStatus: boolean;
  createdAt: string;
  updatedAt: string;
}

export type GroupUI = {
  groupKey: string;
  latest: number;
  unread: number;
  items: NotificationMessage[];
};
export type AppUI = {
  appId: string;
  latest: number;
  unread: number;
  groups: GroupUI[];
  total: number;
};
