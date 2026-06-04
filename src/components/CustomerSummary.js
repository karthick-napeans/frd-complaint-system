import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadMasters } from '../store/masterSlice';
import {
    Box,
    Container,
    Card,
    CardContent,
    Typography,
    Chip, Button, TextField, MenuItem, Grid

} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import * as XLSX from "xlsx";
import { getComplaintsList, deleteComplaint, downloadZip } from '../api/pageApi';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ClearIcon from '@mui/icons-material/Clear';
import { IconButton, Tooltip } from '@mui/material';
import TransformIcon from '@mui/icons-material/Transform';
import { Delete, Download } from '@mui/icons-material';
import ConfirmDialog from './ConfirmDialog';



const CustomerSummary = ({ userRole }) => {
    const dispatch = useDispatch();
    const { parts, models } = useSelector((state) => state.masters);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterPart, setFilterPart] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('');
    const [filterCause, setFilterCause] = useState('');
    const today = new Date().toISOString().split("T")[0];
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const lastMonth = lastMonthDate.toISOString().split("T")[0];
    const [fromDate, setFromDate] = useState(lastMonth);
    const [toDate, setToDate] = useState(today);
    const [confirmState, setConfirmState] = useState({
        open: false,
        complaintId: null
    });

    const [dateErrors, setDateErrors] = useState({
        fromDate: "",
        toDate: "",
    });

    const filteredRows = rows.filter((row) => {

        const matchPart =
            !filterPart || row.Part === filterPart;

        const matchStatus =
            !filterStatus || row.Status === filterStatus;

        const matchCause =
            !filterCause || row.CauseCode === filterCause;

        const matchSeverity =
            !filterSeverity || row.Severity === filterSeverity;

        const complaintDate = new Date(row.ComplaintDate);

        const matchFrom =
            !fromDate || complaintDate >= new Date(fromDate);

        const matchTo =
            !toDate || complaintDate <= new Date(toDate);

        return (
            matchPart &&
            matchCause &&
            matchStatus &&
            matchSeverity &&
            matchFrom &&
            matchTo
        );
    });

    const validateDates = (from, to) => {

        const errors = {
            fromDate: "",
            toDate: "",
        };

        const today = new Date().toISOString().split("T")[0];

        // if both empty → no error
        if (!from && !to) return errors;

        // future date validation
        if (from && from > today) {
            errors.fromDate = "Invalid Date";
        }

        if (to && to > today) {
            errors.toDate = "Invalid Date";
        }

        // range validation
        if (from && to && from > to) {
            errors.fromDate = "From date must be ≤ To date";
            errors.toDate = "To date must be ≥ From date";
        }

        return errors;
    };

    useEffect(() => {
        dispatch(loadMasters());
        fetchComplaints();
    }, [dispatch]);

    const fetchComplaints = async () => {
        try {
            setLoading(true);

            const response = await getComplaintsList(); // 👈 your API call

            // Add serial number
            const formattedData = response.map((item, index) => {
                let status = item.Status;
                if (status && (status.toUpperCase() === 'SUBMITED' || status.toUpperCase() === 'SUBMITTED')) {
                    status = 'Completed';
                }
                return {
                    ...item,
                    Status: status,
                    id: item.ComplaintId,
                    serialNo: index + 1
                };
            });

            setRows(formattedData);
        } catch (error) {
            console.error("Error fetching complaints:", error);
        } finally {
            setLoading(false);
        }
    };

    const normalizeRole = (role) =>
        role?.toLowerCase().replace(/[_\s]+/g, "");

    const isQCUser = normalizeRole(userRole) === "qcuser";

    const handleExportExcel = () => {
        const exportData = filteredRows.map((row) => ({
            "S.No": row.serialNo,
            "Complaint No": row.ComplaintNo,
            "Customer Name": row.CustomerName || row.CauseCode || "",
            "Internal Staff Email": row.CustomerEmail,
            "Complaint Date": row.ComplaintDate ? new Date(row.ComplaintDate).toLocaleDateString() : "",
            "Model": (() => {
                const model = models.find(m => m.ModelName === row.Model);
                return model ? `${model.ModelCode} - ${model.ModelName}` : row.Model || "";
            })(),
            "Part": (() => {
                const part = parts.find(p => p.PartNumber === row.Part);
                return part ? `${row.Part} - ${part.PartName}` : row.Part || "";
            })(),
            "Quantity": row.RepairCause || row.CauseCode || "",
            "Description": row.ProblemStatement,
            "4M": row["4M"] || row.FourM || row.fourM || "",
            "Defect": row.Defect || row.defect || "",
            "Severity": row.Severity,
            "Status": row.Status,
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Complaints");

        XLSX.writeFile(workbook, "Customer_Complaint_Summary.xlsx");
    };

    const columns = [
        {
            field: 'serialNo',
            headerName: 'S.No',
            width: 60,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'ComplaintNo',
            headerName: 'Complaint No',
            width: 170,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'CustomerName',
            headerName: 'Customer Name',
            width: 170,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (value, row) =>
                row.CustomerName || row.CauseCode || '',
        },
        {
            field: 'CustomerEmail',
            headerName: 'Internal Staff Email',
            width: 230,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => {
                const emails = params.value ? params.value.split(',') : [];

                return (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                            width: "100%",
                            height: "100%",
                            lineHeight: "1.6",
                        }}
                    >
                        {emails.map((email, index) => (
                            <div key={index}>{email.trim()}</div>
                        ))}
                    </div>
                );
            },
        },
        {
            field: 'ComplaintDate',
            headerName: 'Complaint Date',
            width: 120,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) =>
                params.value
                    ? new Date(params.value).toLocaleDateString()
                    : '',
        },
        {
            field: 'Model',
            headerName: 'Model',
            width: 250,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (value, row) => {
                const model = models.find(m => m.ModelName === row.Model);
                return model ? `${model.ModelCode} - ${model.ModelName}` : row.Model || '';
            }
        },
        {
            field: 'Part',
            headerName: 'Part',
            width: 200,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (value, row) => {
                const part = parts.find(p => p.PartNumber === row.Part);
                return part ? `${row.Part} - ${part.PartName}` : row.Part || '';
            }
        },
        {
            field: 'RepairCause',
            headerName: 'Quantity',
            width: 120,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (value, row) =>
                row.RepairCause || row.CauseCode || '',
        },
        {
            field: 'ProblemStatement',
            headerName: 'Description',
            width: 250,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'FourM',
            headerName: '4M',
            width: 120,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (value, row) =>
                row["4M"] || row.FourM || row.fourM || '',
        },
        {
            field: 'Defect',
            headerName: 'Defect',
            width: 150,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (value, row) =>
                row.Defect || row.defect || '',
        },
        {
            field: 'Severity',
            headerName: 'Severity',
            width: 100,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    color={
                        params.value === 'High'
                            ? 'error'
                            : params.value === 'Medium'
                                ? 'warning'
                                : 'success'
                    }
                    size="small"
                    sx={{ margin: '0 auto', color: '#fff' }}
                />
            ),
        },
        {
            field: 'Status',
            headerName: 'Status',
            width: 140,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => {
                const upperStatus = params.value ? params.value.toUpperCase() : '';
                let chipColor = 'default';
                let chipSx = { margin: '0 auto', color: '#fff' };

                if (upperStatus === 'DRAFT') {
                    chipSx = { ...chipSx, backgroundColor: '#f44336' }; // Light red background with white text
                } else if (upperStatus === 'OPEN') {
                    chipColor = 'info';
                } else if (upperStatus === 'CLOSED' || upperStatus === 'COMPLETED') {
                    chipColor = 'success';
                } else {
                    chipColor = 'warning';
                }

                return (
                    <Chip
                        label={params.value}
                        color={chipColor !== 'default' ? chipColor : undefined}
                        size="small"
                        sx={chipSx}
                    />
                );
            },
        },
        {
            field: 'actions',
            headerName: 'Action',
            width: 100,
            resizable: false,
            sortable: false,
            filterable: false,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => (
                <Tooltip title="Delete Complaint">
                    <IconButton
                        size="small"
                        sx={{ color: "#fc4343" }}
                        onClick={() => handleDelete(params.row)}
                    >
                        <Delete />
                    </IconButton>
                </Tooltip>
            ),
        },
        {
            field: 'Download',
            headerName: 'Download Zip',
            width: 130,
            resizable: false,
            sortable: false,
            filterable: false,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => (
                <Tooltip title="Download ZIP">
                    <IconButton
                        size="small"
                        sx={{ color: "#1860fc" }}
                        onClick={() => handleDownload(params.row)}
                    >
                        <Download />
                    </IconButton>
                </Tooltip>
            ),
        }
    ];

    const handleDelete = (row) => {
        setConfirmState({
            open: true,
            title: "Delete Complaint",
            message: `Are you sure you want to delete Complaint No: ${row.ComplaintNo}?`,
            successMessage: "Complaint deleted successfully.",
            errorMessage: "Failed to delete complaint. Please try again.",
            actionLabel: "Delete",
            loadingLabel: "Deleting...",
            buttonColor: "#ff6b6b",
            icon: <Delete sx={{ color: "#ff6b6b" }} />,
            onConfirm: () => confirmDelete(row.ComplaintId)
        });
    };

    const confirmDelete = async (complaintId) => {
        try {
            // Call your delete API here
            await deleteComplaint(complaintId);

            // Close confirmation dialog
            setConfirmState((prev) => ({
                ...prev,
                open: false,
            }));

            // Refresh grid data
            fetchComplaints();
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const handleCancelDelete = () => {
        setConfirmState((prev) => ({
            ...prev,
            open: false,
        }));
    };

    const handleDownload = async (row) => {
        try {
            console.log("⬇️ Downloading ZIP for:", row.ComplaintNo);

            // downloadZip already returns Blob directly
            const blob = await downloadZip(row.ComplaintId);

            console.log("📦 Blob:", blob);
            console.log("📌 Is Blob:", blob instanceof Blob);
            console.log("📏 Size:", blob?.size);
            console.log("📄 Type:", blob?.type);

            if (!blob || !(blob instanceof Blob)) {
                console.error("❌ Invalid Blob received");
                alert("Invalid ZIP file received.");
                return;
            }

            if (blob.size === 0) {
                console.error("❌ ZIP file is empty");
                alert("ZIP file is empty.");
                return;
            }

            // Create downloadable URL
            const url = window.URL.createObjectURL(blob);

            // Create temporary download link
            const link = document.createElement("a");
            link.href = url;
            link.download = `${row.ComplaintNo}.zip`;

            // Trigger download
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);

            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 1000);

            console.log("✅ ZIP downloaded successfully");
        } catch (error) {
            console.error("❌ Download failed:", error);
            alert("Unable to download ZIP file.");
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2

                }}
            >
                <Typography variant="h5" fontWeight={700} sx={{ color: "#3b3b3b" }}>
                    Customer Complaint Summary
                </Typography>

                <Button
                    variant="contained"
                    color="success"
                    startIcon={<FileDownloadIcon />}
                    onClick={handleExportExcel}
                    sx={{ borderRadius: 2 }}
                >
                    Export Excel
                </Button>
            </Box>

            {/* Filters Card */}
            <Card sx={{ mb: 3, borderRadius: 3 }}>
                <CardContent>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <FilterAltIcon sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight={600}>
                            Filters
                        </Typography>
                    </Box>

                    <Grid container spacing={2} alignItems="center">

                        {/* Part */}
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                select
                                label="Part"
                                fullWidth
                                value={filterPart}
                                onChange={(e) => setFilterPart(e.target.value)}
                            >
                                <MenuItem value="">All Parts</MenuItem>
                                {[...new Set(
                                    rows
                                        .map(r => r.Part)
                                        .filter(val => val && val.trim() !== "")
                                )]
                                    .sort((a, b) => a.localeCompare(b))
                                    .map((partNo) => {
                                        const partObj = parts.find(p => p.PartNumber === partNo);
                                        const displayName = partObj ? `${partNo} - ${partObj.PartName}` : partNo;
                                        return (
                                            <MenuItem key={partNo} value={partNo}>
                                                {displayName}
                                            </MenuItem>
                                        );
                                    })}
                            </TextField>
                        </Grid>

                        {/* Status */}
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                select
                                label="Status"
                                fullWidth
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <MenuItem value="">All Status</MenuItem>
                                {[...new Set(
                                    rows
                                        .map(r => r.Status)
                                        .filter(val => val && val.trim() !== "")
                                )]
                                    .sort((a, b) => a.localeCompare(b))
                                    .map((status) => (
                                        <MenuItem key={status} value={status}>
                                            {status}
                                        </MenuItem>
                                    ))}
                            </TextField>
                        </Grid>

                        {/* Severity */}
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                select
                                label="Severity"
                                fullWidth
                                value={filterSeverity}
                                onChange={(e) => setFilterSeverity(e.target.value)}
                            >
                                <MenuItem value="">All Severities</MenuItem>
                                {[...new Set(
                                    rows
                                        .map(r => r.Severity)
                                        .filter(val => val && val.trim() !== "")
                                )]
                                    .sort((a, b) => a.localeCompare(b))
                                    .map((sev) => (
                                        <MenuItem key={sev} value={sev}>
                                            {sev}
                                        </MenuItem>
                                    ))}
                            </TextField>
                        </Grid>

                        {/* From Date */}
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                type="date"
                                label="From Date"
                                fullWidth
                                value={fromDate || ""}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFromDate(value);
                                    setDateErrors(validateDates(value, toDate));
                                }}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ max: today }}
                                error={!!dateErrors.fromDate}
                                helperText={dateErrors.fromDate}
                            />
                        </Grid>

                        {/* To Date */}
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                type="date"
                                label="To Date"
                                fullWidth
                                value={toDate || ""}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setToDate(value);
                                    setDateErrors(validateDates(fromDate, value));
                                }}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ max: today }}
                                error={!!dateErrors.toDate}
                                helperText={dateErrors.toDate}
                            />
                        </Grid>

                        {/* Clear */}
                        <Grid item xs={12} sm={6} md={2}>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<ClearIcon />}
                                fullWidth
                                sx={{ height: '56px' }}
                                onClick={() => {
                                    setFilterPart("");
                                    setFilterStatus("");
                                    setFilterSeverity("");
                                    setFromDate("");
                                    setToDate("");
                                    setDateErrors({
                                        fromDate: "",
                                        toDate: "",
                                    });
                                }}
                            >
                                Clear
                            </Button>
                        </Grid>

                    </Grid>

                </CardContent>
            </Card>


            {/* Data Table */}
            <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 2 }}>
                    {/* Only one horizontal scrollbar */}
                    <Box sx={{ width: "100%" }}>
                        <DataGrid
                            rows={filteredRows}
                            columns={isQCUser ? columns.filter(col => col.field !== 'actions') : columns}
                            loading={loading}
                            autoHeight
                            rowHeight={70}
                            pageSizeOptions={[10, 20, 50]}
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
                            disableColumnSorting
                            hideFooterSelectedRowCount
                            sx={{
                                border: "none",
                                width: '100%',

                                /* Header Styling */
                                "& .MuiDataGrid-columnHeaders": {
                                    backgroundColor: "#f1f5f9",
                                    fontWeight: 700,
                                },

                                /* Row Hover */
                                "& .MuiDataGrid-row:hover": {
                                    backgroundColor: "#f8fafc",
                                },

                                /* Cell Alignment */
                                "& .MuiDataGrid-cell": {
                                    alignItems: "center",
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
        </Box>

    );

};

export default CustomerSummary;
