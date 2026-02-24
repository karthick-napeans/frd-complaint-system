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
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

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
        { field: 'serialNo', headerName: 'S.No', width: 80 },
        { field: 'DreNumber', headerName: 'DRE Number', flex: 1 },
        {
            field: 'DreDate',
            headerName: 'DRE Date',
            flex: 1,
            renderCell: (params) =>
                params.value
                    ? new Date(params.value).toLocaleDateString()
                    : ''
        },
        { field: 'Model', headerName: 'Model', flex: 1 },
        { field: 'Part', headerName: 'Part', flex: 1 },
        {
            field: 'Status',
            headerName: 'Status',
            flex: 1,
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
                />
            ),
        },
    ];

    return (
        < Box>

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight={700} >
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
                                <MenuItem value="All">All</MenuItem>
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
                                <MenuItem value="All">All</MenuItem>
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
                                onChange={(e) => setFromDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        {/* To Date */}
                        <Grid item xs={12} sm={6} md={2.4}>
                            <TextField
                                type="date"
                                label="To Date"
                                fullWidth
                                value={toDate || ""}
                                onChange={(e) => setToDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
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
                        disableRowSelectionOnClick
                    />k
                </CardContent>
            </Card>

        </Box>
    );
};

export default DreSummary;
