import { Box, Button, Card, CardActions, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Select, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { http } from '../lib/http'
import { STATUS } from '../types'

interface Event { _id: string; title: string; startTime: string; endTime: string; status: keyof typeof STATUS; userId: string }

export default function Marketplace() {
  const [slots, setSlots] = useState<Event[]>([])
  const [mySlots, setMySlots] = useState<Event[]>([])
  const [open, setOpen] = useState(false)
  const [targetSlot, setTargetSlot] = useState<Event | null>(null)
  const [offerId, setOfferId] = useState<string>('')

  async function load() {
    const [a, b] = await Promise.all([
      http.get('/swappable-slots'),
      http.get('/events'),
    ])
    setSlots(a.data)
    setMySlots(b.data.filter((e: Event) => e.status === 'SWAPPABLE'))
  }

  useEffect(() => { load() }, [])

  async function requestSwap() {
    if (!targetSlot || !offerId) return
  await http.post('/swap-request', { mySlotId: offerId, theirSlotId: targetSlot._id })
    setOpen(false)
    setOfferId('')
    await load()
  }

  return (
    <Stack gap={2}>
      <Typography variant="h5" fontWeight={700}>Marketplace</Typography>
      <Grid container spacing={2}>
        {slots.map((s) => (
          <Grid key={s._id} item xs={12} md={6} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700}>{s.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {dayjs(s.startTime).format('MMM D, HH:mm')} - {dayjs(s.endTime).format('HH:mm')}
                </Typography>
              </CardContent>
              <CardActions>
                <Button variant="contained" onClick={() => { setTargetSlot(s); setOpen(true) }}>Request Swap</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Offer one of your swappable slots</DialogTitle>
        <DialogContent>
          <Select fullWidth value={offerId} onChange={(e) => setOfferId(String(e.target.value))} displayEmpty sx={{ mt: 1 }}>
            <MenuItem value="" disabled>Select your slot</MenuItem>
            {mySlots.map((m) => (
              <MenuItem key={m._id} value={m._id}>
                {m.title} — {dayjs(m.startTime).format('MMM D, HH:mm')} - {dayjs(m.endTime).format('HH:mm')}
              </MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={requestSwap} variant="contained" disabled={!offerId}>Send Request</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
