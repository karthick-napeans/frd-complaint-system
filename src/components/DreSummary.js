import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { loadMasters } from '../store/masterSlice';
import {
    Box,
    Container,
    Card,
    CardContent,
    Typography,
    Chip,
    Button,
    TextField,
    MenuItem,
    Grid
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import * as XLSX from "xlsx";
import { getDreList, downloadDREAttachment } from '../api/pageApi';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ClearIcon from '@mui/icons-material/Clear';
import { IconButton, Tooltip } from '@mui/material';
import { Download } from '@mui/icons-material';

const DreSummary = () => {
    const dispatch = useDispatch();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterPart, setFilterPart] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");
    const today = new Date().toISOString().split("T")[0];
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const lastMonth = lastMonthDate.toISOString().split("T")[0];
    const [fromDate, setFromDate] = useState(lastMonth);
    const [toDate, setToDate] = useState(today);
    const [dateErrors, setDateErrors] = useState({
        fromDate: "",
        toDate: "",
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
        fetchDreList();
    }, [dispatch]);

    const fetchDreList = async () => {
        try {
            setLoading(true);
            const response = await getDreList();
            console.log('Raw DRE Response:', response);

            const formattedData = response.map((item, index) => ({
                ...item,
                id: item.DreId,
                serialNo: index + 1
            }));

            setRows(formattedData);
        } catch (error) {
            console.error("Error fetching DRE list:", error);
        } finally {
            setLoading(false);
        }
    };

    // 🔎 Filtering
    const filteredRows = rows.filter((row) => {

        const matchPart =
            filterPart === "All" ? true : row.Part === filterPart;

        const matchStatus =
            filterStatus === "All" ? true : row.Status === filterStatus;

        const dreDate = new Date(row.DreDate);

        const matchFrom =
            !fromDate || dreDate >= new Date(fromDate);

        const matchTo =
            !toDate || dreDate <= new Date(toDate);

        return matchPart && matchStatus && matchFrom && matchTo;
    });

    // 📤 Export
    const handleExportExcel = () => {
        const exportData = filteredRows.map((row) => ({
            "S.No": row.serialNo,
            "DRE Number": row.DreNumber,
            "DRE Name": row.DreName,
            "DRE Date": new Date(row.DreDate).toLocaleDateString(),
            "Model": row.Model,
            "Part": row.Part,
            "Problem Description": row.ProblemDescription,
            "Analysis Details": row.AnalysisDetails,
            "Result Conclusion": row.ResultConclusion,
            "Status": row.Status,
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DRE");

        XLSX.writeFile(workbook, "DRE_Summary.xlsx");
    };

    const handleDownload = async (row) => {
        try {
            const attachmentId = row.AttachmentIds;
            console.log("⬇️ Downloading Attachment for Attachment ID:", attachmentId);
            const blob = await downloadDREAttachment(attachmentId);

            const originalName = row.AttachmentNames?.split(",")[0] || "";
            const extension = originalName.includes(".")
                ? originalName.substring(originalName.lastIndexOf("."))
                : "";

            // Create file name
            const fileName = `DRE_${row.DreNumber || attachmentId}${extension}`;

            // Download file
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            link.click();

            // Cleanup
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
            alert("Unable to download attachment.");
        }
    };

    // 📊 Columns
    const columns = [
        {
            field: 'serialNo',
            headerName: 'S.No',
            width: 80,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'DreNumber',
            headerName: 'Report Number',
            flex: 1,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'DreName',
            headerName: 'DRE Name',
            flex: 1,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (value, row) =>
                row.DreEngineerName || '',
        },
        {
            field: 'DreDate',
            headerName: 'Report Date',
            flex: 1,
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
            flex: 1,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'Part',
            headerName: 'Part',
            flex: 1,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'ProblemDescription',
            headerName: 'Description',
            width: 300,
            resizable: true,
            headerAlign: 'center',
            align: 'left',
            renderCell: (params) => (
                <Box sx={{
                    whiteSpace: 'normal',
                    lineHeight: '1.4',
                    padding: '8px 0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    height: '100%',
                    width: '100%'
                }}>
                    {params.value}
                </Box>
            )
        },
        {
            field: 'AnalysisDetails',
            headerName: 'Analysis Details',
            width: 300,
            resizable: true,
            headerAlign: 'center',
            align: 'left',
            valueGetter: (value, row) =>
                row.DreAnalysis || '',
            renderCell: (params) => (
                <Box sx={{
                    whiteSpace: 'normal',
                    lineHeight: '1.4',
                    padding: '8px 0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    height: '100%',
                    width: '100%'
                }}>
                    {params.value}
                </Box>
            )

        },
        {
            field: 'ResultConclusion',
            headerName: 'Conclusion',
            width: 300,
            resizable: true,
            headerAlign: 'center',
            align: 'left',
            valueGetter: (value, row) =>
                row.ResultConclusion || '',
            renderCell: (params) => (
                <Box sx={{
                    whiteSpace: 'normal',
                    lineHeight: '1.4',
                    padding: '8px 0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    height: '100%',
                    width: '100%'
                }}>
                    {params.value}
                </Box>
            )
        },
        {
            field: 'Status',
            headerName: 'Status',
            flex: 1,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => (
                <Chip
                    label={
                        params.value === "OPEN"
                            ? "Completed"
                            : params.value === "DRAFT"
                                ? "Draft"
                                : params.value
                    }
                    color="default"
                    size="small"
                    sx={{
                        margin: "0 auto",
                        fontWeight: 600,
                        backgroundColor:
                            params.value === "OPEN"
                                ? "#4caf50"
                                : params.value === "DRAFT"
                                    ? "#f44336"
                                    : "#f44336",
                        color: "#fff",
                    }}
                />
            ),
        },
        {
            field: 'Download',
            headerName: 'Download',
            width: 100,
            resizable: false,
            sortable: false,
            filterable: false,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => (
                <Tooltip title="Download Attachment">
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

    return (
        < Box>

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight={700} sx={{ color: "#3b3b3b" }}>
                    DRE Summary
                </Typography>

                <Button
                    variant="contained"
                    color="success"
                    startIcon={<FileDownloadIcon />}
                    onClick={handleExportExcel}
                >
                    Export Excel
                </Button>
            </Box>

            {/* Filters */}
            <Card sx={{ mb: 3, borderRadius: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <FilterAltIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">Filters</Typography>
                    </Box>

                    <Grid container spacing={2} alignItems="center">

                        {/* Part */}
                        <Grid item xs={12} sm={6} md={2.4}>
                            <TextField
                                select
                                label="Part"
                                fullWidth
                                value={filterPart}
                                onChange={(e) => setFilterPart(e.target.value)}
                            >
                                {[...new Set(rows.map(r => r.Part))]
                                    .filter(val => val)
                                    .map((part) => (
                                        <MenuItem key={part} value={part}>
                                            {part}
                                        </MenuItem>
                                    ))}
                            </TextField>
                        </Grid>

                        {/* Status */}
                        <Grid item xs={12} sm={6} md={2.4}>
                            <TextField
                                select
                                label="Status"
                                fullWidth
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                {[...new Set(rows.map(r => r.Status))]
                                    .filter(val => val)
                                    .map((status) => (
                                        <MenuItem key={status} value={status}>
                                            {status}
                                        </MenuItem>
                                    ))}
                            </TextField>
                        </Grid>

                        {/* From Date */}
                        <Grid item xs={12} sm={6} md={2.4}>
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
                        <Grid item xs={12} sm={6} md={2.4}>
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

                        {/* Clear Button */}
                        <Grid item xs={12} sm={6} md={2.4}>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<ClearIcon />}
                                fullWidth
                                sx={{ height: '56px' }}
                                onClick={() => {
                                    setFilterPart("All");
                                    setFilterStatus("All");
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

            {/* DataGrid */}
            <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 2 }}>
                    {/* Wrapper to enable horizontal scrolling */}
                    <Box sx={{ width: "100%", overflowX: "auto" }}>
                        <DataGrid
                            rows={filteredRows}
                            columns={columns}
                            loading={loading}
                            autoHeight
                            getRowHeight={() => 'auto'}
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
                                minWidth: 1900, // Adjust based on total column widths
                                "& .MuiDataGrid-columnHeaders": {
                                    backgroundColor: "#f1f5f9",
                                    fontWeight: 700,
                                },
                                "& .MuiDataGrid-row:hover": {
                                    backgroundColor: "#f8fafc",
                                },
                                "& .MuiDataGrid-cell": {
                                    alignItems: "flex-start",
                                    paddingTop: "8px",
                                    paddingBottom: "8px"
                                },
                            }}
                        />
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default DreSummary;
