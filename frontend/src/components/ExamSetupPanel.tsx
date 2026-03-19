import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Stack, TextField, FormLabel, FormControlLabel, Checkbox, Box } from '@mui/material';

export default function ExamSetupPanel({ onStart, onCancel }: { onStart: (settings: any) => void, onCancel: () => void }) {
  const [duration, setDuration] = useState(60);
  const [tabAlert, setTabAlert] = useState(true);
  const [screenRecord, setScreenRecord] = useState(true);
  const [lockOnExpiry, setLockOnExpiry] = useState(true);
  const [warnAt10, setWarnAt10] = useState(true);

  return (
    <Dialog open={true} onClose={onCancel} PaperProps={{ sx: { minWidth: 400, borderRadius: 3, p: 1 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight="bold">Exam Mode Setup</Typography>
        <Typography variant="caption" color="text.secondary">Configure the proctoring parameters.</Typography>
      </DialogTitle>
      
      <DialogContent sx={{ mt: 1 }}>
        <Stack spacing={3}>
          <Box>
            <FormLabel sx={{ mb: 1, display: 'block', fontSize: '13px' }}>Duration (minutes)</FormLabel>
            <Stack direction="row" spacing={2}>
              <TextField 
                type="number" size="small" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 60)} 
                InputProps={{ inputProps: { min: 1, max: 180 } }} sx={{ width: 100 }}
              />
              <Stack direction="row" spacing={1}>
                {[30, 60, 90].map(m => (
                  <Button key={m} variant={duration === m ? 'contained' : 'outlined'} size="small" onClick={() => setDuration(m)} sx={{ minWidth: 48 }}>{m}m</Button>
                ))}
              </Stack>
            </Stack>
          </Box>

          <Stack spacing={0}>
            <FormControlLabel control={<Checkbox checked={tabAlert} onChange={e => setTabAlert(e.target.checked)} size="small" />} label={<Typography variant="body2">Alert me on tab switch</Typography>} />
            <FormControlLabel control={<Checkbox checked={screenRecord} onChange={e => setScreenRecord(e.target.checked)} size="small" />} label={<Typography variant="body2">Record interviewee screen</Typography>} />
            <FormControlLabel control={<Checkbox checked={lockOnExpiry} onChange={e => setLockOnExpiry(e.target.checked)} size="small" />} label={<Typography variant="body2">Lock editor when time expires</Typography>} />
            <FormControlLabel control={<Checkbox checked={warnAt10} onChange={e => setWarnAt10(e.target.checked)} size="small" />} label={<Typography variant="body2">Warn candidate at 10 minutes remaining</Typography>} />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} color="inherit" sx={{ fontWeight: 'medium' }}>Cancel</Button>
        <Button variant="contained" onClick={() => onStart({ durationMinutes: duration, settings: { tabAlert, screenRecord, lockOnExpiry, warnAt10 } })} sx={{ fontWeight: 'bold' }}>
          Start Session
        </Button>
      </DialogActions>
    </Dialog>
  );
}
