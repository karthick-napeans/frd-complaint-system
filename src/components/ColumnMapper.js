import React, { useEffect, useRef, useState } from "react";
import {
  Box,
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
  InputLabel, Snackbar, Slide
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import SaveIcon from "@mui/icons-material/Save";
import * as XLSX from "xlsx";
import { useSelector } from "react-redux";
import { getMstColumns, submitColumnMapping, getCustomerColumnMapping } from "../api/pageApi";


const WarrantyColumnMapper = () => {
  const { customers } = useSelector((state) => state.masters);
  const activeCustomers = customers.filter((c) => c.IsActive === true);
  const ROW_HEIGHT = 56;
  const [customerSelected, setCustomerSelected] = useState("");
  const [customerColumns, setCustomerColumns] = useState([]);
  const [masterColumns, setMasterColumns] = useState([]);
  const [mappings, setMappings] = useState({});
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [selectedMaster, setSelectedMaster] = useState(null);
  const [existingMappings, setExistingMappings] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [popup, setPopup] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchMasterColumns = async () => {
      try {
        const data = await getMstColumns();
        const cols = Array.isArray(data)
          ? data
            .filter((c) => c.IsActive)
            .sort((a, b) => a.MasterColumnPosition - b.MasterColumnPosition)
            .map((c) => ({
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

  useEffect(() => {
    if (
      existingMappings.length === 0 ||
      masterColumns.length === 0 ||
      customerColumns.length === 0
    )
      return;

    const newMappings = {};

    existingMappings.forEach((map) => {
      const master = masterColumns.find(
        (m) => m.name === map.MasterColumnName,
      );

      const customerExists = customerColumns.includes(
        map.CustomerColumnName,
      );

      if (master && customerExists) {
        newMappings[map.CustomerColumnName] = {
          masterColumnId: master.id,
          masterColumnName: master.name,
        };
      }
    });

    setMappings(newMappings);
  }, [existingMappings, masterColumns, customerColumns]);

  const handleCustomerSelect = async (customerId) => {
    setCustomerSelected(customerId);
    setCustomerColumns([]);
    setMappings({});
    setUploadedFile(null);

    if (!customerId) return;

    try {
      const res = await getCustomerColumnMapping(customerId);

      const data = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [res];

      const activeMappings = data.filter(x => x.IsActive);

      setExistingMappings(activeMappings);

      // ✅ populate customer columns immediately from saved mappings
      const customerColsFromAPI = activeMappings.map(
        (x) => x.CustomerColumnName
      );

      setCustomerColumns(customerColsFromAPI);

    } catch (error) {
      console.error(error);
      setExistingMappings([]);
      setCustomerColumns([]);
    }
  };

  const handleUploadClick = () => fileInputRef.current.click();

  const showPopup = (message, severity = "success") => {
    setPopup({ open: true, message, severity });
  };

  const SlideTransition = (props) => {
    return <Slide {...props} direction="left" />;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !customerSelected) return;

    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const headers = rows[0]?.filter(Boolean) || [];

      setCustomerColumns(headers);

      // ❌ remove this
      // setMappings({});

      showPopup("File loaded successfully", "success");
    };

    reader.readAsBinaryString(file);
  };

  const handleDragStart = (col) => setDraggedColumn(col);


  const handleDropOnMaster = (masterCol) => {
    if (!draggedColumn) return;

    const alreadyMapped = Object.values(mappings).some(
      (m) => m?.masterColumnId === masterCol.id,
    );
    if (alreadyMapped) {
      showPopup(`${masterCol.name} already mapped`, "error");
      return;
    }

    setMappings((prev) => ({
      ...prev,
      [draggedColumn]: {
        masterColumnId: masterCol.id,
        masterColumnName: masterCol.name,
      },
    }));

    setDraggedColumn(null);
  };

  const handleSelectMapping = (col) => {
    setDraggedColumn(col);
    setOpenDialog(true);
  };

  const handleConfirmMapping = () => {
    if (!selectedMaster || !draggedColumn) return;

    setMappings((prev) => ({
      ...prev,
      [draggedColumn]: {
        masterColumnId: selectedMaster.id,
        masterColumnName: selectedMaster.name,
      },
    }));
    setOpenDialog(false);
    setDraggedColumn(null);
    setSelectedMaster(null);
  };

  const handleRemoveMapping = (customerCol) => {
    const updated = { ...mappings };
    delete updated[customerCol];
    setMappings(updated);
  };

  const handleSaveMapping = async () => {
    if (!customerSelected) {
      showPopup("Select customer first", "error");
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
      showPopup("No mappings to save", "error");
      return;
    }

    try {
      await submitColumnMapping(payload);

      // ✅ SUCCESS MESSAGE
      showPopup("✓ Mapping saved successfully", "success");

      // ✅ RESET EVERYTHING
      setCustomerSelected("");
      setCustomerColumns([]);
      setMappings({});
      setUploadedFile(null);

      // ✅ CLEAR FILE INPUT
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (e) {
      console.error(e);
      showPopup("Server error while saving", "error");
    }
  };

  return (
    <Box >
      <Typography variant="h5" fontWeight="bold" mb={3} sx={{ color: "#3b3b3b" }}>
        Master Excel Template Mapper
      </Typography>

      {/* ================= CONFIGURATION ================= */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
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
            </Grid>

            <Grid item xs={12} md={6} sx={{ display: "flex", alignItems: "center", gap: 1 }}>

              <Box
                sx={{
                  flex: 1,
                  height: 56,
                  border: "1px solid #1976d2",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                  cursor: customerSelected ? "pointer" : "not-allowed",
                  background: customerSelected
                    ? "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)"
                    : "#f5f5f5",
                  transition: "0.3s",
                  "&:hover": {
                    background: customerSelected
                      ? "linear-gradient(135deg, #bbdefb 0%, #ffffff 100%)"
                      : "#f5f5f5",
                  },
                }}
                onClick={customerSelected ? handleUploadClick : undefined}
              >
                <UploadFileIcon
                  sx={{
                    fontSize: 20,
                    color: customerSelected ? "#1976d2" : "#9e9e9e",
                  }}
                />

                <Typography fontWeight={600} fontSize={14}>
                  {uploadedFile ? uploadedFile.name : "Upload Excel Template"}
                </Typography>

                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                />
              </Box>

              {uploadedFile && (
                <IconButton
                  size="small"
                  color="error"
                  sx={{
                    height: 32,
                    width: 32,
                    border: "1px solid #f44336",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFile(null);
                    setCustomerColumns([]);
                    setMappings({});
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
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
                      height: ROW_HEIGHT,
                      minHeight: ROW_HEIGHT,
                      p: 1.5,
                      my: 1,
                      border: "2px solid #1976d2",
                      borderRadius: 1,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
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
                    ([_, m]) => m?.masterColumnId === col.id,
                  )?.[0];

                  return (
                    <Box
                      key={col.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDropOnMaster(col)}
                      sx={{
                        height: ROW_HEIGHT,
                        minHeight: ROW_HEIGHT,
                        p: 1.5,
                        my: 1,
                        border: "2px dashed #1976d2",
                        borderRadius: 1,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
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
                    <TableCell align="center">
                      <b>S.No</b>
                    </TableCell>

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
                    ([customerCol, master], index) => (
                      <TableRow key={customerCol}>

                        {/* ✅ Serial Number */}
                        <TableCell align="center">
                          {index + 1}
                        </TableCell>

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

      {/* ================= DIALOG ================= */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth>
        <DialogTitle>Map {draggedColumn}</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Master Column"
            value={selectedMaster?.id || ""}
            onChange={(e) => {
              const found = masterColumns.find(
                (m) => m.id === Number(e.target.value),
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
        autoHideDuration={3500}
        onClose={() =>
          setPopup((prev) => ({ ...prev, open: false }))
        }
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        TransitionComponent={SlideTransition}
      >
        <Alert
          severity={popup.severity}
          variant="filled"
          elevation={6}
          onClose={() =>
            setPopup((prev) => ({ ...prev, open: false }))
          }
          sx={{
            minWidth: 320,
            borderRadius: 3,
            fontWeight: 500,
            fontSize: "0.95rem",
            alignItems: "center",
            boxShadow:
              "0 10px 25px rgba(0,0,0,0.15)",
            backdropFilter: "blur(6px)",
            "& .MuiAlert-icon": {
              fontSize: 22,
            },
          }}
        >
          {popup.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WarrantyColumnMapper;
