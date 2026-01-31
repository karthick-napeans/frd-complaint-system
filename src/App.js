import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  IconButton,
  CssBaseline,
  Divider,
} from '@mui/material';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import { useDispatch, useSelector } from 'react-redux';


import Login from './components/Login';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import MasterData from './components/MasterData';
import BulkUpload from './components/BulkUpload';
import ComplaintEntry from './components/ComplaintEntry';
import Reports from './components/Reports';
import UploadHistory from './components/UploadHistory';
import ColumnMapper from './components/ColumnMapper';
import WarrantyEntry from './components/WarrantyEntry';
import ComplaintForm from './components/ComplaintForm';
import DREEntry from './components/DreEntry';
import WarrantyAnalysis from './components/WarrantyAnalysis';
import Sidebar from './components/Sidebar';
import ComplaintAnalysis from './components/ComplaintAnalysis';
import DREAnalysis from './components/DREAnalysis';
import AuditLogs from './components/AuditLogs';

import { loadMasters } from './store/masterSlice';

//API
import { healthCheck } from './api/pageApi';


const AppLayout = ({ isAuthenticated, userRole, username, onLogout }) => {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);

  const navigate = useNavigate();
  const drawerWidth = 280;

  if (!isAuthenticated) {
    return <Login onLogin={() => { }} />;
  }

  const handleDrawerToggle = () => {
    setDrawerOpen((prev) => !prev);
  };

  const handleProfileMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleCloseMenu();
    localStorage.clear();
    onLogout();
    navigate('/');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        sx={{
          zIndex: 1300,
          ml: drawerOpen ? `${drawerWidth}px` : 0,

          transition: 'margin-left 420ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >

        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle}>
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            QC Complaint Management System
          </Typography>

          <Avatar sx={{ cursor: 'pointer' }} onClick={handleProfileMenu}>
            {username?.charAt(0).toUpperCase()}
          </Avatar>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
            <MenuItem disabled>
              <Typography variant="caption">
                {username} ({userRole})
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleCloseMenu}>
              <SettingsIcon sx={{ mr: 1 }} /> Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* =======================
            SIDEBAR
        ======================= */}
      <Sidebar
        userRole={userRole}
        username={username}
        onLogout={handleLogout}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* =======================
            MAIN CONTENT
        ======================= */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: 8,
        }}
      >


        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/masters" element={<MasterData userRole={userRole} />} />
          <Route path="/complaint-entry" element={<ComplaintEntry />} />
          <Route path="/complaints/analysis" element={<ComplaintAnalysis />} />
          <Route path="/bulk-upload" element={<BulkUpload userRole={userRole} />} />
          <Route path="/upload-history" element={<UploadHistory />} />
          <Route path="/reports" element={<Reports userRole={userRole} />} />
          <Route path="/audit" element={<AuditLogs />} />

          <Route path="/warranty/mapper" element={<ColumnMapper />} />
          <Route path="/warranty/entry" element={<WarrantyEntry />} />
          <Route path="/warranty/analysis" element={<WarrantyAnalysis />} />
          <Route path="/complaints/entry" element={<ComplaintForm />} />
          <Route path="/dre/entry" element={<DREEntry />} />
          <Route path="/dre/analysis" element={<DREAnalysis />} />
        </Routes>
      </Box>
    </Box >
  );
};

/* =======================
  ROOT APP
======================= */
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [username, setUsername] = useState('');
  const [apiStatus, setApiStatus] = useState("checking"); 
  const dispatch = useDispatch();
  const loaded = useSelector(s => s.masters.loaded);

  useEffect(() => {
    if (!loaded) dispatch(loadMasters());
  }, [loaded, dispatch]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await healthCheck();
        setApiStatus("healthy");
        console.log("API is healthy");
      } catch (error) {
        setApiStatus("down");
        console.error("API is down:", error);
      }

    };

    checkHealth();
  }, []);

  if (apiStatus === "checking") {
    return <Typography variant="h6">Checking server status...</Typography>;
  }

  if (apiStatus === "down") {
    return <Typography variant="h6">Service unavailable. Please try later.</Typography>;
  }

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUsername(localStorage.getItem('username'));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('');
    setUsername('');
  };

  return (
    <BrowserRouter>
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <AppLayout
          isAuthenticated={isAuthenticated}
          userRole={userRole}
          username={username}
          onLogout={handleLogout}
        />
      )}
    </BrowserRouter>
  );
}


export default App;
