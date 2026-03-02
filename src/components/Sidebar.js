import React, { useState, useEffect, useRef } from "react";
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
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import menuItems from "./../utils/menuItems";
import packageJson from "../../package.json";

const drawerWidth = 280;

const Sidebar = ({ userRole, username, open }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItem, setExpandedItem] = useState(null);
  const hasInitialized = useRef(false); 
  const appVersion = packageJson.version;

  // Expand active parent on first load
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
    setExpandedItem((prev) => (prev === id ? null : id));
  };

  const normalizeRole = (role) =>
    role?.toLowerCase().replace(/[_\s]+/g, "");

  // Role filtering
  const filteredMenuItems = menuItems
    .map((item) => {
      if (
        !item.roles.some(
          (r) => normalizeRole(r) === normalizeRole(userRole)
        )
      )
        return null;

      if (!item.submenu) return item;

      const filteredSubmenu = item.submenu.filter((sub) =>
        sub.roles.some(
          (r) => normalizeRole(r) === normalizeRole(userRole)
        )
      );

      return {
        ...item,
        submenu: filteredSubmenu,
      };
    })
    .filter((item) => item && (!item.submenu || item.submenu.length > 0));

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: open ? drawerWidth : 0,
        flexShrink: 0,
        whiteSpace: "nowrap",
        "& .MuiDrawer-paper": {
          width: open ? drawerWidth : 0,
          boxSizing: "border-box",
          top: "64px", // push below AppBar
          height: "calc(100vh - 64px)", // FULL visible height
          overflowX: "hidden",
          transition: "width 420ms cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Profile Section */}
        <Box
          sx={{
            p: 2,
            textAlign: "center",
            borderBottom: "1px solid #eee",
          }}
        >
          <Avatar sx={{ mx: "auto", mb: 1 }}>
            {username?.charAt(0).toUpperCase()}
          </Avatar>
          <Typography fontWeight={600}>{username}</Typography>
          <Typography variant="caption" color="text.secondary">
            {userRole}
          </Typography>
        </Box>

        {/* Menu Section (Scrollable) */}
        <List
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            py: 1,
          }}
        >
          {filteredMenuItems.map((item) => {
            const hasSubmenu = item.submenu?.length > 0;

            const isParentActive =
              location.pathname === item.path ||
              item.submenu?.some((sub) =>
                location.pathname.startsWith(sub.path)
              );

            const isExpanded = expandedItem === item.id;

            if (hasSubmenu) {
              return (
                <Box key={item.id}>
                  <ListItemButton
                    selected={isParentActive}
                    onClick={() => handleToggleSubmenu(item.id)}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
                    {isExpanded ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </ListItemButton>

                  <Collapse
                    in={isExpanded}
                    timeout="auto"
                    unmountOnExit
                  >
                    <List disablePadding>
                      {item.submenu.map((sub) => {
                        const isSubActive =
                          location.pathname === sub.path ||
                          location.pathname.startsWith(sub.path);

                        return (
                          <ListItemButton
                            key={sub.id}
                            sx={{ pl: 4 }}
                            selected={isSubActive}
                            onClick={() =>
                              handleNavigate(sub.path)
                            }
                          >
                            <ListItemIcon>
                              {sub.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={sub.label}
                            />
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

        {/* Version Footer (Fixed Bottom) */}
        <Box
          sx={{
            p: 0,
            textAlign: "center",
            borderTop: "1px solid #eee",
            backgroundColor: "#fafafa",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "#666",
              fontSize: "12px",
              letterSpacing: 0.5,
            }}
          >
            Version {appVersion}
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;