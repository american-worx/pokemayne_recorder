import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Analytics = () => {
  const data = [
    { time: '00:00', success: 95, errors: 5 },
    { time: '04:00', success: 98, errors: 2 },
    { time: '08:00', success: 92, errors: 8 },
    { time: '12:00', success: 97, errors: 3 },
    { time: '16:00', success: 100, errors: 0 },
    { time: '20:00', success: 94, errors: 6 }
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        📈 Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Performance Over Time
              </Typography>

              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="time" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip
                      contentStyle={{
                        background: '#2a2a2a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="success"
                      stroke="#00e676"
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="errors"
                      stroke="#ff5252"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;