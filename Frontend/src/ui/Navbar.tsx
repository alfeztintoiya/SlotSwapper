import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  return (
    <AppBar position="sticky" color="transparent" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', flexGrow: 1 }}>
            SlotSwapper
          </Typography>
          {user ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button component={RouterLink} to="/" color="primary">Dashboard</Button>
              <Button component={RouterLink} to="/marketplace" color="primary">Marketplace</Button>
              <Button component={RouterLink} to="/requests" color="primary">Requests</Button>
              <Button onClick={logout} variant="contained" color="primary">Logout</Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button component={RouterLink} to="/login" color="primary">Login</Button>
              <Button component={RouterLink} to="/signup" variant="contained" color="primary">Sign up</Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  )
}
