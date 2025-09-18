import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LoadingScreen from './components/LoadingScreen';

// Pages
import Dashboard from './pages/Dashboard';
import Recorder from './pages/Recorder';
import Monitor from './pages/Monitor';
import Automation from './pages/Automation';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';

// Services
import { connectWebSocket } from './services/websocket';
import { apiService } from './services/api';

// Custom theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#667eea',
      light: '#8fa5ff',
      dark: '#4555b7'
    },
    secondary: {
      main: '#764ba2',
      light: '#a478d1',
      dark: '#4a2373'
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a'
    },
    success: {
      main: '#00e676',
      light: '#66ffa6',
      dark: '#00b248'
    },
    error: {
      main: '#ff5252',
      light: '#ff867f',
      dark: '#c50e29'
    },
    warning: {
      main: '#ffc107',
      light: '#fff350',
      dark: '#c79100'
    }
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem'
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem'
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem'
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.25rem'
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.1rem'
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem'
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '8px 16px'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(145deg, #1e1e1e 0%, #2a2a2a 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(145deg, #1e1e1e 0%, #2a2a2a 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }
      }
    }
  }
});

function App() {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [stats, setStats] = useState({
    activeRecordings: 0,
    activeMonitors: 0,
    totalAutomations: 0,
    successRate: 0
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Connect to WebSocket
        const socket = connectWebSocket();

        socket.on('connect', () => {
          setConnectionStatus('connected');
        });

        socket.on('disconnect', () => {
          setConnectionStatus('disconnected');
        });

        socket.on('stats_update', (newStats) => {
          setStats(newStats);
        });

        // Fetch initial data
        const initialStats = await apiService.getStats();
        setStats(initialStats);

        // Simulate loading time for smooth transition
        setTimeout(() => {
          setLoading(false);
        }, 2000);

      } catch (error) {
        console.error('Failed to initialize app:', error);
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                <Sidebar
                  open={sidebarOpen}
                  onClose={() => setSidebarOpen(false)}
                  stats={stats}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <TopBar
              onMenuClick={toggleSidebar}
              connectionStatus={connectionStatus}
              stats={stats}
            />

            <Box
              component="main"
              sx={{
                flexGrow: 1,
                p: 3,
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                minHeight: 'calc(100vh - 64px)'
              }}
            >
              <Routes>
                <Route path="/" element={<Dashboard stats={stats} />} />
                <Route path="/recorder" element={<Recorder />} />
                <Route path="/monitor" element={<Monitor />} />
                <Route path="/automation" element={<Automation />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Box>
          </Box>
        </Box>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2a2a2a',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              fontSize: '14px'
            },
            success: {
              iconTheme: {
                primary: '#00e676',
                secondary: '#fff'
              }
            },
            error: {
              iconTheme: {
                primary: '#ff5252',
                secondary: '#fff'
              }
            }
          }}
        />
      </Router>
    </ThemeProvider>
  );
}

export default App;