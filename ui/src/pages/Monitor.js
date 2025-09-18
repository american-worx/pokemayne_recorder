import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Avatar
} from '@mui/material';
import {
  Add,
  Visibility,
  PlayArrow,
  Stop,
  Delete,
  Edit,
  Notifications,
  TrendingUp,
  CheckCircle,
  Error,
  Warning,
  Circle,
  ShoppingCart
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';

const Monitor = () => {
  const [monitors, setMonitors] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState(null);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newMonitor, setNewMonitor] = useState({
    name: '',
    url: '',
    site: 'walmart',
    checkInterval: 30,
    conditions: {
      inStock: true,
      maxPrice: '',
      keywords: ''
    },
    notifications: {
      discord: false,
      webhook: '',
      desktop: true
    }
  });

  useEffect(() => {
    loadMonitors();
    loadStockAlerts();

    // Set up real-time updates
    const interval = setInterval(() => {
      if (isMonitoring) {
        loadMonitors();
        checkForNewAlerts();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const loadMonitors = async () => {
    try {
      const response = await apiService.getMonitors();
      setMonitors(response);
    } catch (error) {
      console.error('Failed to load monitors:', error);
    }
  };

  const loadStockAlerts = async () => {
    try {
      const alerts = await apiService.getStockAlerts();
      setStockAlerts(alerts);
    } catch (error) {
      console.error('Failed to load stock alerts:', error);
    }
  };

  const checkForNewAlerts = async () => {
    try {
      const newAlerts = await apiService.getRecentStockAlerts();

      newAlerts.forEach(alert => {
        if (alert.type === 'stock_available') {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);

          toast.success(
            `🎉 ${alert.productName} is now IN STOCK!`,
            {
              duration: 10000,
              style: {
                background: 'linear-gradient(135deg, #00e676 0%, #00c853 100%)',
                color: 'black',
                fontWeight: 600
              }
            }
          );
        }
      });
    } catch (error) {
      console.error('Failed to check for new alerts:', error);
    }
  };

  const startMonitoring = async () => {
    try {
      await apiService.startMonitoring();
      setIsMonitoring(true);
      toast.success('🔍 Monitoring started! You\'ll be notified when products come in stock.');
    } catch (error) {
      toast.error(`Failed to start monitoring: ${error.message}`);
    }
  };

  const stopMonitoring = async () => {
    try {
      await apiService.stopMonitoring();
      setIsMonitoring(false);
      toast.success('Monitoring stopped');
    } catch (error) {
      toast.error('Failed to stop monitoring');
    }
  };

  const addMonitor = async () => {
    try {
      const monitorData = {
        ...newMonitor,
        conditions: {
          ...newMonitor.conditions,
          maxPrice: newMonitor.conditions.maxPrice ? parseFloat(newMonitor.conditions.maxPrice) : null,
          keywords: newMonitor.conditions.keywords.split(',').map(k => k.trim()).filter(k => k)
        }
      };

      await apiService.addMonitor(monitorData);

      setAddDialogOpen(false);
      setNewMonitor({
        name: '',
        url: '',
        site: 'walmart',
        checkInterval: 30,
        conditions: {
          inStock: true,
          maxPrice: '',
          keywords: ''
        },
        notifications: {
          discord: false,
          webhook: '',
          desktop: true
        }
      });

      loadMonitors();
      toast.success('Monitor added successfully!');
    } catch (error) {
      toast.error(`Failed to add monitor: ${error.message}`);
    }
  };

  const deleteMonitor = async (monitorId) => {
    try {
      await apiService.deleteMonitor(monitorId);
      loadMonitors();
      toast.success('Monitor deleted');
    } catch (error) {
      toast.error('Failed to delete monitor');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_stock':
        return '#00e676';
      case 'out_of_stock':
        return '#ff5252';
      case 'monitoring':
        return '#2196f3';
      case 'error':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_stock':
        return <CheckCircle sx={{ color: '#00e676' }} />;
      case 'out_of_stock':
        return <Error sx={{ color: '#ff5252' }} />;
      case 'monitoring':
        return <Visibility sx={{ color: '#2196f3' }} />;
      case 'error':
        return <Warning sx={{ color: '#ff9800' }} />;
      default:
        return <Circle sx={{ color: '#757575' }} />;
    }
  };

  // Sample data for charts
  const stockHistoryData = [
    { time: '10:00', price: 45.99, inStock: 1 },
    { time: '10:30', price: 45.99, inStock: 1 },
    { time: '11:00', price: 0, inStock: 0 },
    { time: '11:30', price: 0, inStock: 0 },
    { time: '12:00', price: 47.99, inStock: 1 },
    { time: '12:30', price: 47.99, inStock: 1 }
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            📊 Inventory Monitor
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.400', mb: 3 }}>
            Real-time stock monitoring with instant alerts
          </Typography>
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        {/* Control Panel */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Monitor Control
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {!isMonitoring ? (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<PlayArrow />}
                      onClick={startMonitoring}
                      disabled={monitors.length === 0}
                      sx={{
                        background: 'linear-gradient(135deg, #00e676 0%, #00c853 100%)',
                        color: 'black',
                        fontWeight: 600,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #00c853 0%, #00a843 100%)'
                        }
                      }}
                    >
                      Start Monitoring
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<Stop />}
                      onClick={stopMonitoring}
                      sx={{
                        background: 'linear-gradient(135deg, #ff5252 0%, #c62828 100%)',
                        fontWeight: 600
                      }}
                    >
                      Stop Monitoring
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => setAddDialogOpen(true)}
                    sx={{
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': {
                        borderColor: 'primary.light',
                        background: 'rgba(102, 126, 234, 0.1)'
                      }
                    }}
                  >
                    Add Product
                  </Button>
                </Box>

                {isMonitoring && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.5 }}
                  >
                    <Alert
                      severity="success"
                      sx={{
                        mt: 3,
                        background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.1) 0%, rgba(0, 200, 83, 0.1) 100%)',
                        border: '1px solid rgba(0, 230, 118, 0.3)'
                      }}
                    >
                      Monitoring {monitors.length} product{monitors.length !== 1 ? 's' : ''}
                    </Alert>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Quick Stats
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'grey.400' }}>
                      Total Products
                    </Typography>
                    <Chip
                      label={monitors.length}
                      sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'grey.400' }}>
                      In Stock
                    </Typography>
                    <Chip
                      label={monitors.filter(m => m.status === 'in_stock').length}
                      sx={{ bgcolor: '#00e676', color: 'black', fontWeight: 600 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'grey.400' }}>
                      Out of Stock
                    </Typography>
                    <Chip
                      label={monitors.filter(m => m.status === 'out_of_stock').length}
                      sx={{ bgcolor: '#ff5252', color: 'white', fontWeight: 600 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'grey.400' }}>
                      Alerts Today
                    </Typography>
                    <Chip
                      label={stockAlerts.filter(a => {
                        const today = new Date().toDateString();
                        return new Date(a.timestamp).toDateString() === today;
                      }).length}
                      sx={{ bgcolor: '#ffc107', color: 'black', fontWeight: 600 }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Monitors List */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Product Monitors ({monitors.length})
                </Typography>

                {monitors.length === 0 ? (
                  <Alert severity="info">
                    No products being monitored. Add your first product to get started!
                  </Alert>
                ) : (
                  <List>
                    <AnimatePresence>
                      {monitors.map((monitor, index) => (
                        <motion.div
                          key={monitor.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <ListItem
                            sx={{
                              mb: 2,
                              borderRadius: 2,
                              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                              border: '1px solid rgba(102, 126, 234, 0.1)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                                border: '1px solid rgba(102, 126, 234, 0.2)'
                              }
                            }}
                          >
                            <ListItemIcon>
                              <Avatar
                                sx={{
                                  bgcolor: getStatusColor(monitor.status),
                                  width: 40,
                                  height: 40
                                }}
                              >
                                <ShoppingCart sx={{ color: 'white' }} />
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {monitor.name}
                                  </Typography>
                                  <Chip
                                    label={monitor.status?.replace('_', ' ').toUpperCase()}
                                    size="small"
                                    sx={{
                                      bgcolor: getStatusColor(monitor.status),
                                      color: monitor.status === 'in_stock' ? 'black' : 'white',
                                      fontWeight: 600,
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" sx={{ color: 'grey.400', mb: 0.5 }}>
                                    {monitor.url}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'grey.500' }}>
                                    Site: {monitor.site} • Check every {monitor.checkInterval}s •
                                    Last check: {monitor.lastCheck ? new Date(monitor.lastCheck).toLocaleTimeString() : 'Never'}
                                  </Typography>
                                  {monitor.price && (
                                    <Typography variant="caption" sx={{ color: 'success.main', display: 'block' }}>
                                      Current price: ${monitor.price}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedMonitor(monitor);
                                    setEditDialogOpen(true);
                                  }}
                                  sx={{ color: 'primary.main' }}
                                >
                                  <Edit />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => deleteMonitor(monitor.id)}
                                  sx={{ color: 'error.main' }}
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                            </ListItemSecondaryAction>
                          </ListItem>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </List>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Stock History Chart */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Stock History & Price Tracking
                </Typography>

                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stockHistoryData}>
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
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#667eea"
                        fill="url(#colorPrice)"
                        strokeWidth={2}
                      />
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Add Monitor Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(145deg, #1e1e1e 0%, #2a2a2a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <DialogTitle>Add New Product Monitor</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product Name"
                value={newMonitor.name}
                onChange={(e) => setNewMonitor({ ...newMonitor, name: e.target.value })}
                placeholder="Pokemon Trading Cards"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product URL"
                value={newMonitor.url}
                onChange={(e) => setNewMonitor({ ...newMonitor, url: e.target.value })}
                placeholder="https://www.walmart.com/ip/pokemon-cards/123"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Site</InputLabel>
                <Select
                  value={newMonitor.site}
                  onChange={(e) => setNewMonitor({ ...newMonitor, site: e.target.value })}
                  label="Site"
                >
                  <MenuItem value="walmart">Walmart</MenuItem>
                  <MenuItem value="target">Target</MenuItem>
                  <MenuItem value="bestbuy">Best Buy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Check Interval (seconds)"
                type="number"
                value={newMonitor.checkInterval}
                onChange={(e) => setNewMonitor({ ...newMonitor, checkInterval: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max Price ($)"
                type="number"
                value={newMonitor.conditions.maxPrice}
                onChange={(e) => setNewMonitor({
                  ...newMonitor,
                  conditions: { ...newMonitor.conditions, maxPrice: e.target.value }
                })}
                placeholder="50.00"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Keywords (comma separated)"
                value={newMonitor.conditions.keywords}
                onChange={(e) => setNewMonitor({
                  ...newMonitor,
                  conditions: { ...newMonitor.conditions, keywords: e.target.value }
                })}
                placeholder="pokemon, cards, trading"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newMonitor.notifications.discord}
                    onChange={(e) => setNewMonitor({
                      ...newMonitor,
                      notifications: { ...newMonitor.notifications, discord: e.target.checked }
                    })}
                  />
                }
                label="Discord Notifications"
              />
            </Grid>
            {newMonitor.notifications.discord && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Discord Webhook URL"
                  value={newMonitor.notifications.webhook}
                  onChange={(e) => setNewMonitor({
                    ...newMonitor,
                    notifications: { ...newMonitor.notifications, webhook: e.target.value }
                  })}
                  placeholder="https://discord.com/api/webhooks/..."
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={addMonitor}
            variant="contained"
            disabled={!newMonitor.name || !newMonitor.url}
          >
            Add Monitor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Monitor;