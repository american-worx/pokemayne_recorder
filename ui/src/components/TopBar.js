import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Button,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Wifi,
  WifiOff,
  Speed,
  TrendingUp,
  Error
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const TopBar = ({ onMenuClick, connectionStatus, stats }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsEl, setNotificationsEl] = useState(null);

  const handleProfileMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenu = (event) => {
    setNotificationsEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setNotificationsEl(null);
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi sx={{ color: '#00e676', fontSize: 18 }} />;
      case 'connecting':
        return <Speed sx={{ color: '#ffc107', fontSize: 18 }} />;
      default:
        return <WifiOff sx={{ color: '#ff5252', fontSize: 18 }} />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      default:
        return 'Disconnected';
    }
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#00e676';
      case 'connecting':
        return '#ffc107';
      default:
        return '#ff5252';
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1201
      }}
    >
      <Toolbar sx={{ minHeight: 64 }}>
        <IconButton
          edge="start"
          color="inherit"
          onClick={onMenuClick}
          sx={{
            mr: 2,
            '&:hover': {
              background: 'rgba(102, 126, 234, 0.1)'
            }
          }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Pokemayne Command Center
        </Typography>

        {/* Quick Stats */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 3, gap: 2 }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Tooltip title="Active Recordings">
              <Chip
                icon={<TrendingUp sx={{ fontSize: 16 }} />}
                label={`${stats.activeRecordings} Recording${stats.activeRecordings !== 1 ? 's' : ''}`}
                size="small"
                sx={{
                  bgcolor: stats.activeRecordings > 0 ? 'rgba(255, 87, 34, 0.2)' : 'rgba(117, 117, 117, 0.2)',
                  color: stats.activeRecordings > 0 ? '#ff5722' : '#757575',
                  border: `1px solid ${stats.activeRecordings > 0 ? '#ff5722' : '#757575'}30`,
                  fontWeight: 500
                }}
              />
            </Tooltip>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Tooltip title="Active Monitors">
              <Chip
                icon={<Speed sx={{ fontSize: 16 }} />}
                label={`${stats.activeMonitors} Monitor${stats.activeMonitors !== 1 ? 's' : ''}`}
                size="small"
                sx={{
                  bgcolor: stats.activeMonitors > 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(117, 117, 117, 0.2)',
                  color: stats.activeMonitors > 0 ? '#4caf50' : '#757575',
                  border: `1px solid ${stats.activeMonitors > 0 ? '#4caf50' : '#757575'}30`,
                  fontWeight: 500
                }}
              />
            </Tooltip>
          </motion.div>
        </Box>

        {/* Connection Status */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Tooltip title={`WebSocket ${getConnectionText()}`}>
            <Button
              startIcon={getConnectionIcon()}
              size="small"
              sx={{
                mr: 2,
                color: getConnectionColor(),
                border: `1px solid ${getConnectionColor()}30`,
                bgcolor: `${getConnectionColor()}10`,
                '&:hover': {
                  bgcolor: `${getConnectionColor()}20`,
                  border: `1px solid ${getConnectionColor()}50`
                },
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.8rem'
              }}
            >
              {getConnectionText()}
            </Button>
          </Tooltip>
        </motion.div>

        {/* Notifications */}
        <IconButton
          color="inherit"
          onClick={handleNotificationsMenu}
          sx={{
            mr: 1,
            '&:hover': {
              background: 'rgba(102, 126, 234, 0.1)'
            }
          }}
        >
          <Badge badgeContent={4} color="error">
            <Notifications />
          </Badge>
        </IconButton>

        {/* Profile */}
        <IconButton
          onClick={handleProfileMenu}
          sx={{
            '&:hover': {
              background: 'rgba(102, 126, 234, 0.1)'
            }
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              fontSize: '0.9rem'
            }}
          >
            P
          </Avatar>
        </IconButton>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right'
          }}
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #2a2a2a 0%, #1e1e1e 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              minWidth: 200
            }
          }}
        >
          <MenuItem onClick={handleClose}>
            <AccountCircle sx={{ mr: 2 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={handleClose}>
            <Error sx={{ mr: 2 }} />
            Logout
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationsEl}
          open={Boolean(notificationsEl)}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right'
          }}
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #2a2a2a 0%, #1e1e1e 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              minWidth: 300,
              maxHeight: 400
            }
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Notifications
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.400', mb: 2 }}>
              Recent activity and alerts
            </Typography>

            {[
              { text: 'Pokemon cards now in stock!', time: '2 min ago', type: 'success' },
              { text: 'Recording session completed', time: '5 min ago', type: 'info' },
              { text: 'CAPTCHA detected in automation', time: '10 min ago', type: 'warning' },
              { text: 'Monitor #3 encountered error', time: '15 min ago', type: 'error' }
            ].map((notification, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  mb: 1,
                  borderRadius: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {notification.text}
                </Typography>
                <Typography variant="caption" sx={{ color: 'grey.500' }}>
                  {notification.time}
                </Typography>
              </Box>
            ))}
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;