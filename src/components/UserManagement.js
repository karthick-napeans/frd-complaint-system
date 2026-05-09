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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LockResetIcon from '@mui/icons-material/LockReset';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';
import ConfirmDialog from './ConfirmDialog';
import { getAllUsers, createUser, updateUser, deleteUser, resetPassword } from '../api/pageApi';

const UserManagement = ({ userRole }) => {
  const currentUserRole = userRole?.toLowerCase();
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
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    successMessage: "",
    errorMessage: "",
    actionLabel: "Confirm",
    loadingLabel: "Processing...",
    buttonColor: "#1976d2",
    icon: null,
    onConfirm: null
  });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [message, setMessage] = useState("");

  const patterns = {
    char: /^[A-Za-z ]+$/,                 // letters + space
    charNum: /^[A-Za-z0-9]+$/,           // letters + numbers
    email: /^[^\s@]+@iljin\.com$/i, // enforce @iljin.com
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

      // 🔥 Sort by UserId DESC
      const sortedUsers = [...userList]
        .filter(user => user.IsActive === "true" || user.IsActive === true) // ✅ Active only
        .sort((a, b) => b.UserId - a.UserId);        // ✅ Descending order

      setUsers(sortedUsers);

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
      employeeId: row.EmployeeId ?? '',
      role: row.UserRole ?? 'QC_User',
      contactNumber: row.ContactNumber ? String(row.ContactNumber) : '',
      designation: row.Designation ?? '',
      password: '',
    });
    setOpenDialog(true);
  };

  const handleDelete = (user) => {
    console.log("Delete user:", user);
    setConfirmState({
      open: true,
      title: "Delete User",
      message: `Are you sure you want to delete ${user.username}?`,
      successMessage: "User deleted successfully.",
      errorMessage: "Failed to delete user. Please try again.",
      actionLabel: "Delete",
      loadingLabel: "Deleting...",
      buttonColor: "#ff6b6b",
      icon: <DeleteOutlineIcon sx={{ color: "#ff6b6b" }} />,
      onConfirm: () => confirmDeleteUser(user)
    });
  };

  const handleResetPassword = (user) => {
    setConfirmState({
      open: true,
      title: "Reset Password",
      message: `Are you sure you want to reset the password for ${user.username}?`,
      successMessage: "Password reset successfully.",
      errorMessage: "Failed to reset password. Please try again.",
      actionLabel: "Reset",
      loadingLabel: "Resetting...",
      buttonColor: "#f59e0b",
      icon: <LockResetIcon sx={{ color: "#f59e0b" }} />,
      onConfirm: () => confirmResetPassword(user)
    });
  };
 
  const confirmResetPassword = async (userId) => {
    setConfirmLoading(true);
    console.log("Resetting password for user with ID:", userId);
    await resetPassword(userId);
  }

  const confirmDeleteUser = async (id) => {
    console.log("Deleting user with ID:", id);

    // If delete fails, it must throw
    await deleteUser(id);

    // Refresh list after success
    await fetchUsers();
  };

  const handleCancelDelete = () => {
    setConfirmState(prev => ({
      ...prev,
      open: false
    }));
  };

  const validateUserForm = () => {
    let tempErrors = {};

    if (!formData.employeeId?.trim())
      tempErrors.employeeId = "Required";

    if (!formData.username?.trim())
      tempErrors.username = "Required";

    if (!formData.email?.trim()) {
      tempErrors.email = "Email is required";
    } else if (!/^[^\s@]+@iljin\.com$/i.test(formData.email)) {
      tempErrors.email = "Only @iljin.com emails allowed";
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

      EmployeeId: formData.employeeId,

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
    setMessage("");

    const isValid = validateUserForm();
    if (!isValid) {
      setSubmitLoading(false);
      return;
    }

    setSubmitLoading(true);

    try {
      if (editingUser) {
        const payload = buildUpdatePayload(formData, editingUser);
        await updateUser(payload);

        setMessage("✓ User updated successfully");

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
          EmployeeId: formData.employeeId
        };

        await createUser(newUser);

        setMessage("✓ User created successfully");

        handleResetUserForm();
        await fetchUsers();
      }

      setOpenDialog(false);
      setEditingUser(null);

    } catch (error) {

      const msg = getErrorMessage(error);
      setMessage(msg || "User operation failed");

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

  const baseColumns = [
    {
      field: 'serialNo',
      headerName: 'S.No',
      width: 80,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const currentPage = paginationModel.page;
        const pageSize = paginationModel.pageSize;

        const visibleIndex = users
          .slice(currentPage * pageSize, currentPage * pageSize + pageSize)
          .findIndex((row) => row.UserId === params.row.UserId);

        return currentPage * pageSize + visibleIndex + 1;
      },
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
  ];

  const resetPasswordColumn =
    currentUserRole === "super_admin" || currentUserRole === "qcadmin" ? [
      {
        field: 'resetPassword',
        headerName: 'Reset Password',
        width: 160,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Button
            size="small"
            variant="contained"
            color="warning"
            onClick={() => handleResetPassword(params.row.UserId)}
          >
            Reset
          </Button>
        ),
      },
    ]
      : [];

  const columns = [
    ...baseColumns,
    ...resetPasswordColumn,
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
        <Typography variant="h5" fontWeight={700} sx={{ color: "#3b3b3b" }}>
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
              loading={loading}
              pageSizeOptions={[10, 20, 50]}
              disableColumnSelector
              disableColumnSorting

              pagination
              autoHeight

              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}

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

        <ConfirmDialog
          open={confirmState.open}
          title={confirmState.title}
          message={confirmState.message}
          successMessage={confirmState.successMessage}
          errorMessage={confirmState.errorMessage}
          onConfirm={confirmState.onConfirm}
          onCancel={handleCancelDelete}
          actionLabel={confirmState.actionLabel}
          loadingLabel={confirmState.loadingLabel}
          buttonColor={confirmState.buttonColor}
          icon={confirmState.icon}
        />




      </Card>

      <Dialog open={openDialog} onClose={() => {
        setOpenDialog(false);
        setSubmitError("");
        setErrors({});
      }} maxWidth="sm" fullWidth>

        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>

        {submitError && (
          <Box sx={{ px: 3 }}>
            <Alert severity="error">
              {submitError}
            </Alert>
          </Box>
        )}

        {message && (
          <Alert severity={message.includes('✓') ? 'success' : 'info'} sx={{ mt: 1 }}>
            {message}
          </Alert>
        )}

        <DialogContent sx={{ display: 'flex', flexDirection: 'column' }}>
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
          {/* 
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )} */}


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
            <Button onClick={() => {
              setOpenDialog(false);
              setSubmitError("");
              setErrors({});

            }}>
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
