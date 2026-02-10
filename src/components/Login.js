import React, { useState } from 'react';
import { Box, Container, TextField, Button, Typography, Card, CardContent, Alert, Link } from '@mui/material';
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
    setError("");
    setLoading(true);

    try {
      const response = await loginApi({
        UserName: username,
        Password: password,
      });

      const { Token, UserRole, UserName } = response;

      localStorage.setItem("authToken", Token);
      localStorage.setItem("username", UserName);

      onLogin(UserRole, UserName);
      navigate("/dashboard", { replace: true });

    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid username or password");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
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
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />

              <Box sx={{ textAlign: "right" }}>
                <Link
                  component="button"
                  variant="body2"
                  underline="hover"
                  disabled={loading}
                  onClick={() => navigate("/forgot-password")}
                  sx={{ cursor: "pointer" }}
                >
                  Forgot password?
                </Link>
              </Box>

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

          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Login;
