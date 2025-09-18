import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Divider
} from '@mui/material';

const Settings = () => {
  const [settings, setSettings] = useState({
    stealthLevel: 'ultra',
    defaultTimeout: 60000,
    maxRetries: 3,
    notificationsEnabled: true,
    discordWebhook: '',
    captchaApiKey: '',
    proxyEnabled: false,
    proxyUrl: ''
  });

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        ⚙️ Settings
      </Typography>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            General Settings
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Default Timeout (ms)"
                type="number"
                value={settings.defaultTimeout}
                onChange={(e) => setSettings({...settings, defaultTimeout: parseInt(e.target.value)})}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Retries"
                type="number"
                value={settings.maxRetries}
                onChange={(e) => setSettings({...settings, maxRetries: parseInt(e.target.value)})}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                Notifications
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notificationsEnabled}
                    onChange={(e) => setSettings({...settings, notificationsEnabled: e.target.checked})}
                  />
                }
                label="Enable Notifications"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Discord Webhook URL"
                value={settings.discordWebhook}
                onChange={(e) => setSettings({...settings, discordWebhook: e.target.value})}
                placeholder="https://discord.com/api/webhooks/..."
              />
            </Grid>

            <Grid item xs={12}>
              <Button variant="contained" sx={{ mt: 2 }}>
                Save Settings
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;