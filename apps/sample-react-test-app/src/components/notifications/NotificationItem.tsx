// components/notifications/NotificationItem.tsx
import { Check, DeleteOutline } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import NotificationStatusBorder from "./NotificationStatusBorder";
import { NotificationMessage } from "./types";

type Props = {
  item: NotificationMessage;
  formatDate: (s?: string) => string;
  onMarkRead: (e: React.MouseEvent, id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  stop: (e: React.SyntheticEvent) => void;
};

export default function NotificationItem({
  item,
  formatDate,
  onMarkRead,
  onDelete,
  stop,
}: Props) {
  return (
    <NotificationStatusBorder status={item.status} sx={{ mb: 0.5 }}>
      <Box
        onClick={stop}
        onFocus={stop}
        sx={{ display: "flex", alignItems: "center", py: 0.5 }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="div" noWrap>
            {item.message}
          </Typography>
          <Typography
            component="div"
            variant="caption"
            color="text.secondary"
            noWrap
          >
            {formatDate(item.createdAt)}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
          <IconButton
            size="small"
            title="Mark as Read"
            onClick={(e) => onMarkRead(e, item.id)}
          >
            <Check fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            title="Delete"
            color="error"
            onClick={(e) => onDelete(e, item.id)}
          >
            <DeleteOutline fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </NotificationStatusBorder>
  );
}
