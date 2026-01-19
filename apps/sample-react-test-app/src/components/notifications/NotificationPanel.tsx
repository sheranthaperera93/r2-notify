// components/notifications/NotificationPanel.tsx
import {
  Badge,
  Box,
  Button,
  IconButton,
  Popover,
  Typography,
} from "@mui/material";
import { Notifications } from "@mui/icons-material";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNotifications, useNotifyActions } from "r2-notify-react";
import { AppUI, NotificationMessage } from "./types";
import { dedupAndSort, groupNotifications } from "./utils";
import AppAccordion from "./AppAccordion";

export default function NotificationPanel() {
  const { listNotifications, newNotification } = useNotifications();
  const actions = useNotifyActions();

  // Incremental accumulation (as you had)
  const [incr, setIncr] = useState<NotificationMessage[]>([]);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    console.log("Called listNotifications", listNotifications);
    const base = Array.isArray(listNotifications) ? listNotifications : [];
    const nextSeen = new Set<string>();
    for (const n of base) nextSeen.add(n.id);
    seen.current = nextSeen;
    setIncr((curr) => curr.filter((n) => !nextSeen.has(n.id)));
  }, [listNotifications]);

  useEffect(() => {
    console.log("Called new notification", newNotification);
    if (!newNotification) return;
    const n = newNotification as NotificationMessage;
    if (!n.id || seen.current.has(n.id)) return;
    seen.current.add(n.id);
    setIncr((curr) => [n, ...curr]);
  }, [newNotification]);

  const all = useMemo(() => {
    const base = Array.isArray(listNotifications) ? listNotifications : [];
    return dedupAndSort([...incr, ...base]);
  }, [listNotifications, incr]);

  const grouped = useMemo<AppUI[]>(() => groupNotifications(all), [all]);

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);
  const id = open ? "notifications-popup" : undefined;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const handleRefresh = () => actions?.reloadNotifications?.();

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString ?? "";
    }
  };

  // Action handlers
  const handleAppMarkAsRead = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    actions?.markAppAsRead?.(appId);
  };
  const handleAppDelete = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    actions?.deleteAppNotifications?.(appId);
  };
  const handleGroupMarkAsRead = (
    e: React.MouseEvent,
    appId: string,
    groupKey: string,
  ) => {
    e.stopPropagation();
    actions?.markGroupAsRead?.(appId, groupKey);
  };
  const handleGroupDelete = (
    e: React.MouseEvent,
    appId: string,
    groupKey: string,
  ) => {
    e.stopPropagation();
    actions?.deleteGroupNotifications?.(appId, groupKey);
  };
  const handleMarkNotificationAsRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    actions?.markNotificationAsRead?.(id);
  };
  const handleNotificationDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    actions?.deleteNotification?.(id);
  };
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <>
      <IconButton
        size="large"
        aria-describedby={id}
        onClick={handleClick}
        edge="end"
        color="inherit"
        aria-label="Notifications"
      >
        <Badge badgeContent={all.length} color="error">
          <Notifications />
        </Badge>
      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        slotProps={{ paper: { sx: { maxWidth: 500, minWidth: 400 } } }}
      >
        <Box sx={{ flex: 1 }}>
          {/* Header bar */}
          <Box
            sx={{
              p: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="body1">Total: {all.length}</Typography>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              title="Reload Notifications"
              onClick={handleRefresh}
            >
              Reload
            </Button>
          </Box>

          {/* Content */}
          <Box sx={{ p: 1 }}>
            {grouped.length === 0 ? (
              <Box textAlign="center" color="#999" pb={4}>
                <Box fontSize="3em" mb={2}>
                  📭
                </Box>
                <Typography variant="subtitle1">
                  No notifications yet
                </Typography>
                <Typography variant="caption" color="#b1a9a9" sx={{ mt: 1 }}>
                  Notifications will appear here when received
                </Typography>
              </Box>
            ) : (
              grouped.map((app) => (
                <AppAccordion
                  key={`notification-app-${app.appId}`}
                  app={app}
                  formatDate={formatDate}
                  stop={stop}
                  onAppMarkRead={handleAppMarkAsRead}
                  onAppDelete={handleAppDelete}
                  onGroupMarkRead={handleGroupMarkAsRead}
                  onGroupDelete={handleGroupDelete}
                  onItemRead={handleMarkNotificationAsRead}
                  onItemDelete={handleNotificationDelete}
                />
              ))
            )}
          </Box>
        </Box>
      </Popover>
    </>
  );
}
``;
