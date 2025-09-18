import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp,
  VideoCall,
  Visibility,
  PlayArrow,
  CheckCircle,
  Warning,
  Speed,
  ShoppingCart,
  Timer,
  Notifications
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ stats }) => {
  const navigate = useNavigate();
  const [recentActivity, setRecentActivity] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [stockData, setStockData] = useState([]);

  useEffect(() => {
    // Simulate real-time data
    setRecentActivity([
      { id: 1, type: 'stock_alert', message: 'Pokemon cards back in stock at Walmart!', time: '2 minutes ago', icon: '🎉', color: '#00e676' },
      { id: 2, type: 'recording', message: 'Recording session completed for Target checkout', time: '5 minutes ago', icon: '🎬', color: '#ff5722' },
      { id: 3, type: 'automation', message: 'Automation ran successfully - Order #12345', time: '10 minutes ago', icon: '🤖', color: '#2196f3' },
      { id: 4, type: 'monitor', message: 'Added new monitor for Best Buy Pokemon cards', time: '15 minutes ago', icon: '👀', color: '#4caf50' },
      { id: 5, type: 'error', message: 'CAPTCHA detected in Walmart automation', time: '20 minutes ago', icon: '⚠️', color: '#ff9800' }
    ]);

    setPerformanceData([
      { time: '12:00', success: 95, errors: 5, response: 1200 },
      { time: '12:05', success: 98, errors: 2, response: 1100 },
      { time: '12:10', success: 92, errors: 8, response: 1300 },
      { time: '12:15', success: 97, errors: 3, response: 1050 },
      { time: '12:20', success: 100, errors: 0, response: 950 },
      { time: '12:25', success: 94, errors: 6, response: 1150 }
    ]);

    setStockData([
      { name: 'In Stock', value: 12, color: '#00e676' },
      { name: 'Out of Stock', value: 8, color: '#ff5252' },
      { name: 'Monitoring', value: 5, color: '#2196f3' },
      { name: 'Error', value: 2, color: '#ff9800' }
    ]);
  }, []);

  const quickActions = [
    {
      title: 'Start Recording',
      description: 'Record a new checkout flow',
      icon: VideoCall,
      color: '#ff5722',
      action: () => navigate('/recorder')
    },
    {
      title: 'Add Monitor',
      description: 'Monitor new product stock',
      icon: Visibility,
      color: '#4caf50',
      action: () => navigate('/monitor')
    },
    {
      title: 'Run Automation',
      description: 'Execute saved automation',
      icon: PlayArrow,
      color: '#2196f3',
      action: () => navigate('/automation')
    }
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Welcome to Pokemayne Recorder 🎯
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.400' }}>
            Your superior e-commerce automation command center
          </Typography>
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card
              sx={{
                background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.1) 0%, rgba(255, 87, 34, 0.05) 100%)',
                border: '1px solid rgba(255, 87, 34, 0.2)'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#ff5722', mr: 2 }}>
                    <VideoCall />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff5722' }}>
                      {stats.activeRecordings || 2}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'grey.400' }}>
                      Active Recordings
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={75}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 87, 34, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#ff5722',
                      borderRadius: 2
                    }
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card
              sx={{
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
                border: '1px solid rgba(76, 175, 80, 0.2)'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#4caf50', mr: 2 }}>
                    <Visibility />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                      {stats.activeMonitors || 15}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'grey.400' }}>
                      Active Monitors
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={85}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4caf50',
                      borderRadius: 2
                    }
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card
              sx={{
                background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%)',
                border: '1px solid rgba(33, 150, 243, 0.2)'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#2196f3', mr: 2 }}>
                    <PlayArrow />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196f3' }}>
                      {stats.totalAutomations || 47}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'grey.400' }}>
                      Automations Run
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={92}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#2196f3',
                      borderRadius: 2
                    }
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card
              sx={{
                background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.1) 0%, rgba(0, 230, 118, 0.05) 100%)',
                border: '1px solid rgba(0, 230, 118, 0.2)'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#00e676', color: 'black', mr: 2 }}>
                    <TrendingUp />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#00e676' }}>
                      {stats.successRate || 94}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'grey.400' }}>
                      Success Rate
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={94}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: 'rgba(0, 230, 118, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#00e676',
                      borderRadius: 2
                    }
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Quick Actions
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      >
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={action.action}
                          sx={{
                            p: 2,
                            borderColor: `${action.color}30`,
                            color: action.color,
                            justifyContent: 'flex-start',
                            '&:hover': {
                              borderColor: `${action.color}50`,
                              background: `${action.color}10`
                            }
                          }}
                        >
                          <Icon sx={{ mr: 2, color: action.color }} />
                          <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {action.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'grey.400' }}>
                              {action.description}
                            </Typography>
                          </Box>
                        </Button>
                      </motion.div>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Recent Activity
                </Typography>

                <List>
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <ListItem
                        sx={{
                          mb: 1,
                          borderRadius: 2,
                          background: `${activity.color}08`,
                          border: `1px solid ${activity.color}20`,
                          '&:hover': {
                            background: `${activity.color}15`
                          }
                        }}
                      >
                        <ListItemIcon>
                          <Typography sx={{ fontSize: '1.5rem' }}>
                            {activity.icon}
                          </Typography>
                        </ListItemIcon>
                        <ListItemText
                          primary={activity.message}
                          secondary={activity.time}
                          sx={{
                            '& .MuiListItemText-primary': {
                              fontWeight: 500,
                              fontSize: '0.95rem'
                            },
                            '& .MuiListItemText-secondary': {
                              color: 'grey.500',
                              fontSize: '0.8rem'
                            }
                          }}
                        />
                      </ListItem>
                    </motion.div>
                  ))}
                </List>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Performance Chart */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Performance Metrics
                </Typography>

                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
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
                        dot={{ fill: '#00e676', strokeWidth: 2, r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="response"
                        stroke="#667eea"
                        strokeWidth={2}
                        dot={{ fill: '#667eea', strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Stock Distribution */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Stock Distribution
                </Typography>

                <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stockData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#2a2a2a',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                  {stockData.map((item, index) => (
                    <Chip
                      key={index}
                      label={`${item.name}: ${item.value}`}
                      size="small"
                      sx={{
                        bgcolor: item.color,
                        color: item.name === 'In Stock' ? 'black' : 'white',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;