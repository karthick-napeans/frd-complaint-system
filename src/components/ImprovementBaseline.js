import React, { useState } from "react";
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
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

const ImprovementBaselinePage = () => {
    const [config, setConfig] = useState({
        lastImprovementDate: "",
        improvementDescription: "",
    });

    const [rows, setRows] = useState([
        {
            id: 1,
            date: "2024-01",
            description: "Process improvement in assembly line",
        },
    ]);
    return (
        <Box >

            <Typography variant="h5" fontWeight={700} mb={2}>
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
                            <Typography variant="caption" color="text.secondary">
                                Active reference for trend analysis
                            </Typography>
                        </Box>

                        <Chip label="ACTIVE" size="small" />
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
                            />
                        </Grid>
                    </Grid>

                    <Stack direction="row" justifyContent="flex-end" mt={2}>
                        <Button variant="contained">
                            Save Configuration
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

                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() =>
                                setRows([
                                    ...rows,
                                    {
                                        id: Date.now(),
                                        date: "",
                                        description: "",
                                    },
                                ])
                            }
                        >
                            Add
                        </Button>
                    </Box>

                    <DataGrid
                        autoHeight
                        rows={rows}
                        columns={[
                            {
                                field: "date",
                                headerName: "Improvement Date",
                                flex: 1,
                                editable: true,
                            },
                            {
                                field: "description",
                                headerName: "Description",
                                flex: 2,
                                editable: true,
                            },
                            {
                                field: "actions",
                                headerName: "Actions",
                                width: 120,
                                renderCell: (params) => (
                                    <Stack direction="row" spacing={1}>
                                        <EditIcon
                                            sx={{ cursor: "pointer" }}
                                            color="primary"
                                        />
                                        <DeleteIcon
                                            sx={{ cursor: "pointer" }}
                                            color="error"
                                            onClick={() =>
                                                setRows(rows.filter((r) => r.id !== params.id))
                                            }
                                        />
                                    </Stack>
                                ),
                            },
                        ]}
                        pageSizeOptions={[5, 10]}
                        disableRowSelectionOnClick
                        processRowUpdate={(newRow) => {
                            setRows((prev) =>
                                prev.map((r) => (r.id === newRow.id ? newRow : r))
                            );
                            return newRow;
                        }}
                    />
                </CardContent>
            </Card>
        </Box>
    );
};

export default ImprovementBaselinePage;

