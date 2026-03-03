import React, { useEffect, useState } from 'react';
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
import { getDreList } from '../api/pageApi';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ClearIcon from '@mui/icons-material/Clear';

const DreSummary = () => {
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
        fetchDreList();
    }, []);

    const fetchDreList = async () => {
        try {
            setLoading(true);
            const response = await getDreList();

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
            "DRE Date": new Date(row.DreDate).toLocaleDateString(),
            "Model": row.Model,
            "Part": row.Part,
            "Status": row.Status,
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DRE");

        XLSX.writeFile(workbook, "DRE_Summary.xlsx");
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
            headerName: 'DRE Number',
            flex: 1,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'DreDate',
            headerName: 'DRE Date',
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
            width: 250,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
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
                    label={params.value}
                    color={
                        params.value === 'OPEN'
                            ? 'info'
                            : params.value === 'CLOSED'
                                ? 'success'
                                : 'default'
                    }
                    size="small"
                    sx={{ margin: "0 auto" }} // ensure chip stays centered
                />
            ),
        },
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
                <CardContent>
                    <DataGrid
                        rows={filteredRows}
                        columns={columns}
                        loading={loading}
                        autoHeight
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
                        disableColumnSorting   // ✅ disables sorting
                        hideFooterSelectedRowCount
                        sx={{
                            border: 'none',
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: '#f1f5f9',
                                fontWeight: 700,
                            },
                            '& .MuiDataGrid-row:hover': {
                                backgroundColor: '#f8fafc',
                            },
                            '& .MuiDataGrid-cell': {
                                alignItems: 'center',
                            },
                        }}
                    />
                </CardContent>
            </Card>

        </Box>
    );
};

export default DreSummary;
