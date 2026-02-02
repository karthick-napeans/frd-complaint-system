import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SaveIcon from '@mui/icons-material/Save';
import * as XLSX from 'xlsx';
import { useSelector } from 'react-redux';
import { getMstColumns, submitColumnMapping } from '../api/pageApi';
import Snackbar from '@mui/material/Snackbar';


const WarrantyColumnMapper = () => {
  const { customers } = useSelector(state => state.masters);

  const [customerSelected, setCustomerSelected] = useState('');
  const [customerColumns, setCustomerColumns] = useState([]);
  const [masterColumns, setMasterColumns] = useState([]);
  const [mappings, setMappings] = useState({});
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [selectedMaster, setSelectedMaster] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [popup, setPopup] = useState({
    open: false,
    message: '',
    severity: 'success', // success | error | info | warning
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  /* -------- Fetch master columns -------- */

  useEffect(() => {
    const fetchMasterColumns = async () => {
      try {
        const data = await getMstColumns();
        const cols = Array.isArray(data)
          ? data
            .filter(c => c.IsActive)
            .sort((a, b) => a.MasterColumnPosition - b.MasterColumnPosition)
            .map(c => ({
              id: c.MasterColumnId,
              name: c.MasterColumnName,
            }))
          : [];
        setMasterColumns(cols);
      } catch (e) {
        console.error(e);
        setMasterColumns([]);
      }
    };
    fetchMasterColumns();
  }, []);


  const handleCustomerSelect = (customerId) => {
    setCustomerSelected(customerId);
    setCustomerColumns([]);
    setMappings({});
    showPopup(`Selected customer ${customerId}. Upload Excel to continue.`);
  };


  const handleUploadClick = () => fileInputRef.current.click();

  const showPopup = (message, severity = 'success') => {
    setPopup({ open: true, message, severity });
  };


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !customerSelected) return;

    // ✅ Store file for upload + UI display
    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const headers = rows[0]?.filter(Boolean) || [];

      setCustomerColumns(headers);
      setMappings({});
      showPopup('Mapping saved successfully', 'success');
    };

    reader.readAsBinaryString(file);
  };


  /* -------- Drag & drop -------- */

  const handleDragStart = (col) => setDraggedColumn(col);

  const handleDropOnMaster = (masterCol) => {
    if (!draggedColumn) return;

    const alreadyMapped = Object.values(mappings).some(
      m => m?.masterColumnId === masterCol.id
    );
    if (alreadyMapped) {
      showPopup(`${masterCol.name} already mapped`, 'error');
      return;
    }

    setMappings(prev => ({
      ...prev,
      [draggedColumn]: {
        masterColumnId: masterCol.id,
        masterColumnName: masterCol.name,
      },
    }));

    showPopup(`✓ ${draggedColumn} → ${masterCol.name}`, 'success');
    setDraggedColumn(null);
  };

  /* -------- Dialog mapping -------- */

  const handleSelectMapping = (col) => {
    setDraggedColumn(col);
    setOpenDialog(true);
  };

  const handleConfirmMapping = () => {
    if (!selectedMaster || !draggedColumn) return;

    setMappings(prev => ({
      ...prev,
      [draggedColumn]: {
        masterColumnId: selectedMaster.id,
        masterColumnName: selectedMaster.name,
      },
    }));

    showPopup(`✓ ${draggedColumn} → ${selectedMaster.name}`, 'success');
    setOpenDialog(false);
    setDraggedColumn(null);
    setSelectedMaster(null);
  };

  /* -------- Remove mapping -------- */

  const handleRemoveMapping = (customerCol) => {
    const updated = { ...mappings };
    delete updated[customerCol];
    setMappings(updated);
  };

  /* -------- Save mapping -------- */

  const handleSaveMapping = async () => {
    if (!customerSelected) {
      showPopup('Select customer first', 'error');
      return;
    }

    const payload = {
      customerId: Number(customerSelected),
      mappings: Object.entries(mappings)
        .filter(([_, m]) => m?.masterColumnId)
        .map(([customerColumnName, m]) => ({
          masterColumnId: m.masterColumnId,
          masterColumnName: m.masterColumnName,
          customerColumnName,
        })),
    };

    if (!payload.mappings.length) {
      showPopup('No mappings to save', 'error');
      return;
    }

    try {
      await submitColumnMapping(payload);

      // ✅ SUCCESS MESSAGE
      showPopup('✓ Mapping saved successfully', 'success');

      // ✅ RESET EVERYTHING
      setCustomerSelected('');
      setCustomerColumns([]);
      setMappings({});
      setUploadedFile(null);

      // ✅ CLEAR FILE INPUT
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (e) {
      console.error(e);
      showPopup('❌ Server error while saving', 'error');
    }
  };


  /* -------- UI (UNCHANGED) -------- */

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Master Excel Template Mapper
      </Typography>

      {/* ================= CONFIGURATION ================= */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Customer</InputLabel>
                <Select
                  value={customerSelected}
                  label="Select Customer"
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                >
                  {customers.map((c) => (
                    <MenuItem key={c.CustomerId} value={c.CustomerId}>
                      {c.CustomerName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={handleUploadClick}
                disabled={!customerSelected}
              >
                Upload Excel
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
              />
              {uploadedFile && (
                <Typography
                  variant="body2"
                  sx={{
                    mt: 1,
                    color: 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  📄 {uploadedFile.name}
                </Typography>
              )}

            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ================= MAPPING AREA ================= */}
      {customerColumns.length > 0 && (
        <Grid container spacing={3}>
          {/* -------- Customer Columns -------- */}
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <Typography fontWeight="bold" mb={1}>
                  Customer Columns
                </Typography>

                {customerColumns.map((col) => (
                  <Box
                    key={col}
                    draggable
                    onDragStart={() => handleDragStart(col)}
                    sx={{
                      p: 1.5,
                      my: 1,
                      border: '2px solid #1976d2',
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box display="flex" gap={1} alignItems="center">
                      <DragIndicatorIcon fontSize="small" />
                      <Typography>{col}</Typography>
                    </Box>

                    {mappings[col] ? (
                      <Chip
                        label={mappings[col].masterColumnName}
                        size="small"
                        color="success"
                      />
                    ) : (
                      <Button
                        size="small"
                        onClick={() => handleSelectMapping(col)}
                      >
                        Map
                      </Button>
                    )}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* -------- Master Columns -------- */}
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent>
                <Typography fontWeight="bold" mb={1}>
                  Master Columns
                </Typography>

                {masterColumns.map((col) => {
                  const mappedFrom = Object.entries(mappings).find(
                    ([_, m]) => m?.masterColumnId === col.id
                  )?.[0];

                  return (
                    <Box
                      key={col.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDropOnMaster(col)}
                      sx={{
                        p: 1.5,
                        my: 1,
                        border: '2px dashed #1976d2',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography>{col.name}</Typography>

                      {mappedFrom && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleRemoveMapping(mappedFrom)}
                        >
                          Unmap
                        </Button>
                      )}
                    </Box>
                  );
                })}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ================= MAPPING SUMMARY ================= */}
      {Object.keys(mappings).length > 0 && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Mapping Summary
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <b>Customer Column</b>
                    </TableCell>
                    <TableCell>
                      <b>Master Column</b>
                    </TableCell>
                    <TableCell align="center">
                      <b>Action</b>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {Object.entries(mappings).map(
                    ([customerCol, master]) => (
                      <TableRow key={customerCol}>
                        <TableCell>
                          <Chip
                            label={customerCol}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>

                        <TableCell>
                          <Typography fontWeight={600}>
                            {master.masterColumnName}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Button
                            size="small"
                            color="error"
                            onClick={() =>
                              handleRemoveMapping(customerCol)
                            }
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* ================= SAVE ================= */}
      {Object.keys(mappings).length > 0 && (
        <Box mt={4} textAlign="center">
          <Button
            variant="contained"
            color="success"
            startIcon={<SaveIcon />}
            onClick={handleSaveMapping}
          >
            Save Mapping
          </Button>
        </Box>
      )}

      {/* ================= MESSAGE ================= */}
      {/* {message && (
        <Alert
          sx={{ mt: 3 }}
          severity={message.includes('✓') ? 'success' : 'info'}
        >
          {message}
        </Alert>
      )} */}

      {/* ================= DIALOG ================= */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth>
        <DialogTitle>Map {draggedColumn}</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Master Column"
            value={selectedMaster?.id || ''}
            onChange={(e) => {
              const found = masterColumns.find(
                (m) => m.id === Number(e.target.value)
              );
              setSelectedMaster(found);
            }}
          >
            <MenuItem value="">Select</MenuItem>
            {masterColumns.map((col) => (
              <MenuItem key={col.id} value={col.id}>
                {col.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmMapping}>
            Map
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={popup.open}
        autoHideDuration={3000}
        onClose={() => setPopup(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={popup.severity}
          variant="filled"
          onClose={() => setPopup(prev => ({ ...prev, open: false }))}
          sx={{ minWidth: 280 }}
        >
          {popup.message}
        </Alert>
      </Snackbar> 
    </Container>
  );
};

export default WarrantyColumnMapper;
