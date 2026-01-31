import React, { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const drawerWidth = 280;

const Layout = () => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar
        open={open}
        onClose={handleClose}
        userRole="ADMIN"
        username="Selva"
        onLogout={() => alert('Logged out')}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
        }}
      >
        {/* Top Bar */}
        <IconButton onClick={handleOpen}>
          <MenuIcon />
        </IconButton>

        {/* Page Content */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
