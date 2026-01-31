import React, { useState, useEffect, useMemo } from "react";
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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  getMasters,
  createMaster,
  updateMaster,
  deleteMaster,
} from "../api/masterApi";

/* ================= MASTER CONFIG ================= */

const MASTER_ID_FIELD = {
  customer: "CustomerId",
  model: "ModelId",
  part: "PartId",
  cause: "RepairCauseCodeId",
};

const MASTER_LABEL = {
  customer: "Customer",
  model: "Model",
  part: "Part",
  cause: "Repair Cause",
};

const MASTER_FORM_CONFIG = {
  customer: [
    { name: "CustomerName", label: "Customer Name" },
    { name: "CustomerCode", label: "Customer Code" },
  ],
  model: [
    { name: "ModelCode", label: "Model Code" },
    { name: "ModelName", label: "Model Name" },
  ],
  part: [
    { name: "PartNumber", label: "Part Number" },
    { name: "PartName", label: "Part Name" },
    {
      name: "PartDescription",
      label: "Description",
      multiline: true,
    },],
  cause: [
    { name: "Code", label: "Cause Code" },
    {
      name: "CodeDescription",
      label: "Description",
      multiline: true,
    },
  ],

};

/* ================= COMPONENT ================= */

const MasterData = ({ userRole = "Admin" }) => {
  const [masterType, setMasterType] = useState("customer");
  const [rows, setRows] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);


  /* ================= FETCH ================= */

  useEffect(() => {
    fetchMasterData();
  }, [masterType]);

  const fetchMasterData = async () => {
    setLoading(true); // 🔄 START LOADER
    try {
      const data = await getMasters(masterType);

      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setRows([]);
    } finally {
      setLoading(false); // ✅ STOP LOADER
    }
  };




  const handleOpenAdd = () => {
    setEditingRow(null);
    setFormData({});
    setOpenDialog(true);
  };

  const handleEdit = (row) => {
    setEditingRow(row);
    setFormData(row);
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingRow) {
        console.log("📝 UPDATE payload:", {
          ...editingRow,
          ...formData,
        });

        await updateMaster(masterType, {
          ...editingRow,
          ...formData,
        });

        console.log("✅ Update success");
      } else {
        console.log("🆕 CREATE payload:", formData);

        await createMaster(masterType, formData);

        console.log("✅ Create success");
      }

      await fetchMasterData();
      setOpenDialog(false);
      setEditingRow(null);
      setFormData({});
    } catch (err) {
      console.error("❌ Save failed:", err);
    }
  };

  const handleDelete = async (row) => {
    try {
      const idField = MASTER_ID_FIELD[masterType];
      console.log("🗑️ Delete clicked:", {
        masterType,
        idField,
        id: row[idField],
      });

      await deleteMaster(masterType, row[idField]);

      console.log("✅ Delete success");
      await fetchMasterData();
    } catch (err) {
      console.error("❌ Delete failed:", err);
    }
  };

  const StatusChip = ({ value }) => (
    <Chip
      label={value ? "Active" : "Inactive"}
      size="small"
      color={value ? "success" : "default"}
      sx={{ fontWeight: 600 }}
    />
  );

  const actionColumn = {
    field: "actions",
    headerName: "Actions",
    width: 120,
    align: "center",
    sortable: false,
    renderCell: (params) => (
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <IconButton
          size="small"
          onClick={() => handleEdit(params.row)}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={() => handleDelete(params.row)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    ),
  };

  const columnsMap = useMemo(() => {

    return {
      customer: [
        { field: "CustomerName", headerName: "Customer Name", width: 260 },
        { field: "CustomerCode", headerName: "Customer Code", width: 180 },
        {
          field: "IsActive",
          headerName: "Status",
          width: 120,
          renderCell: (p) => <StatusChip value={p.value} />,
        },
        { ...actionColumn, width: 120 },
      ],


      model: [
        { field: "ModelCode", headerName: "Model Code", width: 180 },
        { field: "ModelName", headerName: "Model Name", width: 260 },
        {
          field: "IsActive",
          headerName: "Status",
          width: 120,
          renderCell: (p) => <StatusChip value={p.value} />,
        },
        { ...actionColumn, width: 120 },
      ],



      part: [
        { field: "PartNumber", headerName: "Part Number", width: 180 },
        { field: "PartName", headerName: "Part Name", width: 220 },
        { field: "PartDescription", headerName: "Description", width: 300 },
        {
          field: "IsActive",
          headerName: "Status",
          width: 120,
          renderCell: (p) => <StatusChip value={p.value} />,
        },
        { ...actionColumn, width: 120 },
      ],


      cause: [
        { field: "Code", headerName: "Cause Code", width: 180 },
        { field: "CodeDescription", headerName: "Description", width: 320 },
        {
          field: "IsActive",
          headerName: "Status",
          width: 120,
          renderCell: (p) => <StatusChip value={p.value} />,
        },
        { ...actionColumn, width: 120 },
      ],


    };
  }, [masterType]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Master Data Management
        </Typography>

        {userRole !== "QC User" && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
          >
            Add {MASTER_LABEL[masterType]}
          </Button>
        )}
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <TextField
            select
            SelectProps={{ native: true }}
            label="Master Type"
            value={masterType}
            onChange={(e) => {
              console.log("🔀 Switching master type to:", e.target.value);
              setMasterType(e.target.value);
            }}
            sx={{ minWidth: 240 }}
          >
            <option value="customer">Customer</option>
            <option value="model">Model</option>
            <option value="part">Part</option>
            <option value="cause">Repair Cause</option>
          </TextField>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ height: 420 }}>
            <DataGrid
              rows={loading ? [] : rows}   // ⭐ KEY LINE
              columns={columnsMap[masterType].map((col) => ({
                ...col,
                editable: false,
                sortable: true,
                resizable: false,
              }))}
              getRowId={(row) => row[MASTER_ID_FIELD[masterType]]}

              loading={loading}

              disableRowSelectionOnClick
              disableColumnMenu
              disableColumnReorder

              pageSizeOptions={[10, 20, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}

              sx={{
                border: "none",
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#f5f7fa",
                  fontWeight: 700,
                  borderBottom: "1px solid #e0e0e0",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: 600,
                },
                "& .MuiDataGrid-row": {
                  cursor: "pointer",
                },
                "& .MuiDataGrid-cell": {
                  outline: "none !important",
                },
                "& .MuiDataGrid-footerContainer": {
                  borderTop: "1px solid #e0e0e0",
                },
              }}
            />

          </Box>
        </CardContent>
      </Card>

      {/* ================= ADD / EDIT DIALOG ================= */}

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingRow ? "Edit" : "Add"} {MASTER_LABEL[masterType]}
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {MASTER_FORM_CONFIG[masterType].map((field) => (
            <TextField
              key={field.name}
              label={field.label}
              fullWidth
              multiline={field.multiline}
              rows={field.multiline ? 3 : 1}
              value={formData[field.name] || ""}
              onChange={(e) => {
                console.log(
                  "✏️ Field change:",
                  field.name,
                  "=>",
                  e.target.value
                );
                setFormData({
                  ...formData,
                  [field.name]: e.target.value,
                });
              }}
            />
          ))}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingRow ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MasterData;
