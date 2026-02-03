import React, { useState } from 'react';
import { Box, Container, TextField, Button, Typography, Card, CardContent, Alert } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import { loginApi } from '../api/pageApi';
import { useNavigate } from 'react-router-dom';


const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const handleLogin = async () => {
    const response = await loginApi({ UserName: username, Password: password });

    const { Token, UserRole, UserName } = response;

    localStorage.setItem("authToken", Token);
    localStorage.setItem("username", UserName);

    onLogin(UserRole, UserName);

    navigate("/dashboard", { replace: true });
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <Card sx={{ width: '100%', boxShadow: 3 }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <LoginIcon sx={{ fontSize: 60, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                QC Complaint System
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Customer Quality Claim & Complaint Management
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column', mt: 2 }}>
              <TextField
                label="Username"
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Try: admin"
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Try: admin123"
              />
              <Button
                variant="contained"
                size="large"
                onClick={handleLogin}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>

            {/* Demo Credentials Help */}
            {/* <Card sx={{ mt: 3, backgroundColor: '#e3f2fd', border: '1px solid #1976d2' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                  Demo Credentials (No Backend Needed):
                </Typography>
                <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                  <strong>Super Admin:</strong> admin / admin123
                </Typography>
                <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                  <strong>QC Admin:</strong> qcadmin / qcadmin123
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>QC User:</strong> qcuser / qcuser123
                </Typography>
              </CardContent>
            </Card> */}


          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Login;
