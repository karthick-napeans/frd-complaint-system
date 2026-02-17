import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { loadMasters } from "../store/masterSlice";
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
  IconButton, DialogContentText
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import CircularProgress from '@mui/material/CircularProgress';
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
  const dispatch = useDispatch();
  const [masterType, setMasterType] = useState("customer");
  const [rows, setRows] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

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
    setSaveLoading(true);

    try {
      if (editingRow) {
        const payload = { ...editingRow, ...formData };
        await updateMaster(masterType, payload);
        await fetchMasterData();
      } else {
        await createMaster(masterType, formData);
        await fetchMasterData();
      }

      await dispatch(loadMasters());

      setOpenDialog(false);
      setEditingRow(null);
      setFormData({});
    } catch (err) {
      console.error("❌ Save failed:", err);
    } finally {
      setSaveLoading(false);
    }
  };


  const handleDelete = (row) => {
    setRowToDelete(row);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!rowToDelete) return;

    try {
      const idField = MASTER_ID_FIELD[masterType];

      await deleteMaster(masterType, rowToDelete[idField]);
      await fetchMasterData();
      await dispatch(loadMasters());

      console.log("✅ Delete success");
    } catch (err) {
      console.error("❌ Delete failed:", err);
    } finally {
      setConfirmOpen(false);
      setRowToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setRowToDelete(null);
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
          <Box >
            <DataGrid
              rows={loading ? [] : rows}

              columns={[
                {
                  field: "sno",
                  headerName: "S.No",
                  width: 80,
                  sortable: false,
                  align: "center",
                  headerAlign: "center",
                  renderCell: (params) => {
                    if (!params?.id) return "";

                    const index = rows.findIndex(
                      (row) =>
                        row[MASTER_ID_FIELD[masterType]] === params.id
                    );

                    return index >= 0 ? index + 1 : "";
                  },
                },
                ...columnsMap[masterType].map((col) => ({
                  ...col,
                  editable: false,
                  sortable: true,
                  resizable: false,
                })),
              ]}

              getRowId={(row) => row[MASTER_ID_FIELD[masterType]]}
              loading={loading}

              pagination
              pageSizeOptions={[10, 20, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}

              disableRowSelectionOnClick
              disableColumnMenu
              disableColumnReorder

              sx={{
                border: "none",

                /* center all headers */
                "& .MuiDataGrid-columnHeader": {
                  justifyContent: "center",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  textAlign: "center",
                  width: "100%",
                  fontWeight: 600,
                },

                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#f5f7fa",
                  fontWeight: 700,
                  borderBottom: "1px solid #e0e0e0",
                },

                "& .MuiDataGrid-row": {
                  cursor: "pointer",
                },

                "& .MuiDataGrid-cell": {
                  outline: "none !important",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                },

                "& .MuiDataGrid-footerContainer": {
                  borderTop: "1px solid #e0e0e0",
                },
                "& .MuiDataGrid-columnHeaderTitleContainer": {
                  justifyContent: "center",
                },

              }}
            />



          </Box>

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

        </CardContent>
      </Card>


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
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saveLoading}
            startIcon={
              saveLoading ? <CircularProgress size={18} color="inherit" /> : null
            }
          >
            {saveLoading
              ? (editingRow ? "Updating..." : "Saving...")
              : (editingRow ? "Update" : "Add")}
          </Button>

        </DialogActions>


      </Dialog>
    </Container>
  );
};

export default MasterData;
