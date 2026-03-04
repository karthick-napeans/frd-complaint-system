import React, { useEffect, useState } from 'react';
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
import { getComplaintsList } from '../api/pageApi';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ClearIcon from '@mui/icons-material/Clear';


const CustomerSummary = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterPart, setFilterPart] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('');
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
    const filteredRows = rows.filter((row) => {

        const matchPart =
            !filterPart || row.Part === filterPart;

        const matchStatus =
            !filterStatus || row.Status === filterStatus;

        const matchSeverity =
            !filterSeverity || row.Severity === filterSeverity;

        const complaintDate = new Date(row.ComplaintDate);

        const matchFrom =
            !fromDate || complaintDate >= new Date(fromDate);

        const matchTo =
            !toDate || complaintDate <= new Date(toDate);

        return (
            matchPart &&
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
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            setLoading(true);

            const response = await getComplaintsList(); // 👈 your API call

            // Add serial number
            const formattedData = response.map((item, index) => ({
                ...item,
                id: item.ComplaintId, 
                serialNo: index + 1
            }));

            setRows(formattedData);
        } catch (error) {
            console.error("Error fetching complaints:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        const exportData = filteredRows.map((row) => ({
            "S.No": row.serialNo,
            "Complaint No": row.ComplaintNo,
            "Customer Email": row.CustomerEmail,
            "Complaint Date": row.ComplaintDate,
            "Model": row.Model,
            "Part": row.Part,
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
            field: 'CustomerEmail',
            headerName: 'Customer Email',
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
            width: 100,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'Part',
            headerName: 'Part',
            width: 100,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
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
                    sx={{ margin: '0 auto' }}
                />
            ),
        },
        {
            field: 'Status',
            headerName: 'Status',
            width: 100,
            resizable: false,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    color={
                        params.value === 'DRAFT'
                            ? 'default'
                            : params.value === 'OPEN'
                                ? 'info'
                                : params.value === 'CLOSED'
                                    ? 'success'
                                    : 'warning'
                    }
                    size="small"
                    sx={{ margin: '0 auto' }}
                />
            ),
        },
    ];

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

                                {[...new Set(
                                    rows
                                        .map(r => r.Part)
                                        .filter(val => val && val.trim() !== "")
                                )]
                                    .sort((a, b) => a.localeCompare(b))
                                    .map((part) => (
                                        <MenuItem key={part} value={part}>
                                            {part}
                                        </MenuItem>
                                    ))}
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

export default CustomerSummary;
