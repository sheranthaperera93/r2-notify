// components/notifications/AppAccordion.tsx
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
import GroupAccordion from "./GroupAccordion";
import { useState } from "react";
import { NotificationApp } from "r2-notify-client";

type Props = {
  app: NotificationApp;
  onAppMarkRead: (e: React.MouseEvent, appId: string) => void;
  onAppDelete: (e: React.MouseEvent, appId: string) => void;
  onGroupMarkRead: (
    e: React.MouseEvent,
    appId: string,
    groupKey: string,
  ) => void;
  onGroupDelete: (e: React.MouseEvent, appId: string, groupKey: string) => void;
  onItemRead: (e: React.MouseEvent, id: string) => void;
  onItemDelete: (e: React.MouseEvent, id: string) => void;
};

export default function AppAccordion({
  app,
  onAppMarkRead,
  onAppDelete,
  onGroupMarkRead,
  onGroupDelete,
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
      defaultExpanded
      elevation={0}
      sx={{
        "&:before": { display: "none" },
        "&.Mui-expanded": { margin: 0 },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        id={`app-more-${app.appId}`}
        sx={{
          flexDirection: "row-reverse",
          pl: 0,
          pr: 0,
        }}
      >
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
          {/* Text (left) */}
          <Typography noWrap sx={{ ml: 1 }}>
            {app.appId}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {/* Actions (right) — in summary */}
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
              id={open ? "simple-popover" : undefined}
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
                      onAppMarkRead(e, app.appId);
                      handleClose();
                    }}
                  >
                    <ListItemIcon title="Mark App as Read">
                      <Check fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText>Mark App as Read</ListItemText>
                  </MenuItem>
                  <MenuItem
                    onClick={(e) => {
                      onAppDelete(e, app.appId);
                      handleClose();
                    }}
                  >
                    <ListItemIcon title="Delete App" color="error">
                      <DeleteOutline fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Delete App</ListItemText>
                  </MenuItem>
                </MenuList>
              </Box>
            </Popover>
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails style={{ padding: 0 }}>
        {/* Groups */}
        {app.groups.map((group) => (
          <GroupAccordion
            key={`group-${app.appId}-${group.groupKey}`}
            appId={app.appId}
            group={group}
            onMarkRead={onGroupMarkRead}
            onDelete={onGroupDelete}
            onItemRead={onItemRead}
            onItemDelete={onItemDelete}
          />
        ))}
      </AccordionDetails>
    </Accordion>
  );
}
