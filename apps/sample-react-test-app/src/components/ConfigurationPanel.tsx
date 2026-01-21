import React from "react";
import { useNotifications, useNotifyActions } from "r2-notify-react";
import {
  Box,
  Card,
  FormLabel,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

interface Configuration {
  [key: string]: any;
}

const ConfigurationPanel: React.FC = () => {
  const { listConfigurations: configuration } = useNotifications();
  const { setNotificationStatus } = useNotifyActions();

  const configList = configuration ? (configuration as Configuration) : {};
  const configEntries = Object.entries(configList);

  const handleEnableConfigChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const isEnabled = event.target.checked;
    if (configuration) setNotificationStatus(isEnabled);
  };

  return (
    <Card className="card">
      <Typography variant="h6">⚙️ Configuration</Typography>

      {configEntries.length > 0 && (
        <Box>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2, mb: 2 }}
          >
            <FormLabel sx={{ minWidth: 150 }}>ID</FormLabel>
            <TextField
              id="config_id_field"
              variant="standard"
              fullWidth
              value={configuration?.id}
              placeholder="Unique socket identifier"
              slotProps={{
                inputLabel: { shrink: false },
              }}
            />
          </Box>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2, mb: 2 }}
          >
            <FormLabel sx={{ minWidth: 150 }}>Client ID</FormLabel>
            <TextField
              id="config_user_id_field"
              variant="standard"
              fullWidth
              value={configuration?.userId}
              placeholder="Unique user identifier"
              slotProps={{
                inputLabel: { shrink: false },
              }}
            />
          </Box>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2, mb: 2 }}
          >
            <FormLabel sx={{ minWidth: 140 }}>Enable Notifications</FormLabel>
            <Switch
              checked={configuration?.enableNotification}
              onChange={handleEnableConfigChange}
              title={`Notifications ${configuration?.enableNotification ? "enabled" : "disabled"}`}
            />
          </Box>
        </Box>
      )}
    </Card>
  );
};

export default ConfigurationPanel;
