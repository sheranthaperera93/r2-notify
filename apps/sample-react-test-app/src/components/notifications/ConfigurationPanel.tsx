import React, { useEffect, useState } from "react";
import { useNotifications, useNotifyActions } from "r2-notify-react";
import { Box, FormLabel, Switch, TextField, Typography } from "@mui/material";

interface Configuration {
  [key: string]: any;
}

const ConfigurationPanel: React.FC = () => {
  const { listConfigurations: configuration } = useNotifications();
  const { setNotificationStatus } = useNotifyActions();
  const [isEnabled, setIsEnabled] = useState<boolean>(
    configuration?.enableNotification ?? false,
  );

  const configList = configuration ? (configuration as Configuration) : {};
  const configEntries = Object.entries(configList);

  const handleEnableConfigChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newValue = event.target.checked;
    setIsEnabled(newValue);
    if (configuration) {
      setNotificationStatus(newValue);
    }
  };

  useEffect(() => {
    if (configuration?.enableNotification !== undefined) {
      setIsEnabled(configuration.enableNotification);
    }
  }, [configuration?.enableNotification]);

  return (
    <Box sx={{ padding: 2 }}>
      {configEntries.length > 0 && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
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
              checked={isEnabled}
              onChange={handleEnableConfigChange}
              title={`Notifications ${isEnabled ? "enabled" : "disabled"}`}
            />
          </Box>
        </Box>
      )}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <Typography variant="caption" gutterBottom>
          Powered by r2-notify
        </Typography>
      </Box>
    </Box>
  );
};

export default ConfigurationPanel;
