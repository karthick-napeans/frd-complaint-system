import React, { useState } from 'react';
import { Box, Container, TextField, Button, Typography, Card, CardContent, Grid, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';

const BulkUpload = ({ userRole }) => {
  const [uploadType, setUploadType] = useState('repair');
  const [file, setFile] = useState(null);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const workbook = XLSX.read(event.target.result, { type: 'binary' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(sheet).slice(0, 5); // Preview first 5 rows
          setPreview(data);
        } catch (err) {
          setMessage('Error reading file: ' + err.message);
        }
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        // Validate based on template
        const isValid = validateTemplate(data, uploadType);
        if (!isValid) {
          setMessage('File does not match required template. Please download the template and try again.');
          return;
        }

        // Add to upload history
        const newUpload = {
          id: uploadHistory.length + 1,
          filename: file.name,
          type: uploadType === 'repair' ? 'Repair' : 'DRE',
          uploadedBy: 'currentUser',
          uploadDate: new Date().toISOString().split('T')[0],
          status: 'Success',
          recordsProcessed: data.length,
        };
        setUploadHistory([...uploadHistory, newUpload]);
        setMessage(`Successfully uploaded ${data.length} records from ${file.name}`);
        setFile(null);
        setPreview(null);
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      setMessage('Upload failed: ' + err.message);
    }
  };

  const validateTemplate = (data, type) => {
    // Implement validation logic based on template requirements
    if (type === 'repair') {
      return data.every(row => row.CustomerName && row.ModelCode && row.PartNumber);
    } else {
      return data.every(row => row.CaseID && row.DREDescription);
    }
  };

  const downloadTemplate = () => {
    const template = uploadType === 'repair'
      ? [['CustomerName', 'ModelCode', 'PartNumber', 'SerialNumber', 'RepairCause', 'RepairDate', 'Status']]
      : [['CaseID', 'DREDescription', 'DesignReview', 'FeasibilityReview', 'ReviewDate', 'ReviewedBy']];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `${uploadType}_template.xlsx`);
  };

  const downloadFile = (upload) => {
    // Implement actual file download logic
    console.log('Downloading:', upload.filename);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Bulk Data Upload
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6">Upload Data</Typography>

                <TextField
                  select
                  label="Upload Type"
                  value={uploadType}
                  onChange={(e) => {
                    setUploadType(e.target.value);
                    setFile(null);
                    setPreview(null);
                  }}
                  SelectProps={{ native: true }}
                  fullWidth
                >
                  <option value="repair">Repair Data</option>
                  <option value="dre">DRE Data</option>
                </TextField>

                <Button
                  variant="outlined"
                  onClick={downloadTemplate}
                  startIcon={<DownloadIcon />}
                  fullWidth
                >
                  Download {uploadType === 'repair' ? 'Repair' : 'DRE'} Template
                </Button>

                <Button
                  component="label"
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                >
                  Select Excel File
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    hidden
                    onChange={handleFileSelect}
                  />
                </Button>

                {file && (
                  <Alert severity="info">
                    Selected: <strong>{file.name}</strong>
                  </Alert>
                )}

                {message && (
                  <Alert severity={message.includes('Success') || message.includes('Successfully') ? 'success' : 'error'}>
                    {message}
                  </Alert>
                )}

                <Button
                  variant="contained"
                  color="success"
                  onClick={handleUpload}
                  disabled={!file}
                  fullWidth
                >
                  Upload File
                </Button>

                {preview && (
                  <Button
                    variant="outlined"
                    onClick={() => setOpenPreview(true)}
                    fullWidth
                  >
                    Preview Data ({preview.length} rows)
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Upload Guidelines
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>File format must be Excel (.xlsx or .xls)</li>
                <li>Download the template before uploading</li>
                <li>Ensure all required columns are present</li>
                <li>No empty rows allowed in the data</li>
                <li>Maximum file size: 10 MB</li>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upload History */}
      <Typography variant="h5" fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
        Upload History
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>Filename</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Uploaded By</strong></TableCell>
              <TableCell><strong>Upload Date</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Records</strong></TableCell>
              <TableCell><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {uploadHistory.map((upload) => (
              <TableRow key={upload.id}>
                <TableCell>{upload.filename}</TableCell>
                <TableCell>
                  <Chip label={upload.type} variant="outlined" />
                </TableCell>
                <TableCell>{upload.uploadedBy}</TableCell>
                <TableCell>{upload.uploadDate}</TableCell>
                <TableCell>
                  <Chip label={upload.status} color="success" variant="filled" />
                </TableCell>
                <TableCell>{upload.recordsProcessed}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    title="Download"
                    onClick={() => downloadFile(upload)}
                  >
                    <DownloadIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Preview Dialog */}
      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md" fullWidth>
        <DialogTitle>Data Preview</DialogTitle>
        <DialogContent>
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  {preview && Object.keys(preview[0]).map((key) => (
                    <TableCell key={key}><strong>{key}</strong></TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {preview && preview.map((row, idx) => (
                  <TableRow key={idx}>
                    {Object.values(row).map((val, i) => (
                      <TableCell key={i}>{val}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BulkUpload;
