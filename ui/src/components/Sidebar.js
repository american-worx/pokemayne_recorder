import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Chip,
  Divider,
  Avatar
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  VideoCall as RecorderIcon,
  Visibility as MonitorIcon,
  PlayArrow as AutomationIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Circle as CircleIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const menuItems = [
  { text: 'Dashboard', icon: DashboardIcon, path: '/', color: '#667eea' },
  { text: 'Recorder', icon: RecorderIcon, path: '/recorder', color: '#ff5722' },
  { text: 'Monitor', icon: MonitorIcon, path: '/monitor', color: '#4caf50' },
  { text: 'Automation', icon: AutomationIcon, path: '/automation', color: '#ff9800' },
  { text: 'Analytics', icon: AnalyticsIcon, path: '/analytics', color: '#9c27b0' },
  { text: 'Settings', icon: SettingsIcon, path: '/settings', color: '#607d8b' }
];

const Sidebar = ({ open, onClose, stats }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const getStatusColor = (count) => {
    if (count > 0) return '#00e676';
    return '#757575';
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #1e1e1e 0%, #0a0a0a 100%)',
          border: 'none',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)'
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 40,
                height: 40,
                mr: 2,
                fontSize: '1.2rem'
              }}
            >
              🎯
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
                Pokemayne
              </Typography>
              <Typography variant="caption" sx={{ color: 'grey.400' }}>
                Superior Automation
              </Typography>
            </Box>
          </Box>
        </motion.div>

        {/* Status Overview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              mb: 3
            }}
          >
            <Typography variant="body2" sx={{ mb: 2, color: 'grey.300' }}>
              Quick Status
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircleIcon
                  sx={{
                    fontSize: 8,
                    color: getStatusColor(stats.activeRecordings),
                    mr: 1
                  }}
                />
                <Typography variant="caption" sx={{ color: 'grey.400' }}>
                  Recording
                </Typography>
              </Box>
              <Chip
                label={stats.activeRecordings}
                size="small"
                sx={{
                  bgcolor: getStatusColor(stats.activeRecordings),
                  color: 'black',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircleIcon
                  sx={{
                    fontSize: 8,
                    color: getStatusColor(stats.activeMonitors),
                    mr: 1
                  }}
                />
                <Typography variant="caption" sx={{ color: 'grey.400' }}>
                  Monitoring
                </Typography>
              </Box>
              <Chip
                label={stats.activeMonitors}
                size="small"
                sx={{
                  bgcolor: getStatusColor(stats.activeMonitors),
                  color: 'black',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircleIcon
                  sx={{
                    fontSize: 8,
                    color: stats.successRate > 80 ? '#00e676' : stats.successRate > 50 ? '#ffc107' : '#ff5252',
                    mr: 1
                  }}
                />
                <Typography variant="caption" sx={{ color: 'grey.400' }}>
                  Success Rate
                </Typography>
              </Box>
              <Chip
                label={`${stats.successRate}%`}
                size="small"
                sx={{
                  bgcolor: stats.successRate > 80 ? '#00e676' : stats.successRate > 50 ? '#ffc107' : '#ff5252',
                  color: 'black',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
            </Box>
          </Box>
        </motion.div>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Navigation Menu */}
      <List sx={{ px: 2 }}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    background: isActive
                      ? `linear-gradient(135deg, ${item.color}20 0%, ${item.color}10 100%)`
                      : 'transparent',
                    border: isActive
                      ? `1px solid ${item.color}30`
                      : '1px solid transparent',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${item.color}15 0%, ${item.color}05 100%)`,
                      border: `1px solid ${item.color}20`
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Icon
                      sx={{
                        color: isActive ? item.color : 'grey.400',
                        fontSize: 22,
                        transition: 'color 0.2s ease-in-out'
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      '& .MuiListItemText-primary': {
                        color: isActive ? 'white' : 'grey.300',
                        fontWeight: isActive ? 600 : 400,
                        fontSize: '0.95rem',
                        transition: 'all 0.2s ease-in-out'
                      }
                    }}
                  />
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: item.color
                        }}
                      />
                    </motion.div>
                  )}
                </ListItemButton>
              </ListItem>
            </motion.div>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ mt: 'auto', p: 2, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'grey.500' }}>
          Pokemayne Recorder v1.0.0
        </Typography>
        <br />
        <Typography variant="caption" sx={{ color: 'grey.600' }}>
          Better than Stellar AIO
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;