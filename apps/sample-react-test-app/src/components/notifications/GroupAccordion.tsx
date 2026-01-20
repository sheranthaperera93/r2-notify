// components/notifications/GroupAccordion.tsx
import { Check, DeleteOutline, MoreVertOutlined } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Popover,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import NotificationItem from "./NotificationItem";
import { useState } from "react";
import { NotificationGroup, NotificationMessage } from "r2-notify-client";

type Props = {
  appId: string;
  group: NotificationGroup;
  onMarkRead: (e: React.MouseEvent, appId: string, groupKey: string) => void;
  onDelete: (e: React.MouseEvent, appId: string, groupKey: string) => void;
  onItemRead: (e: React.MouseEvent, id: string) => void;
  onItemDelete: (e: React.MouseEvent, id: string) => void;
};

export default function GroupAccordion({
  appId,
  group,
  onMarkRead,
  onDelete,
  onItemRead,
  onItemDelete,
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
    <Accordion
      disableGutters
      elevation={0}
      defaultExpanded
      sx={{
        "&:before": { display: "none" },
        "&.Mui-expanded": { margin: 0 },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        id={`group-header-${group.groupKey}`}
        sx={{
          flexDirection: "row-reverse",
          pl: 2,
          pr: 0,
        }}
      >
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
          <Typography noWrap sx={{ ml: 1 }}>
            {group.groupKey}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {/* Group actions */}
          <Box
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
          >
            <IconButton
              aria-describedby="App-More"
              onClick={handleClick}
              component="span"
            >
              <MoreVertOutlined fontSize="small" />
            </IconButton>
            <Popover
              id={`group-more-${group.groupKey}`}
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
                      onMarkRead(e, appId, group.groupKey);
                      handleClose();
                    }}
                  >
                    <ListItemIcon title="Mark group as Read">
                      <Check fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText>Mark Group as Read</ListItemText>
                  </MenuItem>
                  <MenuItem
                    onClick={(e) => {
                      onDelete(e, appId, group.groupKey);
                      handleClose();
                    }}
                  >
                    <ListItemIcon title="Delete App" color="error">
                      <DeleteOutline fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Delete Group</ListItemText>
                  </MenuItem>
                </MenuList>
              </Box>
            </Popover>
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails style={{ padding: 0 }}>
        {/* Items */}
        {group.items.map((item: NotificationMessage) => (
          <NotificationItem
            key={item.id}
            item={item}
            onMarkRead={onItemRead}
            onDelete={onItemDelete}
          />
        ))}
      </AccordionDetails>
    </Accordion>
  );
}
