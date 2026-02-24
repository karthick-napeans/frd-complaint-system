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
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
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
                id: item.ComplaintId, // required for DataGrid
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
            width: 80,
        },
        {
            field: 'ComplaintNo',
            headerName: 'Complaint No',
            flex: 1,
        },
        {
            field: 'CustomerEmail',
            headerName: 'Customer Email',
            flex: 1,
        },
        {
            field: 'ComplaintDate',
            headerName: 'Complaint Date',
            flex: 1,
            renderCell: (params) => {
                if (!params.value) return '';
                return new Date(params.value).toLocaleDateString();
            },
        },

        {
            field: 'Model',
            headerName: 'Model',
            flex: 1,
        },
        {
            field: 'Part',
            headerName: 'Part',
            flex: 1,
        },
        {
            field: 'Severity',
            headerName: 'Severity',
            flex: 1,
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
                />
            ),
        },
        {
            field: 'Status',
            headerName: 'Status',
            flex: 1,
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
                    mb:2
                   
                }}
            >
                <Typography variant="h5" fontWeight={700}>
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
                                <MenuItem value="All">All</MenuItem>

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
                                <MenuItem value="All">All</MenuItem>

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
                                <MenuItem value="All">All</MenuItem>

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
                                onChange={(e) => setFromDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        {/* To Date */}
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                type="date"
                                label="To Date"
                                fullWidth
                                value={toDate || ""}
                                onChange={(e) => setToDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
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
                        disableRowSelectionOnClick
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
