import { Button, Card, CardActions, CardContent, Chip, Grid, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { http } from '../lib/http'
import { SWAP_STATUS } from '../types'
import { io, Socket } from 'socket.io-client'

interface SwapRequest {
  _id: string
  requester: { _id: string; name: string } | string
  responder: { _id: string; name: string } | string
  mySlot: any
  theirSlot: any
  status: keyof typeof SWAP_STATUS
}

let socket: Socket | null = null

export default function Requests() {
  const [incoming, setIncoming] = useState<SwapRequest[]>([])
  const [outgoing, setOutgoing] = useState<SwapRequest[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
  const { data } = await http.get('/requests')
    setIncoming(data.incoming)
    setOutgoing(data.outgoing)
  }

  useEffect(() => {
    load()
    if (!socket) {
      socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:4000', { withCredentials: true })
      socket.on('swap:request', () => load())
      socket.on('swap:update', () => load())
    }
    return () => {
      socket?.off('swap:request')
      socket?.off('swap:update')
    }
  }, [])

  async function respond(id: string, accept: boolean) {
    if (busy) return
    setBusy(id)
    try {
      await http.post(`/swap-response/${id}`, { accept })
      await load()
    } finally {
      setBusy(null)
    }
  }

  return (
    <Stack gap={3}>
      <Typography variant="h5" fontWeight={700}>Requests</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Incoming</Typography>
          <Stack gap={2}>
            {incoming.map((r) => (
              <Card key={r._id}>
                <CardContent>
                  <Typography fontWeight={700}>Offer: {r.mySlot?.title}</Typography>
                  <Typography variant="body2" color="text.secondary">For: {r.theirSlot?.title}</Typography>
                </CardContent>
                <CardActions>
                  {r.status === 'PENDING' ? (
                    <>
                      <Button disabled={busy === r._id} onClick={() => respond(r._id, true)} variant="contained">Accept</Button>
                      <Button disabled={busy === r._id} onClick={() => respond(r._id, false)}>Reject</Button>
                    </>
                  ) : (
                    <Chip label={r.status} color={r.status === 'ACCEPTED' ? 'success' : 'default'} />
                  )}
                </CardActions>
              </Card>
            ))}
          </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Outgoing</Typography>
          <Stack gap={2}>
            {outgoing.map((r) => (
              <Card key={r._id}>
                <CardContent>
                  <Typography fontWeight={700}>You offered: {r.mySlot?.title}</Typography>
                  <Typography variant="body2" color="text.secondary">For: {r.theirSlot?.title}</Typography>
                  <Typography>Status: {r.status}</Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  )
}
