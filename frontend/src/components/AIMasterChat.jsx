import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Fade
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { sendTaskToMaster } from '../api/masterAgentApi';

const formatTimestamp = () => {
  const now = new Date();
  return now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

export default function AIMasterChat({ open, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Merhaba! Ben AI Asistanınızım. Size nasıl yardımcı olabilirim? ÜRTM Takip sistemi hakkında sorular sorabilir veya görevler oluşturabilirsiniz.',
      timestamp: formatTimestamp()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputValue.trim(),
      timestamp: formatTimestamp()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendTaskToMaster(inputValue.trim());
      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: response.response || response.result || response.message || 'Yanıt alınamadı.',
        timestamp: formatTimestamp()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: `Hata: ${error.response?.data?.message || error.message || 'Bağlantı hatası oluştu.'}`,
        timestamp: formatTimestamp()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    setInputValue('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          height: isMobile ? '100%' : '70vh',
          maxHeight: isMobile ? '100%' : 600,
          display: 'flex',
          flexDirection: 'column'
        }
      }}
      TransitionComponent={Fade}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        py: 1.5,
        px: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon />
          <Typography variant="h6">AI Asistan</Typography>
        </Box>
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleClose}
          size={isMobile ? 'medium' : 'small'}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          flex: 1,
          overflow: 'auto',
          p: isMobile ? 1.5 : 2,
          bgcolor: '#f5f5f5'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                animation: 'fadeIn 0.2s ease-out'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  gap: 0.75,
                  maxWidth: '85%'
                }}
              >
                {msg.sender === 'ai' && (
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <SmartToyIcon sx={{ fontSize: 16, color: 'white' }} />
                  </Box>
                )}
                <Paper
                  elevation={1}
                  sx={{
                    px: isMobile ? 1.5 : 2,
                    py: 1,
                    bgcolor: msg.sender === 'user' ? 'primary.main' : 'white',
                    color: msg.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                    borderRadius: msg.sender === 'user'
                      ? '12px 12px 4px 12px'
                      : '12px 12px 12px 4px',
                    borderBottomRightRadius: msg.sender === 'user' ? '4px' : '12px',
                    borderBottomLeftRadius: msg.sender === 'user' ? '12px' : '4px'
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  >
                    {msg.text}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      opacity: 0.7,
                      textAlign: msg.sender === 'user' ? 'right' : 'left'
                    }}
                  >
                    {msg.timestamp}
                  </Typography>
                </Paper>
                {msg.sender === 'user' && (
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: 'grey.300',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 16 }} />
                  </Box>
                )}
              </Box>
            </Box>
          ))}
          {isLoading && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <SmartToyIcon sx={{ fontSize: 16, color: 'white' }} />
              </Box>
              <Paper elevation={1} sx={{ px: 2, py: 1, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={14} />
                  <Typography variant="body2" color="text.secondary">
                    Yanıt bekleniyor...
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: isMobile ? 1.5 : 2,
          bgcolor: 'white',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            size={isMobile ? 'medium' : 'small'}
            placeholder="Mesajınızı yazın..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            multiline
            maxRows={isMobile ? 4 : 2}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px'
              }
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            sx={{
              minWidth: isMobile ? 48 : 40,
              height: isMobile ? 48 : 40,
              borderRadius: '50%',
              p: 0
            }}
          >
            <SendIcon />
          </Button>
        </Box>
      </DialogActions>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </Dialog>
  );
}