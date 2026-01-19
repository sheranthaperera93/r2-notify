import { Box } from "@mui/material";

const STATUS_COLOR_MAP: Record<string, string> = {
  success: "#2e7d32", // green
  error: "#d32f2f", // red
  warning: "#ed6c02", // orange
  info: "#0288d1", // blue
};

export default function NotificationStatusBorder({
  status,
  children,
  sx = {},
}: {
  status: string;
  children: any;
  sx?: object;
}) {
  return (
    <Box
      sx={{
        borderLeft: "4px solid",
        borderLeftColor: STATUS_COLOR_MAP[status],
        pl: 1,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
