// components/notifications/GroupAccordion.tsx
import { Check, DeleteOutline } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import NotificationItem from "./NotificationItem";
import { GroupUI, NotificationMessage } from "./types";

type Props = {
  appId: string;
  group: GroupUI;
  formatDate: (s?: string) => string;
  stop: (e: React.SyntheticEvent) => void;
  onMarkRead: (e: React.MouseEvent, appId: string, groupKey: string) => void;
  onDelete: (e: React.MouseEvent, appId: string, groupKey: string) => void;
  onItemRead: (e: React.MouseEvent, id: string) => void;
  onItemDelete: (e: React.MouseEvent, id: string) => void;
};

export default function GroupAccordion({
  appId,
  group,
  formatDate,
  stop,
  onMarkRead,
  onDelete,
  onItemRead,
  onItemDelete,
}: Props) {
  return (
    <Accordion
      disableGutters
      elevation={0}
      square
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
          "& .MuiAccordionSummary-content": { ml: 1 },
          pl: 0,
          pr: 0,
        }}
      >
        <Typography component="span" noWrap sx={{ flex: 1, minWidth: 0 }}>
          {group.groupKey}
        </Typography>

        {/* Group actions */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <IconButton
            size="small"
            component="span"
            title="Mark Group as Read"
            onClick={(e) => onMarkRead(e, appId, group.groupKey)}
          >
            <Check fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            component="span"
            title="Delete Group"
            color="error"
            onClick={(e) => onDelete(e, appId, group.groupKey)}
          >
            <DeleteOutline fontSize="small" />
          </IconButton>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0, pr: 0, pl: 0 }}>
        {/* Items */}
        {group.items.map((item: NotificationMessage) => (
          <NotificationItem
            key={item.id}
            item={item}
            formatDate={formatDate}
            onMarkRead={onItemRead}
            onDelete={onItemDelete}
            stop={stop}
          />
        ))}
      </AccordionDetails>
    </Accordion>
  );
}
