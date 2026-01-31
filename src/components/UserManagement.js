import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getAllUsers, createUser, updateUser, deleteUser } from '../api/pageApi';

const UserManagement = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    userId: null,
    username: '',
    email: '',
    role: 'QC_User',
    contactNumber: '',
    designation: '',
    isActive: true,
    password: '',
  });


  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const users = await getAllUsers();

      const userList = Array.isArray(users)
        ? users
        : Array.isArray(users?.Data)
          ? users.Data
          : [];
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ username: '', email: '', role: 'QC_User', password: '' });
    setOpenDialog(true);
  };

  const handleEdit = (row) => {
    setEditingUser(row);

    setFormData({
      userId: row.UserId,
      username: row.UserName ?? '',
      email: row.EmailId ?? '',
      role: row.UserRole ?? 'QC_User',
      contactNumber: row.ContactNumber ? String(row.ContactNumber) : '',
      designation: row.Designation ?? '',
      isActive: Boolean(row.IsActive),
      password: '',
    });

    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    try {
      console.log("Deleting user with ID:", id);
      await deleteUser(id);
      // setUsers((prev) => prev.filter((u) => u.UserId !== id));
      await fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const buildUpdatePayload = (formData, editingUser) => {
    return {
      UserId: editingUser.UserId,

      UserName: formData.username ?? editingUser.UserName,
      EmailId: formData.email ?? editingUser.EmailId,

      PasswordHash: editingUser.PasswordHash,
      ProfilePicUrl: editingUser.ProfilePicUrl ?? "",

      ContactNumber:
        formData.contactNumber !== undefined && formData.contactNumber !== ""
          ? Number(formData.contactNumber)
          : editingUser.ContactNumber,

      UserRole: formData.role ?? editingUser.UserRole,
      Designation: formData.designation ?? editingUser.Designation,
    };
  }; 

  const handleCreateEditUser = async () => {
    try {
      if (editingUser) {
        const payload = buildUpdatePayload(formData, editingUser);

        console.log("UPDATE PAYLOAD:", payload);

        await updateUser(payload); // POST /users/update
        await fetchUsers();
      } else {
        const newUser = {
          UserName: formData.username,
          EmailId: formData.email,
          PasswordHash: formData.password,
          ContactNumber: Number(formData.contactNumber),
          UserRole: formData.role,
          Designation: formData.designation,
          ProfilePicUrl: "",
        };

        const createdUser = await createUser(newUser);
        console.log("Created user:", createdUser);

        if (createdUser === 1) {
          await fetchUsers();
        }
      }

      setOpenDialog(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Error creating/editing user:", error?.response || error);
    }
  }; 

  const RoleChip = ({ value }) => (
    <Chip
      label={value}
      size="small"
      color={
        value === 'Super_Admin'
          ? 'error'
          : value === 'QC_Admin'
            ? 'warning'
            : 'default'
      }
      variant="outlined"
      sx={{ fontWeight: 600 }}
    />
  );

  const StatusChip = ({ value }) => (
    <Chip
      label={value}
      size="small"
      color={value === 'Active' ? 'success' : 'default'}
      sx={{ fontWeight: 600 }}
    />
  );

  /* ---------------- COLUMNS ---------------- */
  const columns = [
    {
      field: 'sno',
      headerName: 'S. No',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params) =>
        params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
    },
    {
      field: 'UserName',
      headerName: 'Username',
      flex: 1,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'EmailId',
      headerName: 'Email',
      flex: 1.5,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'UserRole',
      headerName: 'Role',
      width: 160,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <RoleChip value={params.value} />,
    },
    {
      field: 'IsActive',
      headerName: 'Status',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <StatusChip value={params.value ? 'Active' : 'Inactive'} />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleEdit(params.row)}
          >
            <EditIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.UserId)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];


  /* ---------------- UI ---------------- */
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          User Management
        </Typography>

        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Add User
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ height: 420 }}>
            <DataGrid
              rows={users}
              columns={columns}
              getRowId={(row) => row.UserId}
              pageSizeOptions={[10, 20, 50]}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f8fafc',
                  fontWeight: 700,
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: '#f9fafb',
                },
                '& .MuiDataGrid-cell': {
                  justifyContent: 'center',
                  display: 'flex',
                  alignItems: 'center',
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Username"
            fullWidth
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />

          <TextField
            label="Email"
            fullWidth
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          {!editingUser && (
            <TextField
              label="Password"
              fullWidth
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          )}

          <TextField
            select
            label="Role"
            SelectProps={{ native: true }}
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="Super_Admin">Super Admin</option>
            <option value="QC_Admin">QC Admin</option>
            <option value="QC_User">QC User</option>
          </TextField>

          <TextField
            label="ContactNumber"
            type='number'
            SelectProps={{ native: true }}
            value={formData.contactNumber} onChange={(e) =>
              setFormData({ ...formData, contactNumber: e.target.value })
            }
          >Contact Number</TextField>


          <TextField
            label="Designation"
            fullWidth
            value={formData.designation || ''}
            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
          />

          {editingUser && (
            <TextField
              select
              label="Status"
              fullWidth
              value={formData.isActive ? 'Active' : 'Inactive'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  isActive: e.target.value === 'Active',
                })
              }
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </TextField>

          )}



        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateEditUser}>
            {editingUser ? 'Update User' : 'Add User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;
