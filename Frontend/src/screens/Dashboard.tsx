import { Add, Autorenew, EventBusy } from '@mui/icons-material'
import { Box, Button, Card, CardActions, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, Stack, TextField, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { http } from '../lib/http'
import { STATUS } from '../types'

type Event = {
  _id: string
  title: string
  startTime: string
  endTime: string
  status: keyof typeof STATUS
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', startTime: '', endTime: '' })

  async function fetchEvents() {
  const res = await http.get('/events')
    setEvents(res.data)
  }

  useEffect(() => { fetchEvents() }, [])

  async function save() {
  await http.post('/events', form)
    setOpen(false)
    setForm({ title: '', startTime: '', endTime: '' })
    fetchEvents()
  }

  async function setStatus(id: string, status: keyof typeof STATUS) {
  await http.patch(`/events/${id}/status`, { status })
    fetchEvents()
  }

  return (
    <Stack gap={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={700}>Your Events</Typography>
        <Button startIcon={<Add />} variant="contained" onClick={() => setOpen(true)}>New Event</Button>
      </Box>
      <Grid container spacing={2}>
        {events.map((e) => (
          <Grid key={e._id} item xs={12} md={6} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700}>{e.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {dayjs(e.startTime).format('MMM D, HH:mm')} - {dayjs(e.endTime).format('HH:mm')}
                </Typography>
                <Chip label={String(e.status)} size="small" sx={{ mt: 1 }} color={e.status === 'SWAPPABLE' ? 'success' as any : e.status === 'SWAP_PENDING' ? 'warning' as any : 'default'} />
              </CardContent>
              <CardActions>
                {e.status === 'BUSY' && (
                  <Button onClick={() => setStatus(e._id, 'SWAPPABLE')}>Make Swappable</Button>
                )}
                {e.status === 'SWAPPABLE' && (
                  <Button onClick={() => setStatus(e._id, 'BUSY')}>Set Busy</Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Event</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextField label="Start Time" type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField label="End Time" type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
