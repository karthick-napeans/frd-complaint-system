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
  Alert, DialogContentText, MenuItem
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
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    userId: null,
    username: '',
    email: '',
    role: '',
    contactNumber: '',
    designation: '',
    isActive: true,
    password: '',
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState(null);
  const [errors, setErrors] = useState({});

  const patterns = {
    char: /^[A-Za-z ]+$/,                 // letters + space
    charNum: /^[A-Za-z0-9]+$/,           // letters + numbers
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // valid email
    number: /^[0-9]+$/,                  // numbers only
  };

  const EMPTY_USER_FORM = {
    employeeId: "",
    username: "",
    email: "",
    password: "",
    role: "",
    contactNumber: "",
    designation: "",
  };

  const handleResetUserForm = () => {
    if (editingUser) {
      // reset to original editing values
      setFormData({
        employeeId: editingUser.employeeId || "",
        username: editingUser.username || "",
        email: editingUser.email || "",
        password: "",
        role: editingUser.role || "",
        contactNumber: editingUser.contactNumber || "",
        designation: editingUser.designation || "",
      });
    } else {
      // reset to empty
      setFormData(EMPTY_USER_FORM);
    }

    setErrors({});        // ✅ clear all validation errors
    setSubmitError("");   // ✅ clear API error
  };


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

  const validateUserForm = () => {
    let tempErrors = {};

    if (!formData.employeeId?.trim())
      tempErrors.employeeId = "Required";

    if (!formData.username?.trim())
      tempErrors.username = "Required";

    if (!formData.email?.trim()) {
      tempErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      tempErrors.email = "Invalid Format";
    }

    if (!editingUser && !formData.password?.trim())
      tempErrors.password = "Required";

    if (!formData.role)
      tempErrors.role = "Required";

    if (!formData.contactNumber?.trim())
      tempErrors.contactNumber = "Required";

    if (!formData.designation?.trim())
      tempErrors.designation = "Required";

    setErrors(tempErrors);

    return Object.keys(tempErrors).length === 0;
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

    const isValid = validateUserForm();
    if (!isValid) {
      setSubmitLoading(false); // ✅ stop loader if validation fails
      return;
    }

    setSubmitLoading(true); // start loader AFTER validation

    try {
      if (editingUser) {
        const payload = buildUpdatePayload(formData, editingUser);
        await updateUser(payload);
        handleResetUserForm();
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
        handleResetUserForm(); 
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
    < Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
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

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', }}>
          <TextField
            label="Employee ID *"
            fullWidth
            size="small"
            value={formData.employeeId || ""}
            error={!!errors.employeeId}
            helperText={errors.employeeId || " "}
            sx={{ mt: 2 }}
            onChange={(e) => {
              const value = e.target.value;

              if (!patterns.charNum.test(value) && value !== "") return;

              setFormData({ ...formData, employeeId: value });

              setErrors(prev => ({ ...prev, employeeId: "" }));
            }}
          />

          <TextField
            label="User Name *"
            fullWidth
            size="small"
            value={formData.username || ""}
            error={!!errors.username}
            helperText={errors.username || " "}
            onChange={(e) => {
              const value = e.target.value;

              if (!patterns.char.test(value) && value !== "") return;

              setFormData({ ...formData, username: value });
              setErrors(prev => ({ ...prev, username: "" }));
            }}
          />

          <TextField
            label="Email *"
            type="email"
            fullWidth
            size="small"
            value={formData.email || ""}
            error={!!errors.email}
            helperText={errors.email || " "}
            onChange={(e) => {
              const value = e.target.value;

              setFormData({ ...formData, email: value });
              setErrors(prev => ({ ...prev, email: "" }));
            }}
          />

          {!editingUser && (
            <TextField
              label="Password *"
              type="password"
              fullWidth
              size="small"
              value={formData.password}
              error={!!errors.password}
              helperText={errors.password || " "}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, password: value });

                if (value) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.password;
                    return newErrors;
                  });
                }
              }}
            />
          )}


          <TextField
            select
            label="Role *"
            fullWidth
            size="small"
            sx={{ mb: 3, }}
            value={formData.role || ""}
            error={!!errors.role}
            helperText={errors.role || ""}
            onChange={(e) => {
              const value = e.target.value;

              setFormData((prev) => ({
                ...prev,
                role: value,
              }));

              if (value) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.role;
                  return newErrors;
                });
              }
            }}
          >
            <MenuItem value="Super_Admin">
              Super Admin
            </MenuItem>

            <MenuItem value="QC_Admin">
              QC Admin
            </MenuItem>

            <MenuItem value="QC_User">
              QC User
            </MenuItem>
          </TextField>

          <TextField
            label="Contact Number *"
            fullWidth
            size="small"
            value={formData.contactNumber || ""}
            error={!!errors.contactNumber}
            helperText={errors.contactNumber || " "}
            inputProps={{ maxLength: 10 }}
            onChange={(e) => {
              const value = e.target.value;

              if (!patterns.number.test(value) && value !== "") return;

              setFormData({ ...formData, contactNumber: value });
              setErrors(prev => ({ ...prev, contactNumber: "" }));
            }}
          />

          <TextField
            label="Designation *"
            fullWidth
            size="small"
            value={formData.designation || ""}
            error={!!errors.designation}
            helperText={errors.designation || " "}
            onChange={(e) => {
              const value = e.target.value;

              if (!patterns.char.test(value) && value !== "") return;

              setFormData({ ...formData, designation: value });
              setErrors(prev => ({ ...prev, designation: "" }));
            }}
          />

          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}


        </DialogContent>

        <DialogActions
          sx={{
            display: "flex",
            justifyContent: "space-between",
            px: 3,
            pb: 2,
          }}
        >
          <Button
            variant="outlined"
            color="error"
            onClick={handleResetUserForm}
          >
            Reset
          </Button>

          {/* Right Side Buttons */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleCreateEditUser}
              disabled={submitLoading}
              startIcon={
                submitLoading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : null
              }
            >
              {submitLoading
                ? (editingUser ? "Updating..." : "Creating...")
                : (editingUser ? "Update User" : "Add User")}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
