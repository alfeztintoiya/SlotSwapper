import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useAuth } from '../state/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await login(email, password)
    navigate('/')
  }

  return (
    <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '70vh' }}>
      <Card sx={{ maxWidth: 420, width: '100%', p: 1 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Welcome back
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth required />
            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth required />
            <Button type="submit" variant="contained" size="large">Login</Button>
            <Typography variant="body2">Don't have an account? <Link to="/signup">Sign up</Link></Typography>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  )
}
