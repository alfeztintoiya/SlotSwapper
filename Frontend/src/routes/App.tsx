import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Box, Container, Snackbar, Alert } from '@mui/material'
import Navbar from '../ui/Navbar'
import LoginPage from '../screens/LoginPage'
import SignupPage from '../screens/SignupPage'
import Dashboard from '../screens/Dashboard'
import Marketplace from '../screens/Marketplace'
import Requests from '../screens/Requests'
import { AuthProvider, useAuth } from '../state/AuthContext'

function Protected() {
  const { user, loading } = useAuth()
  if (loading) return <div />
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Navbar />
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route element={<Protected />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/requests" element={<Requests />} />
            </Route>
          </Routes>
        </Container>
      </Box>
    </AuthProvider>
  )
}
