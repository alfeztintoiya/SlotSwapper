import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useAuth } from '../state/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signup } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await signup(name, email, password)
    navigate('/')
  }

  return (
    <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '70vh' }}>
      <Card sx={{ maxWidth: 480, width: '100%', p: 1 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Create your account
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth required />
            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth required />
            <Button type="submit" variant="contained" size="large">Sign up</Button>
            <Typography variant="body2">Already have an account? <Link to="/login">Login</Link></Typography>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  )
}
