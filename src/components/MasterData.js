import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { loadMasters } from "../store/masterSlice";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip, Alert,
  IconButton, Checkbox, FormControlLabel
} from "@mui/material";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { DataGrid } from "@mui/x-data-grid";
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ConfirmDialog from "./ConfirmDialog";

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
  nature: "NatureCodeId",
  attachment: "Id",
  defect: "DefectId",
};

const MASTER_LABEL = {
  customer: "Customer",
  model: "Model",
  part: "Part",
  cause: "Cause Code",
  nature: "Nature Code",
  attachment: "Checklist Attachment",
  defect: "Defect",
};

const MASTER_FORM_CONFIG = {
  customer: [
    {
      name: "CustomerCode",
      label: "Customer Code",
      required: true,
      pattern: /^[a-zA-Z0-9 ]+$/,
      patternMessage: "Special characters are not allowed",
    },
    {
      name: "CustomerName",
      label: "Customer Name",
      required: true,
      pattern: /^[a-zA-Z0-9 ]+$/,
      patternMessage: "Special characters are not allowed",
    },
  ],

  model: [
    {
      name: "ModelName",
      label: "Model Name",
      required: true,
      pattern: /^[A-Za-z0-9 ]+$/,
      patternMessage: "Special characters are not allowed",
    },
  ],

  part: [
    {
      name: "PartNumber",
      label: "Part Number",
      required: true,
      pattern: /^[A-Za-z0-9 \-_]+$/,
      patternMessage: "Special characters are not allowed",
    },
    {
      name: "PartName",
      label: "Part Name",
      required: true,
      pattern: /^[A-Za-z0-9 \-_]+$/,
      patternMessage: "Special characters are not allowed",
    },
  ],

  cause: [
    {
      name: "Code",
      label: "Cause Code",
      required: true,
      pattern: /^[A-Za-z0-9 ]+$/,
      patternMessage: "Special characters are not allowed",
    },
    {
      name: "CodeDescription",
      label: "Description",
      multiline: true,
      required: true,
    },
  ],

  nature: [
    {
      name: "Code",
      label: "Nature Code",
      required: true,
      pattern: /^[A-Za-z0-9 ]+$/,
      patternMessage: "Special characters are not allowed",
    },
    {
      name: "CodeDescription",
      label: "Description",
      multiline: true,
      required: true,
    },
  ],


  attachment: [
    {
      name: "Name",
      label: "Attachment Name",
      required: true,
      pattern: /^[A-Za-z0-9 ]+$/,
      patternMessage: "Special characters are not allowed",
    },
    {
      name: "IsMandatory",
      label: "Is Mandatory",
      type: "checkbox",
    },
  ],

  defect: [
    {
      name: "Defect",
      label: "Defect Name",
      required: true,
      pattern: /^[A-Za-z0-9 ]+$/,
      patternMessage: "Special characters are not allowed",
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
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    successMessage: "",
    errorMessage: "",
    onConfirm: null,
    actionLabel: "",
    loadingLabel: "",
    buttonColor: "",
    icon: null
  });

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    dispatch(loadMasters());
    fetchMasterData();
  }, [masterType]);

  const fetchMasterData = async () => {
    setLoading(true);

    try {
      const data = await getMasters(masterType);

      const sortedData = Array.isArray(data)
        ? [...data]

          .sort((a, b) => {
            const idKey = Object.keys(a).find(key =>
              key.toLowerCase().endsWith("id")
            );

            if (!idKey) return 0;

            return (b[idKey] || 0) - (a[idKey] || 0);
          })
        : [];

      setRows(sortedData);

    } catch (err) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingRow(null);
    setFormData({});
    setOpenDialog(true);
  };

  const validateMasterForm = () => {
    let tempErrors = {};

    MASTER_FORM_CONFIG[masterType].forEach((field) => {

      // skip checkbox validation
      if (field.type === "checkbox") return;

      const rawValue = formData[field.name];
      const value =
        typeof rawValue === "string"
          ? rawValue.trim()
          : rawValue !== undefined && rawValue !== null
            ? String(rawValue).trim()
            : "";

      // required validation
      // if (field.required && value.length === 0) {
      //   tempErrors[field.name] = `${field.label} is required`;
      //   return;
      // }

      // pattern validation
      if (field.pattern && value && !field.pattern.test(value)) {
        tempErrors[field.name] =
          field.patternMessage || "Invalid format";
      }
    });

    setErrors(tempErrors);

    return Object.keys(tempErrors).length === 0;
  };

  const handleEdit = (row) => {
    setEditingRow(row);
    setFormData(row);
    setOpenDialog(true);
  };

  const handleSave = async () => {
    const isValid = validateMasterForm();
    if (!isValid) return;

    setSaveLoading(true);
    setMessage("");

    try {
      if (editingRow) {
        const payload = { ...editingRow, ...formData };
        await updateMaster(masterType, payload);
        setSaveLoading(false);
        setMessage("✓ Updated successfully");
      } else {
        await createMaster(masterType, formData);
        setSaveLoading(false);
        setMessage("✓ Created successfully");
      }

      await fetchMasterData();
      await dispatch(loadMasters());

      setOpenDialog(false);
      setEditingRow(null);
      setFormData({});
      setErrors({});
    } catch (err) {
      console.error("❌ Save failed:", err);

      // ✅ Extract API message safely
      const apiMessage =
        err?.response?.data?.Message ||
        err?.response?.data?.message ||
        "Failed to save data";

      setMessage(apiMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleToggleStatus = (row) => {
    const idField = MASTER_ID_FIELD[masterType];
    const isCurrentlyActive = row.IsActive === true || row.IsActive === "true";
    const newStatus = !isCurrentlyActive;

    setConfirmState({
      open: true,
      title: `${newStatus ? "Activate" : "Deactivate"} ${MASTER_LABEL[masterType]}`,
      message: `Are you sure you want to ${newStatus ? "activate" : "deactivate"} ${row.Name || row.CustomerName || row.ModelName || row.PartNumber || row.Code || row.Defect}?`,
      successMessage: `Record ${newStatus ? "activated" : "deactivated"} successfully.`,
      errorMessage: `Failed to ${newStatus ? "activate" : "deactivate"} record. Please try again.`,
      actionLabel: newStatus ? "Activate" : "Deactivate",
      loadingLabel: "Processing...",
      buttonColor: newStatus ? "#4caf50" : "#ff6b6b",
      icon: newStatus ? <AddIcon sx={{ color: "#4caf50" }} /> : <DeleteOutlineIcon sx={{ color: "#ff6b6b" }} />,
      onConfirm: () => confirmToggleStatus(row[idField], newStatus)
    });
  };

  const confirmToggleStatus = async (id, newStatus) => {
    await deleteMaster(masterType, id, newStatus);
    await dispatch(loadMasters());
    await fetchMasterData();
  };

  const handleCancelDelete = () => {
    setConfirmState(prev => ({ ...prev, open: false }));
  };

  const StatusChip = ({ value }) => {
    const isActive = value === true || value === "true";
    return (
      <Chip
        label={isActive ? "Active" : "Inactive"}
        size="small"
        color={isActive ? "success" : "default"}
        sx={{ fontWeight: 600 }}
      />
    );
  };

  const actionColumn = {
    field: "actions",
    headerName: "Actions",
    width: 120,
    align: "center",
    sortable: false,
    renderCell: (params) => {
      const isCurrentlyActive = params.row.IsActive === true || params.row.IsActive === "true";
      return (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => handleEdit(params.row)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color={isCurrentlyActive ? "error" : "success"}
            onClick={() => handleToggleStatus(params.row)}
            title={isCurrentlyActive ? "Deactivate" : "Activate"}
          >
            {isCurrentlyActive ? <DeleteIcon fontSize="small" /> : <AddIcon fontSize="small" />}
          </IconButton>
        </Box>
      );
    },
  };

  const columnsMap = useMemo(() => {

    return {
      customer: [
        { field: "CustomerCode", headerName: "Customer Code", width: 180 },
        { field: "CustomerName", headerName: "Customer Name", width: 260 },
        {
          field: "IsActive",
          headerName: "Status",
          width: 120,
          renderCell: (p) => <StatusChip value={p.value} />,
        },
        { ...actionColumn, width: 120 },
      ],


      model: [
        { field: "ModelName", headerName: "Model Name", width: 440 },
        {
          field: "IsActive",
          headerName: "Status",
          width: 120,
          renderCell: (p) => <StatusChip value={p.value} />,
        },
        { ...actionColumn, width: 120 },
      ],



      part: [
        { field: "PartNumber", headerName: "Part Number", width: 200 },
        { field: "PartName", headerName: "Part Name", width: 240 },
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
        {
          field: "CodeDescription",
          headerName: "Description",
          width: 500,
          renderCell: (params) => (
            <Box sx={{ whiteSpace: "normal", lineHeight: "1.4", py: 1, textAlign: "left", width: "100%" }}>
              {params.value}
            </Box>
          ),
        },
        {
          field: "IsActive",
          headerName: "Status",
          width: 120,
          renderCell: (p) => <StatusChip value={p.value} />,
        },
        { ...actionColumn, width: 120 },
      ],

      nature: [
        { field: "Code", headerName: "Nature Code", width: 180 },
        {
          field: "CodeDescription",
          headerName: "Description",
          width: 500,
          renderCell: (params) => (
            <Box sx={{ whiteSpace: "normal", lineHeight: "1.4", py: 1, textAlign: "left", width: "100%" }}>
              {params.value}
            </Box>
          ),
        },
        {
          field: "IsActive",
          headerName: "Status",
          width: 120,
          renderCell: (p) => <StatusChip value={p.value} />,
        },
        { ...actionColumn, width: 120 },
      ],

      attachment: [
        { field: "Name", headerName: "Attachment Name", width: 250 },
        {
          field: "IsMandatory",
          headerName: "Is Mandatory",
          width: 150,
          renderCell: (p) => (p.value ? "Yes" : "No"),
        },
        {
          field: "IsActive",
          headerName: "Status",
          width: 120,
          renderCell: (p) => <StatusChip value={p.value} />,
        },
        { ...actionColumn, width: 120 },
      ],

      defect: [
        { field: "Defect", headerName: "Defect Name", width: 260 },
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
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: "#3b3b3b" }}>
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
            <option value="cause">Cause Code</option>
            <option value="nature">Nature Code</option>
            <option value="attachment">Checklist Attachment</option>
            <option value="defect">Defect</option>
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
              getRowHeight={masterType === 'cause' ? () => 'auto' : () => 70}
              pagination
              pageSizeOptions={[10, 20, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}

              disableRowSelectionOnClick
              disableColumnReorder
              disableColumnSorting
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



        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {MASTER_FORM_CONFIG[masterType].map((field) => {

            if (field.type === "checkbox") {
              return (
                <FormControlLabel
                  key={field.name}
                  sx={{ mt: 0.5 }}
                  control={
                    <Checkbox
                      checked={formData[field.name] || false}
                      onChange={(e) => {
                        const value = e.target.checked;

                        setFormData({
                          ...formData,
                          [field.name]: value,
                        });
                      }}
                    />
                  }
                  label={field.label}
                />
              );
            }

            return (
              <TextField
                key={field.name}
                label={`${field.label}${field.required ? "*" : ""}`}
                fullWidth
                size="small"
                multiline={field.multiline}
                sx={{ mt: 0.5 }}
                rows={field.multiline ? 3 : 1}
                value={formData[field.name] || ""}
                error={!!errors[field.name]}
                helperText={errors[field.name] || " "}
                onChange={(e) => {
                  const value = e.target.value;

                  setFormData({
                    ...formData,
                    [field.name]: value,
                  });

                  if (value) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors[field.name];
                      return newErrors;
                    });
                  }
                }}
              />
            );
          })}
        </DialogContent>

        {message && (
          <Alert severity={message.includes('✓') ? 'success' : 'info'} sx={{ mt: 1 }}>
            {message}
          </Alert>
        )}

        <DialogActions>
          <Button onClick={() => { setOpenDialog(false); setErrors({}); }} >Cancel</Button>
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
    </Box>
  );
};

export default MasterData;
