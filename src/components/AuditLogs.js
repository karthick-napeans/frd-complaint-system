import React, { useMemo, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Chip,
  MenuItem,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const AuditLogs = () => {
  const [filters, setFilters] = useState({
    user: '',
    action: '',
    date: '',
  });

  // 🔹 Mock Audit Log Data
  const auditLogs = [
    {
      id: 1,
      user: 'admin',
      role: 'Super Admin',
      action: 'CREATE',
      module: 'User Management',
      description: 'Created new QC Admin user',
      dateTime: '2025-01-15 10:32 AM',
      status: 'Success',
    },
    {
      id: 2,
      user: 'qcadmin',
      role: 'QC Admin',
      action: 'UPDATE',
      module: 'Master Data',
      description: 'Updated Model MASTER001',
      dateTime: '2025-01-15 11:10 AM',
      status: 'Success',
    },
    {
      id: 3,
      user: 'qcuser',
      role: 'QC User',
      action: 'VIEW',
      module: 'Complaint',
      description: 'Viewed complaint COMP-1023',
      dateTime: '2025-01-16 09:45 AM',
      status: 'Success',
    },
    {
      id: 4,
      user: 'admin',
      role: 'Super Admin',
      action: 'DELETE',
      module: 'User Management',
      description: 'Deleted user qcuser',
      dateTime: '2025-01-16 02:05 PM',
      status: 'Success',
    },
    {
      id: 5,
      user: 'qcadmin',
      role: 'QC Admin',
      action: 'SUBMIT',
      module: 'DRE',
      description: 'Submitted DRE entry DRE-2025-004',
      dateTime: '2025-01-17 04:20 PM',
      status: 'Success',
    },
  ];

  // 🔹 Filtered Data
  const filteredRows = useMemo(() => {
    return auditLogs.filter((row) => {
      return (
        (!filters.user || row.user.includes(filters.user)) &&
        (!filters.action || row.action === filters.action) &&
        (!filters.date || row.dateTime.startsWith(filters.date))
      );
    });
  }, [filters, auditLogs]);

  // 🔹 Chips
  const ActionChip = ({ value }) => {
    const colors = {
      CREATE: 'success',
      UPDATE: 'info',
      DELETE: 'error',
      VIEW: 'default',
      SUBMIT: 'warning',
    };
    return <Chip label={value} color={colors[value]} size="small" />;
  };

  const StatusChip = ({ value }) => (
    <Chip
      label={value}
      color={value === 'Success' ? 'success' : 'error'}
      size="small"
    />
  );

  // 🔹 Columns
  const columns = [
    {
      field: 'sno',
      headerName: 'S. No',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) =>
        params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
    },
    {
      field: 'user',
      headerName: 'User',
      flex: 1,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'role',
      headerName: 'Role',
      flex: 1,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <ActionChip value={params.value} />,
    },
    {
      field: 'module',
      headerName: 'Module',
      flex: 1.2,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'dateTime',
      headerName: 'Date & Time',
      flex: 1.3,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <StatusChip value={params.value} />,
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography fontSize={28} fontWeight={700} sx={{ mb: 3 }}>
        Audit Logs
      </Typography>

      {/* FILTERS */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                label="Search User"
                fullWidth
                value={filters.user}
                onChange={(e) =>
                  setFilters({ ...filters, user: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Action"
                fullWidth
                value={filters.action}
                onChange={(e) =>
                  setFilters({ ...filters, action: e.target.value })
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="CREATE">CREATE</MenuItem>
                <MenuItem value="UPDATE">UPDATE</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
                <MenuItem value="VIEW">VIEW</MenuItem>
                <MenuItem value="SUBMIT">SUBMIT</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                label="Date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={filters.date}
                onChange={(e) =>
                  setFilters({ ...filters, date: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* DATA GRID */}
      <Card>
        <CardContent>
          <Box sx={{ height: 520 }}>
            <DataGrid
              rows={filteredRows}
              columns={columns}
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
                  textAlign: 'center',
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AuditLogs;
