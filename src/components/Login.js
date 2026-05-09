import React, { useState } from 'react';
import { Box, Container, TextField, Button, Typography, Card, CardContent, Alert, Link, InputAdornment, IconButton } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { loginApi } from '../api/pageApi';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadMasters } from '../store/masterSlice';
import LoginIconImg from "../assets/iljin-logo.png";



const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();


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

      await dispatch(loadMasters());

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
              <Box
                component="img"
                src={LoginIconImg}
                alt="Login"
                sx={{
                  width: 150,
                  height: 40,
                  mb: 1,
                }}
              />
              <Typography variant="h5" fontWeight="bold">
                Quality Assurance Dashboard
              </Typography>
              {/* <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Warranty Claim Management System
              </Typography> */}
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
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
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

          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Login;
