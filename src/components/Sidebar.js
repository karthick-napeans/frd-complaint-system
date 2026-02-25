import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Avatar,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import menuItems from './../utils/menuItems';

const drawerWidth = 280;

const Sidebar = ({ userRole, username, onLogout, open, onClose }) => {
  console.log("Sidebar rendered with userRole:", userRole);
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItem, setExpandedItem] = useState(null);
  const hasInitialized = React.useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;

    const activeParent = menuItems.find(
      (item) =>
        item.submenu &&
        item.submenu.some((sub) =>
          location.pathname.startsWith(sub.path)
        )
    );

    if (activeParent) {
      setExpandedItem(activeParent.id);
      hasInitialized.current = true;
    }
  }, [location.pathname]);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleToggleSubmenu = (id) => {
    setExpandedItem(prev => (prev === id ? null : id));
  };

  const normalizeRole = (role) =>
    role?.toLowerCase().replace(/[_\s]+/g, '');

  const filteredMenuItems = menuItems
    .map(item => {
      if (!item.roles.some(r => normalizeRole(r) === normalizeRole(userRole)))
        return null;

      if (!item.submenu) return item;

      const filteredSubmenu = item.submenu.filter(sub =>
        sub.roles.some(r => normalizeRole(r) === normalizeRole(userRole))
      );

      return {
        ...item,
        submenu: filteredSubmenu,
      };
    })
    .filter(item => item && (!item.submenu || item.submenu.length > 0));



  return (
    <Drawer
      variant="persistent"
      open={open}

      sx={{
        width: open ? drawerWidth : 0,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          mt: 8,
          overflowX: 'hidden',
          transition: 'width 0.3s ease',
          width: open ? drawerWidth : 0,
          transition: 'width 420ms cubic-bezier(0.4, 0, 0.2, 1)',
        },

      }}
    >

      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
        {/* Profile */}
        <Box sx={{ p: 2, textAlign: 'center', borderBottom: '1px solid #eee' }}>
          <Avatar sx={{ mx: 'auto', mb: 1 }}>
            {username?.charAt(0).toUpperCase()}
          </Avatar>
          <Typography fontWeight={600}>{username}</Typography>
          <Typography variant="caption">{userRole}</Typography>
        </Box>

        {/* Menu */}
        <List sx={{ flex: 1 }}>
          {filteredMenuItems.map(item => {
            const hasSubmenu = item.submenu?.length > 0;

            // parent active if exact match OR any submenu match
            const isParentActive =
              location.pathname === item.path ||
              item.submenu?.some(sub =>
                location.pathname.startsWith(sub.path)
              );

            const isExpanded = expandedItem === item.id;

            if (hasSubmenu) {
              return (
                <Box key={item.id}>
                  <ListItemButton
                    onClick={() => handleToggleSubmenu(item.id)}
                    selected={isParentActive}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>

                    <ListItemText primary={item.label} />

                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </ListItemButton>

                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List disablePadding>
                      {item.submenu.map(sub => {
                        const isSubActive =
                          location.pathname === sub.path ||
                          location.pathname.startsWith(sub.path);

                        return (
                          <ListItemButton
                            key={sub.id}
                            sx={{ pl: 4 }}
                            selected={isSubActive}
                            onClick={() => handleNavigate(sub.path)}
                          >
                            <ListItemIcon>{sub.icon}</ListItemIcon>

                            <ListItemText primary={sub.label} />
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </Collapse>
                </Box>
              );
            }

            return (
              <ListItemButton
                key={item.id}
                selected={isParentActive}
                onClick={() => handleNavigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>

                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>

        {/* Footer */}
        <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px solid #eee' }}>
          <Typography variant="caption">Version 2.0</Typography>
        </Box>
      </Box>
    </Drawer >
  );
};

export default Sidebar;
