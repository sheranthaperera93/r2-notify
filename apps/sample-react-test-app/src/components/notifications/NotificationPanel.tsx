// components/notifications/NotificationPanel.tsx
import {
  Badge,
  Box,
  Button,
  IconButton,
  Popover,
  ToggleButton,
  Typography,
} from "@mui/material";
import {
  Notifications,
  NotificationsOffOutlined,
  NotificationsOutlined,
  RefreshOutlined,
  SettingsOutlined,
} from "@mui/icons-material";
import React, { useEffect, useMemo, useState } from "react";
import { useNotifications, useNotifyActions } from "r2-notify-react";
import { NotificationApp, NotificationMessage } from "r2-notify-client";
import { deDuplicateAndSort, groupNotifications } from "./utils";
import AppAccordion from "./AppAccordion";
import ConfigurationPanel from "./ConfigurationPanel";

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const { listNotifications, newNotification, isConnected } =
    useNotifications();
  const actions = useNotifyActions();
  const [visibleSettings, setVisibleSettings] = useState(false);

  useEffect(() => {
    const base = Array.isArray(listNotifications) ? listNotifications : [];
    setNotifications(base);
  }, [listNotifications]);

  useEffect(() => {
    if (!newNotification) return;
    const n = newNotification as NotificationMessage;
    setNotifications((curr) => [n, ...curr]);
  }, [newNotification]);

  const allNotifications = useMemo(() => {
    const base = Array.isArray(listNotifications) ? listNotifications : [];
    return deDuplicateAndSort([...notifications, ...base]);
  }, [listNotifications, notifications]);

  const grouped = useMemo<NotificationApp[]>(
    () => groupNotifications(allNotifications),
    [allNotifications],
  );

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);
  const handleRefresh = () => actions?.reloadNotifications?.();

  /**
   * Handles the event to mark all notifications for a specific app as read.
   * @param {React.MouseEvent} e - The event object.
   * @param {string} appId - The ID of the app to mark as read.
   */
  const handleAppMarkAsRead = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    actions?.markAppAsRead?.(appId);
  };

  /**
   * Handles the event to delete all notifications for a specific app.
   * @param {React.MouseEvent} e - The event object.
   * @param {string} appId - The ID of the app to delete notifications for.
   */
  const handleAppDelete = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    actions?.deleteAppNotifications?.(appId);
  };

  /**
   * Handles the event to mark all notifications for a specific app and group key as read.
   * @param {React.MouseEvent} e - The event object.
   * @param {string} appId - The ID of the app to mark as read.
   * @param {string} groupKey - The key of the group to mark as read.
   */
  const handleGroupMarkAsRead = (
    e: React.MouseEvent,
    appId: string,
    groupKey: string,
  ) => {
    e.stopPropagation();
    actions?.markGroupAsRead?.(appId, groupKey);
  };

  /**
   * Handles the event to delete all notifications for a specific app and group key.
   * @param {React.MouseEvent} e - The event object.
   * @param {string} appId - The ID of the app to delete notifications for.
   * @param {string} groupKey - The key of the group to delete notifications for.
   */
  const handleGroupDelete = (
    e: React.MouseEvent,
    appId: string,
    groupKey: string,
  ) => {
    e.stopPropagation();
    actions?.deleteGroupNotifications?.(appId, groupKey);
  };
  /**
   * Handles the event to mark a notification as read.
   * @param {React.MouseEvent} e - The event object.
   * @param {string} id - The ID of the notification to mark as read.
   */
  const handleMarkNotificationAsRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    actions?.markNotificationAsRead?.(id);
  };

  /**
   * Handles the event to delete a specific notification.
   * @param {React.MouseEvent} e - The event object.
   * @param {string} id - The ID of the notification to delete.
   */
  const handleNotificationDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    actions?.deleteNotification?.(id);
  };

  return (
    <>
      <IconButton
        size="large"
        aria-describedby={open ? "notifications-popup" : undefined}
        onClick={handleClick}
        edge="end"
        color="inherit"
        aria-label="Notifications"
      >
        <Badge badgeContent={isConnected ? notifications.length : "!"} color="error">
          <Notifications />
        </Badge>
      </IconButton>

      <Popover
        id={open ? "notifications-popup" : undefined}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 400 } } }}
      >
        <Box sx={{ flex: 1 }}>
          {!isConnected && (
            <>
              <Box
                sx={{
                  p: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Box textAlign="center" color="#999" pb={4}>
                  <Box mt={2} mb={2}>
                    <NotificationsOffOutlined fontSize="large" />
                  </Box>
                  <Typography variant="subtitle1">
                    System Unreachable
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    color="#b1a9a9"
                    sx={{ mt: 1 }}
                  >
                    Notification server unreachable
                  </Typography>
                </Box>
              </Box>
            </>
          )}

          {isConnected && (
            <>
              {/* Header bar */}
              <Box
                sx={{
                  p: 1,
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Button
                  size="medium"
                  variant="outlined"
                  color="inherit"
                  title="Reload Notifications"
                  onClick={handleRefresh}
                  startIcon={<RefreshOutlined />}
                >
                  Reload
                </Button>
                <ToggleButton
                  value="left"
                  aria-label="left aligned"
                  size="small"
                  sx={{ ml: 1 }}
                  onClick={() => setVisibleSettings((prev) => !prev)}
                  selected={visibleSettings}
                >
                  <SettingsOutlined />
                </ToggleButton>
              </Box>

              {visibleSettings && <ConfigurationPanel />}

              {/* Content */}
              {!visibleSettings && (
                <Box sx={{ p: 1 }}>
                  {grouped.length === 0 ? (
                    <Box textAlign="center" color="#999" pb={4}>
                      <Box mt={2} mb={2}>
                        <NotificationsOutlined fontSize="large" />
                      </Box>
                      <Typography variant="subtitle1">
                        No notifications yet
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        color="#b1a9a9"
                        sx={{ mt: 1 }}
                      >
                        Check if notifications are enabled in the settings
                        panel, or else notifications will appear here when
                        received.
                      </Typography>
                    </Box>
                  ) : (
                    grouped.map((app) => (
                      <AppAccordion
                        key={`notification-app-${app.appId}`}
                        app={app}
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
              )}
            </>
          )}
        </Box>
      </Popover>
    </>
  );
}
