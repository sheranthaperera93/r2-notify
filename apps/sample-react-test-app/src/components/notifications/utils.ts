import { NotificationApp, NotificationGroup, NotificationMessage } from "r2-notify-client";

export function parseTime(s?: string) {
  if (!s) return 0;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : 0;
}

export function formatDate(dateString?: string) {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString ?? "";
  }
};

export function groupNotifications(all: NotificationMessage[]): NotificationApp[] {
  const apps = new Map<
    string,
    { latest: number; unread: number; total: number; groups: Map<string, NotificationGroup> }
  >();

  for (const n of all) {
    const t = Math.max(parseTime(n.createdAt), parseTime(n.updatedAt));
    const app = apps.get(n.appId) ?? {
      latest: 0,
      unread: 0,
      total: 0,
      groups: new Map<string, NotificationGroup>(),
    };

    const grp = app.groups.get(n.groupKey) ?? {
      groupKey: n.groupKey,
      latest: 0,
      unread: 0,
      items: [],
    };

    grp.items.push(n);
    grp.latest = Math.max(grp.latest, t);
    if (!n.readStatus) grp.unread += 1;

    app.groups.set(n.groupKey, grp);
    app.latest = Math.max(app.latest, t);
    app.unread += n.readStatus ? 0 : 1;
    app.total += 1;

    apps.set(n.appId, app);
  }

  const appArr: NotificationApp[] = Array.from(apps, ([appId, data]) => {
    const groups = Array.from(data.groups.values()).map((g) => {
      g.items.sort((a, b) => {
        const ta = Math.max(parseTime(a.createdAt), parseTime(a.updatedAt));
        const tb = Math.max(parseTime(b.createdAt), parseTime(b.updatedAt));
        return tb - ta;
      });
      return g;
    });
    groups.sort((a, b) => b.latest - a.latest);

    return {
      appId,
      latest: data.latest,
      unread: data.unread,
      total: data.total,
      groups,
    };
  });

  appArr.sort((a, b) => b.latest - a.latest);
  return appArr;
}

/** Dedup + newest-first sort for your flat source of truth */
export function deDuplicateAndSort(
  merged: NotificationMessage[]
): NotificationMessage[] {
  const byId = new Map<string, NotificationMessage>();
  for (const n of merged) {
    const existing = byId.get(n.id);
    if (!existing) {
      byId.set(n.id, n);
    } else {
      const te = Math.max(parseTime(existing.createdAt), parseTime(existing.updatedAt));
      const tn = Math.max(parseTime(n.createdAt), parseTime(n.updatedAt));
      if (tn >= te) byId.set(n.id, n);
    }
  }
  const result = Array.from(byId.values());
  result.sort((a, b) => {
    const ta = Math.max(parseTime(a.createdAt), parseTime(a.updatedAt));
    const tb = Math.max(parseTime(b.createdAt), parseTime(b.updatedAt));
    return tb - ta;
  });
  return result;
}
