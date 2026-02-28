import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Grid,
    Chip,
    Stack,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import ConfirmDialog from "./ConfirmDialog";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { saveImprovementBaseline, getAllImprovementList, deleteImprovementBaseline } from "../api/pageApi";

const ImprovementBaselinePage = () => {
    const [config, setConfig] = useState({
        lastImprovementDate: new Date().toISOString().split("T")[0],
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
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [paginationModel, setPaginationModel] = React.useState({
        page: 0,
        pageSize: 10,
    });
    useEffect(() => {
        fetchImprovementList();
    }, []);

    const fetchImprovementList = async () => {
        try {
            setLoading(true);

            const res = await getAllImprovementList();

            const formattedRows = res
                .map(item => ({
                    id: item.ImprovementId,
                    rawDate: item.ImprovementDate,   // 🔥 keep original
                    date: new Date(item.ImprovementDate)
                        .toLocaleDateString("en-GB")
                        .replace(/\//g, "-"),           // DD-MM-YYYY
                    description: item.Details,
                }))
                // 🔥 Sort using raw date
                .sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

            setRows(formattedRows);

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

        if (!config.lastImprovementDate) {
            newErrors.lastImprovementDate = "Date is required";
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
                Details: config.improvementDescription,
            };

            await saveImprovementBaseline(payload);

            setConfig({
                lastImprovementDate: new Date().toISOString().split("T")[0],
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

            <Card sx={{ mb: 3, borderRadius: 2 }}>
                <CardContent>
                    {/* Header */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 2,
                        }}
                    >
                        <Box>
                            <Typography fontWeight={600}>
                                Improvement Baseline
                            </Typography>
                        </Box>
                    </Box>

                    {/* Form */}
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="caption" fontWeight={600}>
                                Improvement Date
                            </Typography>
                            <TextField
                                type="date"
                                fullWidth
                                size="small"
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

                        <Grid item xs={12} sm={6}>
                            <Typography variant="caption" fontWeight={600}>
                                Description
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                multiline
                                rows={2}
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

                    <Stack direction="row" justifyContent="flex-end" mt={2}>
                        <Button
                            variant="contained"
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
                        rows={rows}
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
                                editable: true,
                                align: "center",
                                headerAlign: "center",
                            },
                            {
                                field: "description",
                                headerName: "Description",
                                flex: 2,
                                minWidth: 300,
                                editable: true,
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

