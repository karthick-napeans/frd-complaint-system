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
  Alert, DialogContentText
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';
import { getAllUsers, createUser, updateUser, deleteUser } from '../api/pageApi';

const UserManagement = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);        // For table loading
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    userId: null,
    username: '',
    email: '',
    role: 'QC_User',
    contactNumber: '',
    designation: '',
    isActive: true,
    password: '',
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState(null);


  useEffect(() => {
    fetchUsers();
  }, []);

  const getErrorMessage = (error) => {
    const data = error?.response?.data;
    if (data?.Message) {
      return data.Message;
    }
    if (data?.message) {
      return data.message;
    }
    if (typeof data === "string") {
      return data;
    }
    if (error?.message) {
      return error.message;
    }
    return "Something went wrong. Please try again.";
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const users = await getAllUsers();

      const userList = Array.isArray(users)
        ? users
        : Array.isArray(users?.Data)
          ? users.Data
          : [];

      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
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
      password: '',
    });
    setOpenDialog(true);
  };

  const handleDelete = (id) => {
    setUserIdToDelete(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userIdToDelete) return;

    try {
      console.log("Deleting user with ID:", userIdToDelete);

      await deleteUser(userIdToDelete);
      await fetchUsers();

    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setConfirmOpen(false);
      setUserIdToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setUserIdToDelete(null);
  };

  const buildUpdatePayload = (formData, editingUser) => {
    return {
      UserId: editingUser.UserId,

      UserName: formData.username || editingUser.UserName,
      EmailId: formData.email || editingUser.EmailId,

      PasswordHash: editingUser.PasswordHash,
      ProfilePicUrl: editingUser.ProfilePicUrl ?? null,

      ContactNumber:
        formData.contactNumber !== undefined && formData.contactNumber !== ""
          ? String(formData.contactNumber)
          : String(editingUser.ContactNumber),

      UserRole: formData.role || editingUser.UserRole,
      Designation: formData.designation || editingUser.Designation,
    };
  };

  const handleCreateEditUser = async () => {
    setSubmitError("");
    setSubmitLoading(true);

    try {
      if (editingUser) {
        const payload = buildUpdatePayload(formData, editingUser);
        await updateUser(payload);
        await fetchUsers();
      } else {
        const newUser = {
          UserName: formData.username,
          EmailId: formData.email,
          PasswordHash: formData.password,
          ContactNumber: String(formData.contactNumber),
          UserRole: formData.role,
          Designation: formData.designation,
          ProfilePicUrl: null,
        };

        await createUser(newUser);
        await fetchUsers();
      }

      setOpenDialog(false);
      setEditingUser(null);

    } catch (error) {
      const message = getErrorMessage(error);
      setSubmitError(message);
    } finally {
      setSubmitLoading(false);
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
      field: 'EmployeeId',
      headerName: 'Employee Id',
      flex: 1,
      align: 'center',
      headerAlign: 'center',
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
          <Box  >
            <DataGrid
              rows={users}
              columns={columns}
              getRowId={(row) => row.UserId}
              loading={loading}   // 🔥 Add this line

              pagination
              autoHeight              // 🔥 KEY LINE
              pageSizeOptions={[10, 20, 50]}
              initialState={{
                pagination: {
                  paginationModel: {
                    page: 0,
                    pageSize: 10,
                  },
                },
              }}

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

        <Dialog open={confirmOpen} onClose={handleCancelDelete}>
          <DialogTitle>Delete Record</DialogTitle>

          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this record? This action cannot be undone.
            </DialogContentText>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCancelDelete} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Employee ID"
            fullWidth
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
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

          {/* {editingUser && (
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

          )} */}

          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}


        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateEditUser}
            disabled={submitLoading}
            startIcon={
              submitLoading ? <CircularProgress size={18} color="inherit" /> : null
            }
          >
            {submitLoading
              ? (editingUser ? "Updating..." : "Creating...")
              : (editingUser ? "Update User" : "Add User")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;
