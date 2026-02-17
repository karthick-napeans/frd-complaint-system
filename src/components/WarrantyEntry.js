import React, { useState, useRef } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useSelector } from 'react-redux';
import * as XLSX from 'xlsx';
import { uploadWarrantyClaims, getUploadHistory } from '../api/pageApi';

const WarrantyEntry = () => {
  const fileInputRef = useRef(null);
  const { customers } = useSelector(state => state.masters);
  console.log('Raw Data customers:', customers);
  const activeCustomers = customers.filter((c) => c.IsActive === true);
  const [customerSelected, setCustomerSelected] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [message, setMessage] = useState('');
  const [uploadHistory, setUploadHistory] = useState([]);

  const CUSTOMER_LIST = customers.map(c => ({
    id: c.CustomerId,
    name: c.CustomerName,
  }));

  const fetchUploadHistory = async () => {
    try {
      const response = await getUploadHistory(); // already response.data because interceptor
      const rows = response.map((item) => ({
        id: item.UploadHeadId, // DataGrid requires `id`
        customer: item.CustomerId,
        filename: item.FileName,
        uploadDate: new Date(item.UploadDateTime).toLocaleDateString(),
        recordsProcessed: item.TotalRecords,
        status: 'Success', // backend doesn’t send status
        downloadUrl: item.DownloadUrl,
      }));

      setUploadHistory(rows);
    } catch (error) {
      console.error('Failed to fetch upload history:', error);
    }
  };


  React.useEffect(() => {
    fetchUploadHistory();
  }, []);

  const handleCustomerSelect = (customerId) => {
    setCustomerSelected(customerId); // ✅ store ID only

    const customer = CUSTOMER_LIST.find(c => c.id === customerId);
    setMessage(`Selected customer: ${customer?.name}`);
  };


  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet).slice(0, 10); // First 10 rows
        setPreviewData(data);
        setMessage(`File loaded successfully. Preview shows ${data.length} rows.`);
      } catch (err) {
        setMessage('Error reading file: ' + err.message);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleValidateAndUpload = async () => {
    if (!customerSelected || !uploadedFile) {
      setMessage('Please select customer and upload file');
      return;
    }

    try {
      // ✅ Build FormData
      const formData = new FormData();
      formData.append('customerId', String(customerSelected));
      formData.append('file', uploadedFile);

      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await uploadWarrantyClaims(formData);
      await fetchUploadHistory();
      setMessage(
        `✓ Successfully uploaded ${response?.RecordsInserted ?? 0} warranty claim records!`
      );
      setUploadedFile(null);
      setPreviewData([]);
      setCustomerSelected('');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Upload failed:", error.response?.data || error);

      const apiMessage =
        error?.response?.data?.Message ||
        error?.response?.data?.message;

      setMessage(apiMessage || "Upload failed. Please try again.");  
 
    }
  };


  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },

    { field: 'customer', headerName: 'Customer', width: 150 },

    { field: 'filename', headerName: 'Filename', width: 280 },

    { field: 'uploadDate', headerName: 'Upload Date', width: 140 },

    { field: 'recordsProcessed', headerName: 'Records', width: 100 },

    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'Success' ? 'success' : 'error'}
          size="small"
        />
      ),
    },

    {
      field: 'download',
      headerName: 'Download',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <a
          href={params.row.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            textDecoration: 'none',
            color: '#1976d2',
            fontWeight: 500,
          }}
        >
          Download
        </a>
      ),
    },
  ];


  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Warranty Claim Entry - Excel Upload
      </Typography>

      <Grid container spacing={3}>
        {/* Upload Form */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              {/* Header */}
              <Typography variant="h6" sx={{ mb: 3 }}>
                Upload Warranty Excel
              </Typography>

              {/* STEP 1 */}
              <Typography
                variant="caption"
                sx={{ display: 'block', mb: 0.5, color: 'text.secondary' }}
              >
                Step 1 · Select Customer
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Customer</InputLabel>
                <Select
                  value={customerSelected}
                  label="Select Customer"
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                >
                  {activeCustomers.map((c) => (
                    <MenuItem key={c.CustomerId} value={c.CustomerId}>
                      {c.CustomerName}
                    </MenuItem>
                  ))}
                </Select>


              </FormControl>

              {/* STEP 2 */}
              <Typography
                variant="caption"
                sx={{ display: 'block', mb: 0.5, color: 'text.secondary' }}
              >
                Step 2 · Upload Excel File
              </Typography>

              <Box
                sx={{
                  border: '1px dashed #1976d2',
                  borderRadius: 2,
                  p: 2,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f9fbff',
                }}
              >
                <Typography variant="body2">
                  {uploadedFile ? uploadedFile.name : 'Select .xlsx or .xls file'}
                </Typography>

                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  disabled={!customerSelected}
                >
                  Browse
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    hidden
                    onChange={handleFileUpload}
                  />

                </Button>
              </Box>

              {/* STEP 3 */}
              <Typography
                variant="caption"
                sx={{ display: 'block', mb: 0.5, color: 'text.secondary' }}
              >
                Step 3 · Review & Upload
              </Typography>

              <Button
                variant="contained"
                color="success"
                fullWidth
                size="large"
                onClick={handleValidateAndUpload}
                disabled={!uploadedFile}
              >
                Upload & Process
              </Button>
            </CardContent>
          </Card>
        </Grid>


        {/* Data Preview */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              {/* Header */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">
                  Data Preview
                </Typography>

                {/* <Chip
                  label="First 10 rows"
                  size="small"
                  color="info"
                /> */}
              </Box>

              {previewData.length > 0 ? (
                <Box
                  sx={{
                    maxHeight: 360,
                    overflow: 'auto',
                    border: '1px solid #eee',
                    borderRadius: 2,
                  }}
                >
                  <TableContainer>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          {Object.keys(previewData[0] || {})
                            .slice(0, 5)
                            .map((key) => (
                              <TableCell
                                key={key}
                                sx={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  backgroundColor: '#fafafa',
                                }}
                              >
                                {key}
                              </TableCell>
                            ))}
                          <TableCell
                            sx={{
                              fontSize: 12,
                              fontWeight: 600,
                              backgroundColor: '#fafafa',
                            }}
                          >
                            …
                          </TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {previewData.map((row, idx) => (
                          <TableRow key={idx} hover>
                            {Object.values(row)
                              .slice(0, 5)
                              .map((val, i) => (
                                <TableCell
                                  key={i}
                                  sx={{
                                    fontSize: 11,
                                    whiteSpace: 'nowrap',
                                    maxWidth: 160,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {String(val)}
                                </TableCell>
                              ))}
                            <TableCell sx={{ fontSize: 11 }}>…</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 200,
                    border: '1px dashed #ddd',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    color: 'text.secondary',
                  }}
                >
                  <Typography variant="body2">
                    No data to preview
                  </Typography>
                  <Typography variant="caption">
                    Upload an Excel file to see preview
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* Message */}
      {message && (
        <Alert severity={message.includes('✓') ? 'success' : 'info'} sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}

      {/* Upload History */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        Upload History
      </Typography>
      <Box
        sx={{
          backgroundColor: '#fff',
          borderRadius: 3,
          p: 2,
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}
      >

        <DataGrid
          rows={uploadHistory}
          columns={columns}

          pagination
          pageSizeOptions={[10]}   // 👈 only 10 rows allowed

          initialState={{
            pagination: {
              paginationModel: {
                page: 0,
                pageSize: 10,
              },
            },
          }}

          disableSelectionOnClick
          disableColumnMenu
          disableColumnFilter
          hideFooterSelectedRowCount

          rowHeight={52}
          headerHeight={48}

          sx={{
            border: '1px solid #eaeaea',
            backgroundColor: '#ffffff',

            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#fafafa',
              borderBottom: '1px solid #e0e0e0',
              fontWeight: 600,
              fontSize: 15,
            },

            '& .MuiDataGrid-row': {
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #f0f0f0',
            },

            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#f5f8ff',
            },

            '& .MuiDataGrid-cell': {
              borderBottom: 'none',
              fontSize: 16,
              color: '#333',
              display: 'flex',
              alignItems: 'center',
            },

            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
              outline: 'none',
            },

            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid #eaeaea',
              minHeight: 44,
            },
          }}
        />


      </Box>
    </Container>
  );
};

export default WarrantyEntry;
