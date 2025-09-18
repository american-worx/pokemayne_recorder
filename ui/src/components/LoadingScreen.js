import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
          {/* Logo Animation */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: '4rem',
                mb: 2
              }}
            >
              🎯
            </Typography>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 1
              }}
            >
              Pokemayne Recorder
            </Typography>
          </motion.div>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Typography
              variant="h6"
              sx={{
                color: 'grey.400',
                mb: 4,
                fontWeight: 400
              }}
            >
              Superior E-commerce Automation
            </Typography>
          </motion.div>

          {/* Loading Progress */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'rgba(102, 126, 234, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 2
                  }
                }}
              />
            </Box>
          </motion.div>

          {/* Loading Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: 'grey.500',
                  fontSize: '0.9rem'
                }}
              >
                Initializing stealth systems...
              </Typography>
            </motion.div>
          </motion.div>

          {/* Feature Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            <Box
              sx={{
                mt: 4,
                p: 3,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'grey.300',
                  mb: 2,
                  fontWeight: 500
                }}
              >
                Loading Features:
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  '🎬 Stealthy Recording Engine',
                  '📊 Real-time Inventory Monitor',
                  '🤖 Advanced Automation',
                  '🔒 Military-grade Stealth'
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5 + index * 0.2, duration: 0.5 }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'grey.400',
                        display: 'block',
                        textAlign: 'left',
                        fontSize: '0.8rem'
                      }}
                    >
                      {feature}
                    </Typography>
                  </motion.div>
                ))}
              </Box>
            </Box>
          </motion.div>

          {/* Beta Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2, duration: 0.5, type: 'spring', stiffness: 500 }}
          >
            <Box
              sx={{
                mt: 3,
                display: 'inline-block',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                background: 'linear-gradient(135deg, #00e676 0%, #00c853 100%)',
                color: 'black',
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            >
              v1.0.0 • Better than Stellar AIO
            </Box>
          </motion.div>
        </Box>
      </motion.div>
    </Box>
  );
};

export default LoadingScreen;