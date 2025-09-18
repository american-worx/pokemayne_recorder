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
  LinearProgress,
  Alert,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Visibility,
  ExpandMore,
  VideoCall,
  Mouse,
  NetworkCheck,
  Security,
  Speed,
  Download,
  Delete,
  Folder
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import JsonView from '@uiw/react-json-view';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const Recorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState('https://www.walmart.com/ip/pokemon-trading-cards/');
  const [sessionId, setSessionId] = useState('');
  const [recordingSessions, setRecordingSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [realTimeData, setRealTimeData] = useState({
    actions: [],
    networkRequests: [],
    captchas: [],
    performance: []
  });

  useEffect(() => {
    loadRecordingSessions();
  }, []);

  const loadRecordingSessions = async () => {
    try {
      const sessions = await apiService.getRecordingSessions();
      setRecordingSessions(sessions);
    } catch (error) {
      console.error('Failed to load recording sessions:', error);
    }
  };

  const startRecording = async () => {
    if (!recordingUrl) {
      toast.error('Please enter a URL to record');
      return;
    }

    try {
      const response = await apiService.startRecording({
        url: recordingUrl,
        sessionId: sessionId || undefined
      });

      setCurrentSession(response.session);
      setIsRecording(true);
      setRealTimeData({ actions: [], networkRequests: [], captchas: [], performance: [] });

      toast.success('🎬 Recording started! Interact with the page normally.');

      // Start real-time updates
      const interval = setInterval(async () => {
        if (response.session.id) {
          const data = await apiService.getRecordingData(response.session.id);
          setRealTimeData(data);
        }
      }, 2000);

      setCurrentSession(prev => ({ ...prev, interval }));

    } catch (error) {
      toast.error(`Failed to start recording: ${error.message}`);
    }
  };

  const stopRecording = async () => {
    if (!currentSession) return;

    try {
      if (currentSession.interval) {
        clearInterval(currentSession.interval);
      }

      const result = await apiService.stopRecording(currentSession.id);
      setIsRecording(false);
      setCurrentSession(null);

      toast.success(`🎉 Recording saved! Duration: ${Math.round(result.duration / 1000)}s`);

      // Refresh sessions list
      loadRecordingSessions();

    } catch (error) {
      toast.error(`Failed to stop recording: ${error.message}`);
    }
  };

  const viewSession = (session) => {
    setSelectedSession(session);
    setSessionDialogOpen(true);
  };

  const deleteSession = async (sessionId) => {
    try {
      await apiService.deleteRecordingSession(sessionId);
      toast.success('Session deleted');
      loadRecordingSessions();
    } catch (error) {
      toast.error('Failed to delete session');
    }
  };

  const downloadSession = async (sessionId) => {
    try {
      const blob = await apiService.downloadRecordingSession(sessionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording_${sessionId}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Session downloaded');
    } catch (error) {
      toast.error('Failed to download session');
    }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            🎬 Stealthy Recorder
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.400', mb: 3 }}>
            Record complete user sessions with advanced anti-detection
          </Typography>
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        {/* Recording Control Panel */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                  <VideoCall sx={{ mr: 1, color: 'primary.main' }} />
                  Recording Control
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Target URL"
                    value={recordingUrl}
                    onChange={(e) => setRecordingUrl(e.target.value)}
                    placeholder="https://www.walmart.com/ip/pokemon-cards/"
                    disabled={isRecording}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Session ID (optional)"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    placeholder="pokemon_walmart_session"
                    disabled={isRecording}
                    helperText="Leave empty for auto-generated ID"
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  {!isRecording ? (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<PlayArrow />}
                      onClick={startRecording}
                      sx={{
                        background: 'linear-gradient(135deg, #00e676 0%, #00c853 100%)',
                        color: 'black',
                        fontWeight: 600,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #00c853 0%, #00a843 100%)'
                        }
                      }}
                    >
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<Stop />}
                      onClick={stopRecording}
                      sx={{
                        background: 'linear-gradient(135deg, #ff5252 0%, #c62828 100%)',
                        fontWeight: 600
                      }}
                    >
                      Stop Recording
                    </Button>
                  )}
                </Box>

                {isRecording && currentSession && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.5 }}
                  >
                    <Alert
                      severity="info"
                      sx={{
                        mb: 3,
                        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(21, 101, 192, 0.1) 100%)',
                        border: '1px solid rgba(33, 150, 243, 0.3)'
                      }}
                    >
                      Recording in progress: {currentSession.id}
                    </Alert>

                    <LinearProgress
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: 3
                        }
                      }}
                    />
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Real-time Stats */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Real-time Stats
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Mouse sx={{ fontSize: 20, color: 'primary.main', mr: 1 }} />
                      <Typography variant="body2">Actions</Typography>
                    </Box>
                    <Chip
                      label={realTimeData.actions.length}
                      size="small"
                      sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <NetworkCheck sx={{ fontSize: 20, color: 'info.main', mr: 1 }} />
                      <Typography variant="body2">Network</Typography>
                    </Box>
                    <Chip
                      label={realTimeData.networkRequests.length}
                      size="small"
                      sx={{ bgcolor: 'info.main', color: 'white', fontWeight: 600 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Security sx={{ fontSize: 20, color: 'warning.main', mr: 1 }} />
                      <Typography variant="body2">CAPTCHAs</Typography>
                    </Box>
                    <Chip
                      label={realTimeData.captchas.length}
                      size="small"
                      sx={{ bgcolor: 'warning.main', color: 'black', fontWeight: 600 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Speed sx={{ fontSize: 20, color: 'success.main', mr: 1 }} />
                      <Typography variant="body2">Performance</Typography>
                    </Box>
                    <Chip
                      label={`${Math.round(Math.random() * 100)}ms`}
                      size="small"
                      sx={{ bgcolor: 'success.main', color: 'black', fontWeight: 600 }}
                    />
                  </Box>
                </Box>

                {/* Performance Chart */}
                {realTimeData.performance.length > 0 && (
                  <Box sx={{ mt: 3, height: 200 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      Response Times
                    </Typography>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={realTimeData.performance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="timestamp" stroke="#666" />
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
                          dataKey="responseTime"
                          stroke="#667eea"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Previous Sessions */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                  <Folder sx={{ mr: 1, color: 'secondary.main' }} />
                  Recording Sessions ({recordingSessions.length})
                </Typography>

                {recordingSessions.length === 0 ? (
                  <Alert severity="info">
                    No recording sessions yet. Start your first recording above!
                  </Alert>
                ) : (
                  <List>
                    <AnimatePresence>
                      {recordingSessions.map((session, index) => (
                        <motion.div
                          key={session.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <ListItem
                            sx={{
                              mb: 1,
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
                              <VideoCall sx={{ color: 'primary.main' }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={session.id}
                              secondary={
                                <Box>
                                  <Typography variant="caption" sx={{ display: 'block' }}>
                                    URL: {session.url}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'grey.500' }}>
                                    {new Date(session.timestamp).toLocaleString()} •
                                    Duration: {Math.round(session.duration / 1000)}s •
                                    Actions: {session.stats?.actions || 0}
                                  </Typography>
                                </Box>
                              }
                            />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => viewSession(session)}
                                sx={{ color: 'primary.main' }}
                              >
                                <Visibility />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => downloadSession(session.id)}
                                sx={{ color: 'success.main' }}
                              >
                                <Download />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => deleteSession(session.id)}
                                sx={{ color: 'error.main' }}
                              >
                                <Delete />
                              </IconButton>
                            </Box>
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
      </Grid>

      {/* Session Details Dialog */}
      <Dialog
        open={sessionDialogOpen}
        onClose={() => setSessionDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(145deg, #1e1e1e 0%, #2a2a2a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <DialogTitle>
          Session Details: {selectedSession?.id}
        </DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box sx={{ mt: 2 }}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>Actions ({selectedSession.stats?.actions || 0})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <JsonView
                    value={selectedSession.actions || []}
                    style={{
                      backgroundColor: 'transparent',
                      '--w-rjv-font-family': 'monospace',
                      '--w-rjv-color': '#f8f8f2'
                    }}
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>Network Requests ({selectedSession.stats?.requests || 0})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <JsonView
                    value={selectedSession.network || []}
                    style={{
                      backgroundColor: 'transparent',
                      '--w-rjv-font-family': 'monospace',
                      '--w-rjv-color': '#f8f8f2'
                    }}
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>Security Events</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <JsonView
                    value={selectedSession.security || {}}
                    style={{
                      backgroundColor: 'transparent',
                      '--w-rjv-font-family': 'monospace',
                      '--w-rjv-color': '#f8f8f2'
                    }}
                  />
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Recorder;