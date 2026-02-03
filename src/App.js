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
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import MasterData from './components/MasterData';
import BulkUpload from './components/BulkUpload';
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
import { useReloadControl } from './reload/useReloadControl';


//API
import { healthCheck } from './api/pageApi';


const drawerWidth = 280;

const AppLayout = ({ userRole, username, onLogout }) => {
  useReloadControl();

  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setDrawerOpen(prev => !prev);
  };

  const handleLogout = () => {
    setAnchorEl(null);
    onLogout();
    navigate("/", { replace: true });
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* =======================
          APP BAR
      ======================= */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: 1300,
          ml: drawerOpen ? `${drawerWidth}px` : 0,
          transition: "margin-left 0.3s",
        }}
      >
        <Toolbar>
          <IconButton color="inherit" onClick={handleDrawerToggle} edge="start">
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            QC Complaint Management System
          </Typography>

          <Avatar sx={{ cursor: "pointer" }}>
            {username?.charAt(0)?.toUpperCase()}
          </Avatar>
        </Toolbar>
      </AppBar>

      {/* =======================
          SIDEBAR  ✅ THIS WAS MISSING
      ======================= */}
      <Sidebar
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userRole={userRole}
        username={username}
        onLogout={handleLogout}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          width: drawerOpen ? `calc(100% - ${drawerWidth}px)` : '100%',
          transition: 'width 0.3s, margin-left 0.3s',
        }}

      >
        <Routes>
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}

          {/* Warranty */}
          <Route path="/warranty/entry" element={<WarrantyEntry />} />
          <Route path="/warranty/analysis" element={<WarrantyAnalysis />} />
          <Route path="/warranty/mapper" element={<ColumnMapper />} />

          {/* DRE */}
          <Route path="/dre/entry" element={<DREEntry />} />
          <Route path="/dre/analysis" element={<DREAnalysis />} />

          {/* Complaints */}
          <Route path="/complaints/entry" element={<ComplaintForm />} />
          <Route path="/complaints/analysis" element={<ComplaintAnalysis />} />

          {/* Admin */}
          <Route path="/users" element={<UserManagement />} />
          <Route path="/masters" element={<MasterData userRole={userRole} />} />

          {/* Others */}
          <Route path="/bulk-upload" element={<BulkUpload userRole={userRole} />} />
          <Route path="/upload-history" element={<UploadHistory />} />
          <Route path="/reports" element={<Reports userRole={userRole} />} />
          <Route path="/audit" element={<AuditLogs />} />
        </Routes>

      </Box>
    </Box>
  );
};

/* =======================
  ROOT APP
======================= */
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [username, setUsername] = useState("");
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await healthCheck();
        setApiStatus("healthy");
      } catch {
        setApiStatus("down");
      }
    };
    checkHealth();
  }, []);

  if (apiStatus === "checking") {
    return <Typography>Checking server status...</Typography>;
  }

  if (apiStatus === "down") {
    return <Typography>Service unavailable</Typography>;
  }

  const handleLogin = (role, name) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUsername(name);
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUserRole("");
    setUsername("");
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            !isAuthenticated ? (
              <Login onLogin={handleLogin} />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />

        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <AppLayout
                userRole={userRole}
                username={username}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
