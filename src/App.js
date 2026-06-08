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
  Divider, CircularProgress, Button, Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,

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
// import Dashboard from "./components/Dashboard";
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
import { updatePassword } from "./api/pageApi";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LockResetIcon from "@mui/icons-material/LockReset";
import CloseIcon from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import InputAdornment from "@mui/material/InputAdornment";

const drawerWidth = 280;


/* =======================
   APP LAYOUT
======================= */
const AppLayout = ({ userRole, username, onLogout }) => {

  useReloadControl();

  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // "error" | "success"
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogoutClick = () => {
    setAnchorEl(null);
    onLogout();
    navigate("/", { replace: true });
  };

  const handleUpdatePassword = async () => {
    setStatus(null);
    setMessage("");

    if (!password || !confirmPassword) {
      setStatus("error");
      setMessage("Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await updatePassword(password);

      setStatus("success");
      setMessage("Password updated successfully.");

      // Auto close after 1.5 seconds
      setTimeout(() => {
        setOpenPasswordDialog(false);
        setPassword("");
        setConfirmPassword("");
        setStatus(null);
        setMessage("");
      }, 1500);

    } catch (error) {
      setStatus("error");
      setMessage("Failed to update password.");
    } finally {
      setLoading(false);
    }
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
            Quality Assurance Dashboard
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


      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setOpenPasswordDialog(true);
          }}
        >
          <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
          Update Password
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

          <Route path="/home" element={<Box />} />

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
          <Route path="/complaints/summary" element={<CustomerSummary userRole={userRole} />} />
          <Route path="/complaints/analysis" element={<ComplaintAnalysis userRole={userRole} />} />

          {/* Admin */}
          <Route path="/users" element={<UserManagement userRole={userRole} />} />
          <Route path="/masters" element={<MasterData userRole={userRole} />} />

          {/* Others */}
          <Route path="/bulk-upload" element={<BulkUpload />} />
          <Route path="/upload-history" element={<UploadHistory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/audit" element={<AuditLogs />} />

        </Routes>

      </Box>

      <Dialog
        open={openPasswordDialog}
        onClose={() => !loading && setOpenPasswordDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            width: 420,
            p: 1
          }
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LockResetIcon sx={{ color: "#1976d2" }} />
            <Typography fontWeight={600} fontSize={18}>
              Update Password
            </Typography>
          </Box>

          <IconButton
            size="small"
            onClick={() => {
              setOpenPasswordDialog(false);
              setStatus(null);
              setMessage("");
            }}
            disabled={loading}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>

          {/* Status Message */}
          {status && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 2,
                borderRadius: 2,
                mb: 2,
                backgroundColor:
                  status === "success" ? "#eafaf1" : "#fdecec",
                color:
                  status === "success" ? "#2e7d32" : "#c62828"
              }}
            >
              {status === "success" ? (
                <CheckCircleOutlineIcon fontSize="small" />
              ) : (
                <ErrorOutlineIcon fontSize="small" />
              )}
              <Typography fontSize={14} fontWeight={500}>
                {message}
              </Typography>
            </Box>
          )}

          {/* New Password */}
          <TextField
            fullWidth
            label="New Password"
            type={showPassword ? "text" : "password"}
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={status === "error" && !password}
            helperText={
              status === "error" && !password ? "Password is required" : ""
            }
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
              )
            }}
          />

          {/* Confirm Password */}
          <TextField
            fullWidth
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={
              status === "error" &&
              password &&
              confirmPassword &&
              password !== confirmPassword
            }
            helperText={
              password &&
                confirmPassword &&
                password !== confirmPassword
                ? "Passwords do not match"
                : ""
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    edge="end"
                  >
                    {showConfirmPassword ? (
                      <VisibilityOff />
                    ) : (
                      <Visibility />
                    )}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          {/* <Button
            onClick={() => setOpenPasswordDialog(false)}
            disabled={loading}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Cancel
          </Button> */}

          <Button
            variant="contained"
            disabled={loading}
            onClick={handleUpdatePassword}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 3
            }}
            startIcon={
              loading ? <CircularProgress size={18} color="inherit" /> : null
            }
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </DialogActions>
      </Dialog>
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
              : <Navigate to="/home" replace />
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