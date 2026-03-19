import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Socket } from 'socket.io-client';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Snackbar, Alert, Backdrop } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import LockClockIcon from '@mui/icons-material/LockClock';

export default function ExamProctoringClient({ 
  socket, 
  roomId, 
  userId, 
  examActive, 
  settings, 
  onTimeUp 
}: { 
  socket: Socket | null, 
  roomId: string, 
  userId: string, 
  examActive: boolean, 
  settings: any, 
  onTimeUp: () => void 
}) {
  const [consentGiven, setConsentGiven] = useState(false);
  const [tabWarning, setTabWarning] = useState(false);
  const [examEnded, setExamEnded] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  const tabSwitches = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Tab Tracking
  useEffect(() => {
    if (!examActive || !settings?.tabAlert) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitches.current += 1;
        setTabWarning(true);
        setTimeout(() => setTabWarning(false), 5000);
        socket?.emit('tab_switch', {
          roomId,
          userId,
          timestamp: Date.now(),
          count: tabSwitches.current
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [examActive, settings, roomId, userId, socket]);

  // Socket listeners for timer
  useEffect(() => {
    if (!socket || !examActive) return;

    const handleWarning = ({ message }: { message: string }) => {
      setToastMsg(message);
      setTimeout(() => setToastMsg(null), 5000);
    };

    const handleEnd = () => {
      setExamEnded(true);
      if (settings?.lockOnExpiry) onTimeUp();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };

    socket.on('timer_warning', handleWarning);
    socket.on('exam_ended', handleEnd);

    return () => {
      socket.off('timer_warning', handleWarning);
      socket.off('exam_ended', handleEnd);
    };
  }, [socket, examActive, settings, onTimeUp]);

  // Screen Recording
  useEffect(() => {
    if (!examActive || !settings?.screenRecord || !consentGiven) return;

    let chunkIndex = 0;

    const startRecording = async () => {
      try {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          alert("Screen recording is not supported in this browser. Use Chrome or Edge.");
          return;
        }

        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { frameRate: { ideal: 10 } }, 
          audio: false 
        });
        streamRef.current = stream;

        stream.getVideoTracks()[0].onended = () => {
          if (!examEnded) {
            socket?.emit('recording_stopped', { roomId, userId });
          }
        };

        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = async (e) => {
          if (e.data.size > 0) {
            const formData = new FormData();
            formData.append('chunk', e.data);
            formData.append('roomId', roomId);
            formData.append('userId', userId);
            formData.append('chunkIndex', chunkIndex.toString());
            
            chunkIndex++;
            axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/exam/upload-chunk`, formData, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            }).catch(() => {});
          }
        };

        recorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          socket?.emit('recording_complete', { roomId, userId });
        };

        recorder.start(5000); // 5 sec chunks
      } catch (err) {
        console.error('Failed to start recording', err);
        socket?.emit('recording_stopped', { roomId, userId });
      }
    };

    startRecording();

    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [examActive, settings, consentGiven, roomId, userId, socket, examEnded]);

  if (!examActive) return null;

  return (
    <>
      <Dialog 
        open={settings?.screenRecord && !consentGiven && !examEnded} 
        PaperProps={{ sx: { minWidth: 350, textAlign: 'center', p: 2, borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'warning.light', color: 'warning.dark', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
            <VideocamIcon fontSize="large" />
          </Box>
          <Typography variant="h6" fontWeight="bold">Screen Recording Required</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This exam session requires screen recording. Click Allow to share your screen and continue, or Decline to exit.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={() => window.location.reload()}>Decline & Exit</Button>
          <Button variant="contained" color="primary" onClick={() => setConsentGiven(true)}>Allow & Continue</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={tabWarning} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} sx={{ mt: 2 }}>
        <Alert severity="error" variant="filled" sx={{ boxShadow: 4, fontWeight: 'bold' }}>
          Warning: Leaving this tab has been recorded.
        </Alert>
      </Snackbar>

      <Snackbar open={!!toastMsg} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="warning" variant="filled" sx={{ boxShadow: 4, fontWeight: 'bold' }}>
          {toastMsg}
        </Alert>
      </Snackbar>

      <Backdrop open={examEnded} sx={{ zIndex: 9999, color: '#fff', flexDirection: 'column', backdropFilter: 'blur(8px)' }}>
        <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, boxShadow: '0 0 40px rgba(76, 175, 80, 0.4)' }}>
          <LockClockIcon sx={{ fontSize: 40 }} />
        </Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Time's Up</Typography>
        <Typography variant="h6" color="rgba(255,255,255,0.7)">Your exam session has been submitted.</Typography>
      </Backdrop>
    </>
  );
}
