import React, { useState, useEffect, useMemo } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Grid,
    Chip,
    Stack, MenuItem
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import ConfirmDialog from "./ConfirmDialog";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSelector, useDispatch } from "react-redux";
import { loadMasters } from "../store/masterSlice";
import { saveImprovementBaseline, getAllImprovementList, deleteImprovementBaseline } from "../api/pageApi";

const ImprovementBaselinePage = () => {
    const dispatch = useDispatch();
    const { models, customers } = useSelector((state) => state.masters);
    const activeModels = models?.filter(m => m.IsActive);
    const activeCustomers = customers?.filter(c => c.IsActive === true) || [];
    const [config, setConfig] = useState({
        lastImprovementDate: new Date().toISOString().split("T")[0],
        customerId: "",
        modelId: "",
        improvementDescription: "",
    })
    const [confirmState, setConfirmState] = useState({
        open: false,
        title: "",
        message: "",
        successMessage: "",
        errorMessage: "",
        onConfirm: null
    });
    const [selectedModel, setSelectedModel] = useState("");
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [rawRows, setRawRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [paginationModel, setPaginationModel] = React.useState({
        page: 0,
        pageSize: 10,
    });

    const formattedRows = useMemo(() => {
        return rawRows.map(item => {
            const customerObj = customers?.find(c => c.CustomerId == item.CustomerId);
            return {
                id: item.ImprovementId,
                rawDate: item.ImprovementDate,   // 🔥 keep original
                date: new Date(item.ImprovementDate)
                    .toLocaleDateString("en-GB")
                    .replace(/\//g, "-"),
                customer: item.CustomerName || customerObj?.CustomerName || "-",
                model: item.ModelName,
                description: item.Details,
            };
        }).sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
    }, [rawRows, customers]);

    useEffect(() => {
        dispatch(loadMasters());
        fetchImprovementList();
    }, [dispatch]);

    const fetchImprovementList = async () => {
        try {
            setLoading(true);
            const res = await getAllImprovementList();
            setRawRows(res || []);
        } catch (err) {
            console.error("Error fetching improvement list", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (row) => {
        setConfirmState({
            open: true,
            title: "Delete Improvement",
            message: `Are you sure you want to delete this improvement record dated ${row.date}?`,
            successMessage: "Improvement deleted successfully.",
            errorMessage: "Failed to delete improvement.",
            onConfirm: () => confirmDeleteImprovement(row)
        });
    };

    const confirmDeleteImprovement = async (row) => {
        console.log("Delete Activated");
        console.log("Full Row:", row);

        const payload = {
            ImprovementId: row.id,
            ImprovementDate: row.date,
            Details: row.description,
        };

        console.log("Sending Payload:", payload);

        const res = await deleteImprovementBaseline(payload);

        console.log("Delete response:", res);

        await fetchImprovementList();
    };

    const handleCancelDelete = () => {
        setConfirmState(prev => ({ ...prev, open: false }));
    };

    const handleCreate = async () => {
        const newErrors = {};

        if (!config.customerId) {
            newErrors.customerId = "Customer selection is required";
        }

        if (!config.modelId) {
            newErrors.modelId = "Model selection is required";
        }

        if (!config.improvementDescription?.trim()) {
            newErrors.improvementDescription = "Description is required";
        }


        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setSaving(true);

            const payload = {
                ImprovementDate: config.lastImprovementDate,
                CustomerId: Number(config.customerId),
                ModelId: config.modelId,
                Details: config.improvementDescription,
            };
            console.log("Creating improvement with payload:", payload);
            await saveImprovementBaseline(payload);

            setConfig({
                lastImprovementDate: new Date().toISOString().split("T")[0],
                customerId: "",
                modelId: "",
                improvementDescription: "",
            });

            await fetchImprovementList();

            setErrors({});

        } catch (error) {
            console.error("Error saving baseline:", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box >
            <Typography variant="h5" fontWeight={700} mb={2} sx={{ color: "#3b3b3b" }}>
                Improvement Baseline Configuration
            </Typography>

            <Card sx={{ mb: 3, borderRadius: 3 }}>
                <CardContent>

                    {/* Header */}
                    <Typography
                        variant="h6"
                        fontWeight={600}
                        mb={3}
                        color="primary"
                    >
                        Create New Improvement Record
                    </Typography>

                    {/* Form */}
                    <Grid container spacing={3}>

                        {/* Customer */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Select Customer"
                                value={config.customerId || ""}
                                onChange={(e) =>
                                    setConfig({ ...config, customerId: e.target.value })
                                }
                                error={!!errors.customerId}
                                helperText={errors.customerId}
                            >
                                <MenuItem value="">
                                    <em>Select Customer</em>
                                </MenuItem>

                                {activeCustomers?.map((customer) => (
                                    <MenuItem key={customer.CustomerId} value={customer.CustomerId}>
                                        {customer.CustomerName}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        {/* Model */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Select Model"
                                value={config.modelId || ""}
                                onChange={(e) =>
                                    setConfig({ ...config, modelId: e.target.value })
                                }
                                error={!!errors.modelId}
                                helperText={errors.modelId}
                            >
                                <MenuItem value="">
                                    <em>Select Model</em>
                                </MenuItem>

                                {activeModels?.map((model) => (
                                    <MenuItem key={model.ModelId} value={model.ModelId}>
                                        {model.ModelCode} - {model.ModelName}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        {/* Date */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                type="date"
                                fullWidth
                                size="small"
                                label="Improvement Date"
                                InputLabelProps={{ shrink: true }}
                                value={config.lastImprovementDate}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        lastImprovementDate: e.target.value,
                                    })
                                }
                                error={!!errors.lastImprovementDate}
                                helperText={errors.lastImprovementDate}
                            />
                        </Grid>

                        {/* Description */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Description"
                                multiline
                                rows={3}
                                value={config.improvementDescription}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        improvementDescription: e.target.value,
                                    })
                                }
                                error={!!errors.improvementDescription}
                                helperText={errors.improvementDescription}
                            />
                        </Grid>
                    </Grid>

                    {/* Save Button */}
                    <Stack direction="row" justifyContent="flex-end" mt={3}>
                        <Button
                            variant="contained"
                            size="medium"
                            onClick={handleCreate}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save Configuration"}
                        </Button>
                    </Stack>

                </CardContent>
            </Card>


            {/* DATA GRID */}
            <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 2,
                        }}
                    >
                        <Typography fontWeight={600}>
                            Improvement History
                        </Typography>


                    </Box>

                    <DataGrid
                        autoHeight
                        loading={loading}
                        rows={formattedRows}
                        columns={[
                            {
                                field: "sno",
                                headerName: "S.No",
                                width: 90,
                                sortable: false,
                                filterable: false,
                                align: "center",
                                headerAlign: "center",
                                renderCell: (params) => {
                                    const page = paginationModel.page;
                                    const pageSize = paginationModel.pageSize;
                                    const rowIndex =
                                        params.api.getRowIndexRelativeToVisibleRows(params.id);

                                    return page * pageSize + rowIndex + 1;
                                },
                            },
                            {
                                field: "date",
                                headerName: "Improvement Date",
                                flex: 1,
                                minWidth: 180,
                                editable: false,
                                align: "center",
                                headerAlign: "center",
                            },
                            {
                                field: "customer",
                                headerName: "Customer",
                                flex: 1.5,
                                minWidth: 200,
                                editable: false,
                                align: "center",
                                headerAlign: "center",
                            },
                            {
                                field: "model",
                                headerName: "Model",
                                flex: 1.5,
                                minWidth: 220,
                                editable: false,
                                align: "center",
                                headerAlign: "center",
                            },
                            {
                                field: "description",
                                headerName: "Description",
                                flex: 2,
                                minWidth: 280,
                                editable: false,
                                align: "center",
                                headerAlign: "center",
                            },
                            {
                                field: "actions",
                                headerName: "Actions",
                                width: 120,
                                sortable: false,
                                align: "center",
                                headerAlign: "center",
                                renderCell: (params) => (
                                    <Box
                                        sx={{
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        <DeleteIcon
                                            sx={{ cursor: "pointer" }}
                                            color="error"
                                            onClick={() => handleDelete(params.row)}
                                        />
                                    </Box>
                                ),
                            }
                        ]}
                        pagination
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        pageSizeOptions={[10, 20, 50]}

                        disableRowSelectionOnClick
                        disableColumnResize
                        disableColumnSorting

                        sx={{
                            border: "none",
                            "& .MuiDataGrid-columnHeaders": {
                                backgroundColor: "#f1f5f9",
                                fontWeight: 700,
                            },
                            "& .MuiDataGrid-row:hover": {
                                backgroundColor: "#f8fafc",
                            },
                            "& .MuiDataGrid-cell": {
                                alignItems: "center",
                            },
                        }}
                    />
                </CardContent>

                <ConfirmDialog
                    open={confirmState.open}
                    title={confirmState.title}
                    message={confirmState.message}
                    successMessage={confirmState.successMessage}
                    errorMessage={confirmState.errorMessage}
                    onConfirm={confirmState.onConfirm}
                    onCancel={handleCancelDelete}
                />
            </Card>
        </Box>
    );
};

export default ImprovementBaselinePage;

