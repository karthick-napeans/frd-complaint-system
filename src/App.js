import React, { useState, useEffect } from "react";
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
  Divider, CircularProgress,Button
} from "@mui/material";

import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";

import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";

import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import UserManagement from "./components/UserManagement";
import MasterData from "./components/MasterData";
import BulkUpload from "./components/BulkUpload";
import Reports from "./components/Reports";
import UploadHistory from "./components/UploadHistory";
import ColumnMapper from "./components/ColumnMapper";
import WarrantyEntry from "./components/WarrantyEntry";
import ComplaintForm from "./components/ComplaintForm";
import DREEntry from "./components/DreEntry";
import WarrantyAnalysis from "./components/WarrantyAnalysis";
import Sidebar from "./components/Sidebar";
import ComplaintAnalysis from "./components/ComplaintAnalysis";
import AuditLogs from "./components/AuditLogs";
import CustomerSummary from "./components/CustomerSummary";
import DreSummary from "./components/DreSummary";
import ImprovementBaselinePage from "./components/ImprovementBaseline";
import CloudOffIcon from "@mui/icons-material/CloudOff"; 

import { useReloadControl } from "./reload/useReloadControl";
import { healthCheck } from "./api/pageApi";

const drawerWidth = 280;


/* =======================
   APP LAYOUT
======================= */
const AppLayout = ({ userRole, username, onLogout }) => {

  useReloadControl();

  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);

  const navigate = useNavigate();

  const handleLogoutClick = () => {
    setAnchorEl(null);
    onLogout();
    navigate("/", { replace: true });
  };

  return (
    <Box sx={{ display: "flex" }}>

      <CssBaseline />

      {/* APP BAR */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: 1300,
          ml: drawerOpen ? `${drawerWidth}px` : 0,
          transition: "margin-left 0.3s",
        }}
      >
        <Toolbar>

          <IconButton
            color="inherit"
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            QA/QC Dashboard
          </Typography>

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar>
              {username?.charAt(0)?.toUpperCase()}
            </Avatar>
          </IconButton>

        </Toolbar>
      </AppBar>


      {/* SIDEBAR */}
      <Sidebar
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userRole={userRole}
        username={username}
        onLogout={handleLogoutClick}
      />


      {/* USER MENU */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            navigate("/settings");
          }}
        >
          <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
          Settings
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogoutClick}>
          <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
          Logout
        </MenuItem>

      </Menu>


      {/* MAIN CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          width: drawerOpen
            ? `calc(100% - ${drawerWidth}px)`
            : "100%",
        }}
      >

        <Routes>

          <Route path="/dashboard" element={<Dashboard />} />

          {/* Warranty */}
          <Route path="/warranty/entry" element={<WarrantyEntry />} />
          <Route path="/warranty/analysis" element={<WarrantyAnalysis />} />
          <Route path="/warranty/improvement-baseline" element={<ImprovementBaselinePage />} />
          <Route path="/warranty/mapper" element={<ColumnMapper />} />

          {/* DRE */}
          <Route path="/dre/entry" element={<DREEntry />} />
          <Route path="/dre/summary" element={<DreSummary />} />

          {/* Complaints */}
          <Route path="/complaints/entry" element={<ComplaintForm />} />
          <Route path="/complaints/summary" element={<CustomerSummary />} />
          <Route path="/complaints/analysis" element={<ComplaintAnalysis />} />

          {/* Admin */}
          <Route path="/users" element={<UserManagement />} />
          <Route path="/masters" element={<MasterData userRole={userRole} />} />

          {/* Others */}
          <Route path="/bulk-upload" element={<BulkUpload />} />
          <Route path="/upload-history" element={<UploadHistory />} />
          <Route path="/reports" element={<Reports />} />
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


  /* ✅ RESTORE LOGIN AFTER REFRESH */
  useEffect(() => {

    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole");
    const name = localStorage.getItem("username");

    if (token) {
      setIsAuthenticated(true);
      setUserRole(role || "");
      setUsername(name || "");
    }

  }, []);


  /* API HEALTH CHECK */
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
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          Checking user access...
        </Typography>
      </Box>
    );
  }

  if (apiStatus === "down") {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
          gap: 2,
          textAlign: "center",
        }}
      >
        <CloudOffIcon sx={{ fontSize: 60, color: "text.secondary" }} />

        <Typography variant="h6">
          Service unavailable
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Our server is currently unreachable. Please try again later.
        </Typography>

        <Button
          variant="contained"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }


  /* LOGIN */
  const handleLogin = (role, name) => {

    localStorage.setItem("userRole", role);
    localStorage.setItem("username", name);

    setIsAuthenticated(true);
    setUserRole(role);
    setUsername(name);
  };


  /* LOGOUT */
  const handleLogout = () => {

    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");

    setIsAuthenticated(false);
  };


  return (

    <BrowserRouter>

      <Routes>

        {/* LOGIN */}
        <Route
          path="/"
          element={
            !isAuthenticated
              ? <Login onLogin={handleLogin} />
              : <Navigate to="/dashboard" replace />
          }
        />

        {/* PROTECTED */}
        <Route
          path="/*"
          element={
            isAuthenticated
              ? (
                <AppLayout
                  userRole={userRole}
                  username={username}
                  onLogout={handleLogout}
                />
              )
              : <Navigate to="/" replace />
          }
        />
      </Routes>

    </BrowserRouter>

  );
}

export default App;