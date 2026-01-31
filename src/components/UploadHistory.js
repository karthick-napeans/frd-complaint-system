import React, { useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  Button,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';

const UploadHistory = () => {
  const [uploadHistory, setUploadHistory] = useState([
    {
      id: 1,
      filename: 'repair_data_oct_2025.xlsx',
      type: 'Repair',
      uploadedBy: 'qcadmin',
      uploadDate: '2025-11-02',
      uploadTime: '10:30 AM',
      status: 'Success',
      recordsProcessed: 145,
      validationErrors: 0,
      notes: '',
    },
    {
      id: 2,
      filename: 'dre_data_sep_2025.xlsx',
      type: 'DRE',
      uploadedBy: 'qcadmin',
      uploadDate: '2025-10-28',
      uploadTime: '2:15 PM',
      status: 'Success',
      recordsProcessed: 58,
      validationErrors: 0,
      notes: 'Weekly DRE upload',
    },
    {
      id: 3,
      filename: 'repair_batch_02.xlsx',
      type: 'Repair',
      uploadedBy: 'admin',
      uploadDate: '2025-10-25',
      uploadTime: '9:00 AM',
      status: 'Failed',
      recordsProcessed: 0,
      validationErrors: 12,
      notes: 'Missing column validation',
    },
    {
      id: 4,
      filename: 'dre_weekly_report.xlsx',
      type: 'DRE',
      uploadedBy: 'qcadmin',
      uploadDate: '2025-10-20',
      uploadTime: '3:45 PM',
      status: 'Success',
      recordsProcessed: 42,
      validationErrors: 0,
      notes: '',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const columns = [
    { field: 'id', headerName: 'ID', width: 50 },
    {
      field: 'filename',
      headerName: 'Filename',
      width: 220,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'Repair' ? 'primary' : 'secondary'}
          variant="outlined"
          size="small"
        />
      ),
    },
    {
      field: 'uploadDate',
      headerName: 'Upload Date',
      width: 120,
    },
    {
      field: 'uploadTime',
      headerName: 'Time',
      width: 100,
    },
    {
      field: 'uploadedBy',
      headerName: 'Uploaded By',
      width: 120,
    },
    {
      field: 'recordsProcessed',
      headerName: 'Records',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2">{params.value}</Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'Success' ? 'success' : 'error'}
          variant="filled"
          size="small"
        />
      ),
    },
    {
      field: 'validationErrors',
      headerName: 'Errors',
      width: 90,
      renderCell: (params) => (
        <Typography variant="body2" color={params.value > 0 ? 'error' : 'success'}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" title="Download Original File">
            <DownloadIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" title="View Details">
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const filteredData = uploadHistory.filter((item) => {
    const matchesSearch =
      item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalRecords = uploadHistory.reduce((sum, item) => sum + item.recordsProcessed, 0);
  const successfulUploads = uploadHistory.filter((item) => item.status === 'Success').length;
  const failedUploads = uploadHistory.filter((item) => item.status === 'Failed').length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Upload History & Management
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary">Total Uploads</Typography>
              <Typography variant="h4">{uploadHistory.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary">Successful</Typography>
              <Typography variant="h4" sx={{ color: 'success.main' }}>
                {successfulUploads}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary">Failed</Typography>
              <Typography variant="h4" sx={{ color: 'error.main' }}>
                {failedUploads}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary">Total Records</Typography>
              <Typography variant="h4">{totalRecords}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                placeholder="Search by filename or uploader..."
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'textSecondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                select
                label="Type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                SelectProps={{ native: true }}
                fullWidth
              >
                <option value="all">All Types</option>
                <option value="Repair">Repair</option>
                <option value="DRE">DRE</option>
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                select
                label="Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                SelectProps={{ native: true }}
                fullWidth
              >
                <option value="all">All Status</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterStatus('all');
                }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Upload History Table */}
      <Card>
        <CardContent>
          <Box sx={{ height: 500 }}>
            <DataGrid
              rows={filteredData}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 20, 50]}
              disableSelectionOnClick
              sx={{
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 'bold',
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Recent Upload Details */}
      <Typography variant="h6" fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
        Recent Upload Summary
      </Typography>
      <Grid container spacing={2}>
        {uploadHistory.slice(0, 2).map((upload) => (
          <Grid item xs={12} md={6} key={upload.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">{upload.filename}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {upload.uploadDate} at {upload.uploadTime}
                    </Typography>
                  </Box>
                  <Chip
                    label={upload.status}
                    color={upload.status === 'Success' ? 'success' : 'error'}
                    variant="filled"
                  />
                </Box>

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Type:
                    </Typography>
                    <Typography variant="body2">{upload.type}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Uploaded By:
                    </Typography>
                    <Typography variant="body2">{upload.uploadedBy}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Records Processed:
                    </Typography>
                    <Typography variant="body2">{upload.recordsProcessed}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Validation Errors:
                    </Typography>
                    <Typography variant="body2" color={upload.validationErrors > 0 ? 'error' : 'success'}>
                      {upload.validationErrors}
                    </Typography>
                  </Grid>
                </Grid>

                {upload.notes && (
                  <Box sx={{ mt: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Notes:
                    </Typography>
                    <Typography variant="body2">{upload.notes}</Typography>
                  </Box>
                )}

                <Button fullWidth variant="outlined" sx={{ mt: 2 }} startIcon={<DownloadIcon />}>
                  Download File
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default UploadHistory;
