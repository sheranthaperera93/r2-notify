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
import { AppUI } from "./types";
import { useState } from "react";

type Props = {
  app: AppUI;
  formatDate: (s?: string) => string;
  stop: (e: React.SyntheticEvent) => void;
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
  formatDate,
  stop,
  onAppMarkRead,
  onAppDelete,
  onGroupMarkRead,
  onGroupDelete,
  onItemRead,
  onItemDelete,
}: Props) {
  const stopToggle = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  return (
    <Accordion
      disableGutters
      square
      elevation={0}
      sx={{
        "&:before": { display: "none" },
        "&.Mui-expanded": { margin: 0 },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        id={`app-header-${app.appId}`}
        sx={{
          flexDirection: "row-reverse",
          "& .MuiAccordionSummary-content": { ml: 1 },
          pl: 0,
          pr: 0,
        }}
      >
        {/* Text (left) */}
        <Typography component="span" noWrap sx={{ flex: 1, minWidth: 0 }}>
          {app.appId}
        </Typography>

        {/* Actions (right) — in summary */}
        <Box
          onClick={stopToggle}
          onFocus={stopToggle}
          sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}
        >
          <IconButton
            aria-describedby="App-More"
            onClick={handleClick}
            component="span"
          >
            <MoreVertOutlined fontSize="small" />
          </IconButton>
          <Popover
            id={id}
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

          {/* <IconButton
            size="small"
            component="span"
            title="Mark App as Read"
            onClick={(e) => {
              e.stopPropagation();
              onAppMarkRead(e, app.appId);
            }}
          >
            <Check fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            component="span"
            title="Delete App"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onAppDelete(e, app.appId);
            }}
          >
            <DeleteOutline fontSize="small" />
          </IconButton> */}
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0, pl: 2, pr: 0 }}>
        {/* Groups */}
        {app.groups.map((group) => (
          <GroupAccordion
            key={`group-${app.appId}-${group.groupKey}`}
            appId={app.appId}
            group={group}
            formatDate={formatDate}
            stop={stop}
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
