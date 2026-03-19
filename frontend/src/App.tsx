import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import EditorWorkspace from './components/EditorWorkspace';
import type { EditorRef } from './components/EditorWorkspace';
import TerminalPanel from './components/TerminalPanel';
import type { TerminalRef } from './components/TerminalPanel';
import AIChatSidebar from './components/AIChatSidebar';
import VersionHistorySidebar from './components/VersionHistorySidebar';
import AuthPage from './pages/AuthPage';
import { io, Socket } from 'socket.io-client';
import ExamSetupPanel from './components/ExamSetupPanel';
import ExamProctoringClient from './components/ExamProctoringClient';
import { useThemeContext } from './context/ThemeContext';

import { 
  Box, Typography, Button, TextField, IconButton, AppBar, Toolbar, 
  Stack, Select, MenuItem, Badge, Snackbar, Alert, Checkbox, FormControlLabel, Fade, Zoom 
} from '@mui/material';

import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import CodeIcon from '@mui/icons-material/Code';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';

export default function App() {
  const { mode, toggleMode } = useThemeContext();
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [roomId, setRoomId] = useState('Workspace1');
  const [joined, setJoined] = useState(false);
  
  const [language, setLanguage] = useState('javascript');
  const [showAi, setShowAi] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [interviewMode, setInterviewMode] = useState(false); 
  const [showExamSetup, setShowExamSetup] = useState(false);

  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [toast, setToast] = useState<{message: string; timestamp: number} | null>(null);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [examActive, setExamActive] = useState(false);
  const [examSettings, setExamSettings] = useState<any>(null);
  // removed examEndsAt
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [proctorAlerts, setProctorAlerts] = useState<any[]>([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);

  const editorRef = useRef<EditorRef>(null) as any;
  const terminalRef = useRef<TerminalRef>(null) as any;

  useEffect(() => {
    if (!joined || !username) return;
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('join_room', { 
      roomId, userId: username, role: interviewMode ? 'INTERVIEWER' : 'VIEWER' 
    });

    newSocket.on('exam_started', ({ settings }) => {
      setExamActive(true);
      setExamSettings(settings);
      setProctorAlerts([]);
      setTabSwitchCount(0);
      setRecordingUrl(null);
    });

    newSocket.on('exam_ended', () => {
      setExamActive(false);
      setTimerRemaining(0);
      if (interviewMode) {
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/exam/recording/${roomId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => setRecordingUrl(res.data.s3Url)).catch(() => {});
      } else {
        editorRef.current?.lock();
      }
    });

    if (interviewMode) {
      newSocket.on('proctor_alert', (alert) => {
        setProctorAlerts(prev => [...prev, alert]);
        if (alert.type === 'TAB_SWITCH') {
          setTabSwitchCount(prev => prev + 1);
        }
      });
    }

    newSocket.on('timer_tick', ({ remainingMs }) => {
      setTimerRemaining(remainingMs);
    });

    return () => { newSocket.disconnect(); };
  }, [joined, roomId, username, interviewMode]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!joined) return;
    const autoSaveInterval = setInterval(async () => {
      const code = editorRef.current?.getCode();
      if (code && code.trim() !== '') {
        try {
          await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rooms/${roomId}/snapshots`, { content: code });
          terminalRef.current?.write('\x1b[90m> Saved snapshot to history vault.\x1b[0m\r\n');
        } catch (e) {}
      }
    }, 60000);
    return () => clearInterval(autoSaveInterval);
  }, [joined, roomId]);

  const handleAuthSuccess = (newToken: string, newUsername: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', newUsername);
    setToken(newToken);
    setUsername(newUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
    setJoined(false);
  };

  const handleRunCode = async () => {
    const code = editorRef.current?.getCode();
    if (!code) return;
    terminalRef.current?.clear();
    terminalRef.current?.write('\x1b[36mBuilding target...\x1b[0m\r\n');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/execute`, { language, sourceCode: code });
      const output = res.data?.run?.output || '';
      terminalRef.current?.write(output.replace(/\n/g, '\r\n') + '\r\n');
    } catch (err: any) {
      terminalRef.current?.write('\x1b[31mError: ' + (err.response?.data?.error || err.message) + '\x1b[0m\r\n');
    }
  };

  if (!token || !username) return <AuthPage onSuccess={handleAuthSuccess} />;

  if (!joined) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: '15vh', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
        <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={toggleMode} color="inherit">
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <Typography variant="body2" color="text.secondary" fontWeight="medium">{username}</Typography>
          <Box sx={{ width: '1px', height: 12, bgcolor: 'divider' }} />
          <Button size="small" color="error" onClick={handleLogout} sx={{ fontSize: '12px', fontWeight: 'bold' }}>Logout</Button>
        </Box>

        <Zoom in={true} timeout={500}>
          <Box sx={{ width: '100%', maxWidth: 400, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 6, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            
            <Box sx={{ height: 40, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', px: 2, justifyContent: 'space-between', bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
              <Box sx={{ width: 64 }} />
              <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ userSelect: 'none', letterSpacing: 0.5 }}>Target Selection</Typography>
              <Box sx={{ width: 64 }} />
            </Box>

            <Box sx={{ p: 4, pb: 5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Box sx={{ width: 80, height: 80, background: 'linear-gradient(135deg, #1A82E3 0%, #1262AF 100%)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 3 }}>
                  <CodeIcon sx={{ fontSize: 40, color: 'white' }} />
                </Box>
              </Box>
              
              <Typography variant="h6" align="center" fontWeight="600" gutterBottom sx={{ letterSpacing: '-0.02em' }}>Open Project Workspace</Typography>
              
              <Stack spacing={2.5} sx={{ mt: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="medium" display="block" gutterBottom>Workspace Target</Typography>
                  <TextField fullWidth size="small" variant="outlined" placeholder="e.g. Workspace1" value={roomId} onChange={(e) => setRoomId(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { bgcolor: mode === 'dark' ? '#18191C' : '#FFFFFF' } }} />
                </Box>
                
                <Button variant="contained" fullWidth onClick={() => setJoined(true)} sx={{ background: 'linear-gradient(180deg, #1A82E3 0%, #1262AF 100%)', textTransform: 'none', fontSize: '14px', py: 1, fontWeight: 'bold' }}>
                  Open Main Target
                </Button>
              </Stack>
            </Box>
          </Box>
        </Zoom>
      </Box>
    );
  }

  const displayUsername = interviewMode ? 'Candidate' : username;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', bgcolor: 'background.default', color: 'text.primary', overflow: 'hidden' }}>
      
      {/* Top Navbar */}
      <AppBar position="static" elevation={0} sx={{ height: 50, justifyContent: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar variant="dense" sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1.2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: mode === 'dark' ? '#1A1A1A' : '#F0F2F5', border: 1, borderColor: 'divider', borderRadius: 1, p: 0.5 }}>
              <Button size="small" startIcon={<PeopleIcon sx={{ fontSize: 16 }}/>} variant={showParticipants ? 'contained' : 'text'} onClick={() => { setShowParticipants(!showParticipants); setShowVersions(false); setShowAi(false); }} sx={{ minWidth: 0, px: 1.5, py: 0.5, fontSize: '11px', color: showParticipants ? 'white' : 'text.secondary' }}>Participants</Button>
              <Box sx={{ width: '1px', height: 16, bgcolor: 'divider', mx: 0.5 }} />
              <Button size="small" startIcon={<HistoryIcon sx={{ fontSize: 16 }}/>} variant={showVersions ? 'contained' : 'text'} onClick={() => { setShowVersions(!showVersions); setShowParticipants(false); setShowAi(false); }} sx={{ minWidth: 0, px: 1.5, py: 0.5, fontSize: '11px', color: showVersions ? 'white' : 'text.secondary' }}>History</Button>
              <Box sx={{ width: '1px', height: 16, bgcolor: 'divider', mx: 0.5 }} />
              <Button size="small" startIcon={<AutoAwesomeIcon sx={{ fontSize: 16 }}/>} variant={showAi ? 'contained' : 'text'} onClick={() => { setShowAi(!showAi); setShowVersions(false); setShowParticipants(false); }} sx={{ minWidth: 0, px: 1.5, py: 0.5, fontSize: '11px', color: showAi ? 'white' : 'text.secondary', bgcolor: showAi ? '#8B5CF6' : 'transparent', '&:hover': { bgcolor: showAi ? '#7C3AED' : undefined } }}>Inspector</Button>
            </Box>
          </Stack>

          <Stack alignItems="center" sx={{ flex: 1.5 }}>
            <Typography variant="body2" fontWeight="600" color="text.primary">{roomId} — Target</Typography>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">{displayUsername} | Connected</Typography>
            </Stack>
          </Stack>
          
          <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1.2, justifyContent: 'flex-end' }}>
            <IconButton onClick={toggleMode} color="inherit" size="small" sx={{ mr: 1 }}>
              {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>

            {(examActive || timerRemaining !== null) && (
               <Typography variant="button" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: timerRemaining && timerRemaining < 60000 ? '#FF5F56' : timerRemaining && timerRemaining < 300000 ? '#FFBD2E' : 'text.primary', animation: timerRemaining && timerRemaining < 60000 ? 'pulse 1s infinite' : 'none' }}>
                 {timerRemaining !== null && timerRemaining > 0 ? `${Math.floor(timerRemaining / 60000).toString().padStart(2, '0')}:${Math.floor((timerRemaining % 60000) / 1000).toString().padStart(2, '0')}` : '00:00'}
               </Typography>
            )}

            {!examActive && interviewMode && (
              <Button size="small" variant="outlined" color="success" onClick={() => setShowExamSetup(true)} sx={{ fontSize: '11px', px: 1.5, py: 0.5 }}>Setup Exam</Button>
            )}

            {recordingUrl && interviewMode && (
              <Button size="small" variant="outlined" color="primary" href={recordingUrl} target="_blank" sx={{ fontSize: '11px', px: 1.5, py: 0.5 }}>Watch Recording</Button>
            )}
            
            <FormControlLabel 
              control={<Checkbox disabled={examActive} checked={interviewMode} onChange={(e) => setInterviewMode(e.target.checked)} size="small" sx={{ color: 'text.secondary' }} />} 
              label={<Typography variant="caption" fontWeight="medium" color="text.secondary">Proctor</Typography>} 
              sx={{ m: 0 }}
            />
            
            <Select 
              value={language} 
              onChange={e => setLanguage(e.target.value)}
              size="small"
              sx={{ height: 32, fontSize: '12px', bgcolor: 'background.paper', '& fieldset': { borderColor: 'divider' } }}
            >
              <MenuItem value="javascript" sx={{ fontSize: '12px' }}>JavaScript</MenuItem>
              <MenuItem value="python" sx={{ fontSize: '12px' }}>Python</MenuItem>
              <MenuItem value="java" sx={{ fontSize: '12px' }}>Java</MenuItem>
            </Select>

            <Button variant="contained" startIcon={<PlayArrowIcon />} size="small" onClick={handleRunCode} sx={{ background: 'linear-gradient(180deg, #1A82E3 0%, #1262AF 100%)', boxShadow: 1 }}>
              Build
            </Button>
            
            <Box sx={{ width: '1px', height: 20, bgcolor: 'divider' }} />
            
            <IconButton size="small" onClick={() => setJoined(false)} color="error">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {showParticipants && (
          <Box sx={{ width: 280, flexShrink: 0, height: '100%', borderRight: 1, borderColor: 'divider', bgcolor: 'background.paper', zIndex: 10, p: 2, overflowY: 'auto' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5 }}>Workspace Participants</Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 1, bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#27C93F', boxShadow: 1 }} />
                <Typography variant="body2" fontWeight="500">{displayUsername} (You)</Typography>
              </Box>
              {activeUsers.map(user => (
                <Box key={user.clientId} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: user.color, boxShadow: 1 }} />
                  <Typography variant="body2" sx={{ maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</Typography>
                  {user.isTyping && <Typography variant="caption" color="primary" sx={{ fontStyle: 'italic', ml: 'auto', animation: 'pulse 1.5s infinite' }}>typing...</Typography>}
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {showVersions && (
          <Box sx={{ width: 280, flexShrink: 0, height: '100%', borderRight: 1, borderColor: 'divider', bgcolor: 'background.paper', zIndex: 10 }}>
            <VersionHistorySidebar roomId={roomId} onRestore={(content) => editorRef.current?.setCode(content)} />
          </Box>
        )}

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ flex: 3, position: 'relative', bgcolor: mode === 'dark' ? '#111111' : '#FFFFFF' }}>
            <EditorWorkspace
              ref={editorRef}
              roomId={roomId}
              username={displayUsername}
              language={language === 'python' ? 'python' : (language === 'java' ? 'java' : 'javascript')}
              onUsersChange={(users) => {
                setActiveUsers(prev => {
                  const prevIds = new Set(prev.map(u => u.clientId));
                  users.forEach(u => {
                    if (!prevIds.has(u.clientId) && u.name !== displayUsername) {
                      setToast({ message: `${u.name} joined the workspace!`, timestamp: Date.now() });
                    }
                  });
                  return users;
                });
              }}
            />
          </Box>
          
          <Box sx={{ flex: 1, minHeight: 160, display: 'flex', flexDirection: 'column', borderTop: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
            <Box sx={{ height: 28, flexShrink: 0, bgcolor: mode === 'dark' ? '#000000' : '#EAECEF', borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', px: 2 }}>
              <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>App Console</Typography>
            </Box>
            <Box sx={{ flex: 1, p: 0.5, bgcolor: mode === 'dark' ? '#121212' : '#FFFFFF' }}>
              <TerminalPanel ref={terminalRef} />
            </Box>
          </Box>
        </Box>
        
        {showAi && (
          <Box sx={{ width: 320, flexShrink: 0, height: '100%', borderLeft: 1, borderColor: 'divider', bgcolor: 'background.paper', zIndex: 10 }}>
            <AIChatSidebar editorRef={editorRef} />
          </Box>
        )}
      </Box>

      {/* Proctoring Interactions */}
      <Snackbar open={interviewMode && tabSwitchCount > 0} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} sx={{ mt: 6 }}>
        <Alert severity="warning" icon={<Badge color="warning" variant="dot" invisible={false} sx={{ mr: 1 }}/>} sx={{ fontWeight: 'bold', boxShadow: 6, bgcolor: 'background.paper' }}>
          CANDIDATE FLAGGED: {tabSwitchCount} Tab Switches
        </Alert>
      </Snackbar>

      <Stack spacing={2} sx={{ position: 'fixed', top: 80, right: 24, zIndex: 9999 }}>
        {interviewMode && proctorAlerts.map((alert, i) => (
          <Fade in key={`${alert.timestamp}-${i}`}>
            <Alert severity="error" sx={{ minWidth: 280, boxShadow: 6, bgcolor: 'background.paper' }}>
              <Typography variant="caption" fontWeight="bold" display="block" sx={{ opacity: 0.7 }}>{new Date(alert.timestamp).toLocaleTimeString()}</Typography>
              {alert.message}
            </Alert>
          </Fade>
        ))}
      </Stack>

      {showExamSetup && (
        <ExamSetupPanel 
          onCancel={() => setShowExamSetup(false)} 
          onStart={(settings) => {
            socket?.emit('start_exam', { roomId, ...settings });
            setShowExamSetup(false);
          }} 
        />
      )}

      {!interviewMode && (
        <ExamProctoringClient 
          socket={socket} roomId={roomId} userId={username as string} examActive={examActive}
          settings={examSettings} onTimeUp={() => editorRef.current?.lock?.()}
        />
      )}

      <Snackbar open={!!toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="info" sx={{ boxShadow: 6, bgcolor: 'background.paper' }}>{toast?.message}</Alert>
      </Snackbar>

    </Box>
  );
}
