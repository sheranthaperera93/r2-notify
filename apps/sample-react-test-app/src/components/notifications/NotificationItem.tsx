// components/notifications/NotificationItem.tsx
import { Check, DeleteOutline, MoreVertOutlined } from "@mui/icons-material";
import {
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Popover,
  Typography,
} from "@mui/material";
import NotificationStatusBorder from "./NotificationStatusBorder";
import { formatDate } from "./utils";
import { useState } from "react";
import { NotificationMessage } from "r2-notify-client";

type Props = {
  item: NotificationMessage;
  onMarkRead: (e: React.MouseEvent, id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
};

export default function NotificationItem({
  item,
  onMarkRead,
  onDelete,
}: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  return (
    <NotificationStatusBorder status={item.status} sx={{ mb: 0.5, ml: 3 }}>
      <Box
        onClick={(e) => e.stopPropagation()}
        onFocus={(e) => e.stopPropagation()}
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
            aria-describedby="App-More"
            onClick={handleClick}
            component="span"
          >
            <MoreVertOutlined fontSize="small" />
          </IconButton>
          <Popover
            id={`group-more-${item.id}`}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
          >
            <Box>
              <MenuList disablePadding>
                <MenuItem
                  onClick={(e) => {
                    onMarkRead(e, item.id);
                    handleClose();
                  }}
                >
                  <ListItemIcon title="Mark group as Read">
                    <Check fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText>Mark as Read</ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={(e) => {
                    onDelete(e, item.id);
                    handleClose();
                  }}
                >
                  <ListItemIcon title="Delete App" color="error">
                    <DeleteOutline fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText>Delete</ListItemText>
                </MenuItem>
              </MenuList>
            </Box>
          </Popover>
        </Box>
      </Box>
    </NotificationStatusBorder>
  );
}
