import React, { useMemo, useState } from "react";
import {
    Box,
    Typography,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    FormControl,
    Select,
    MenuItem
} from "@mui/material";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from "recharts";

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// 🔵 Replace with real sales API later
const SALES_PER_MONTH = 10000;

const ComplaintAnalysis = ({ apiData }) => {

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    /* ================= FILTER BY YEAR ================= */

    const filteredData = useMemo(() => {
        if (!apiData || !Array.isArray(apiData)) return [];

        return apiData.filter(item => {
            if (!item?.ComplaintDate) return false;
            const year = new Date(item.ComplaintDate).getFullYear();
            return year === selectedYear;
        });
    }, [apiData, selectedYear]);

    /* ================= MODEL WISE PPM ================= */

    const ppmData = useMemo(() => {
        const map = {};

        filteredData.forEach(item => {
            const date = new Date(item.ComplaintDate);
            const month = date.getMonth();
            const model = item.Model || "Unknown";

            if (!map[model]) {
                map[model] = {
                    model,
                    complaints: Array(12).fill(0),
                    totalComplaints: 0
                };
            }

            map[model].complaints[month] += 1;
            map[model].totalComplaints += 1;
        });

        return Object.values(map).map(row => ({
            ...row,
            ppmMonths: row.complaints.map(qty =>
                Math.round((qty * 1000000) / SALES_PER_MONTH)
            ),
            totalPPM: Math.round(
                (row.totalComplaints * 1000000) /
                (SALES_PER_MONTH * 12)
            )
        }));
    }, [filteredData]);

    /* ================= MONTHLY TOTAL PPM ================= */

    const monthlyTrend = useMemo(() => {
        const monthlyTotals = Array(12).fill(0);

        ppmData.forEach(row => {
            row.complaints.forEach((qty, i) => {
                monthlyTotals[i] += qty;
            });
        });

        return MONTHS.map((m, i) => ({
            month: m,
            actual: Math.round(
                (monthlyTotals[i] * 1000000) / SALES_PER_MONTH
            )
        }));
    }, [ppmData]);

    /* ================= TOTAL ROW ================= */

    const totalRow = useMemo(() => {
        const monthlyTotals = Array(12).fill(0);
        let grandTotal = 0;

        ppmData.forEach(row => {
            row.complaints.forEach((qty, i) => {
                monthlyTotals[i] += qty;
            });
            grandTotal += row.totalComplaints;
        });

        return {
            monthPPM: monthlyTotals.map(qty =>
                Math.round((qty * 1000000) / SALES_PER_MONTH)
            ),
            totalPPM: Math.round(
                (grandTotal * 1000000) /
                (SALES_PER_MONTH * 12)
            )
        };
    }, [ppmData]);

    /* ================= YEARLY AVERAGE ================= */

    const yearlyAveragePPM =
        monthlyTrend.reduce((a, b) => a + b.actual, 0) / 12;

    /* ================= UI ================= */

    return (
        <Box sx={{ p: 3, backgroundColor: "#fff" }}>

            <Typography align="center" fontWeight="bold" fontSize={20} sx={{ color: "#3b3b3b" }}>
                CUSTOMER COMPLAINT PPM TREND - {selectedYear}
            </Typography>

            {/* YEAR SELECTOR */}
            <Box mt={2} mb={2} width={200}>
                <FormControl fullWidth size="small">
                    <Select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        {[2023, 2024, 2025, 2026].map(year => (
                            <MenuItem key={year} value={year}>
                                {year}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* CHART SECTION */}
            <Grid container spacing={2}>

                {/* Monthly Trend */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography fontWeight="bold" mb={1}>
                            Monthly PPM Trend
                        </Typography>

                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={monthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="actual"
                                    stroke="#d32f2f"
                                    strokeWidth={3}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* TABLE */}
            <TableContainer component={Paper} sx={{ mt: 3 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell><b>Model</b></TableCell>
                            {MONTHS.map(m => (
                                <TableCell key={m} align="center">
                                    <b>{m}</b>
                                </TableCell>
                            ))}
                            <TableCell align="center"><b>TOTAL</b></TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {ppmData.map(row => (
                            <TableRow key={row.model}>
                                <TableCell>{row.model}</TableCell>
                                {row.ppmMonths.map((ppm, i) => (
                                    <TableCell key={i} align="center">{ppm}</TableCell>
                                ))}
                                <TableCell align="center">{row.totalPPM}</TableCell>
                            </TableRow>
                        ))}

                        {/* TOTAL ROW */}
                        <TableRow sx={{ backgroundColor: "#f2f2f2" }}>
                            <TableCell><b>TOTAL</b></TableCell>
                            {totalRow.monthPPM.map((val, i) => (
                                <TableCell key={i} align="center">
                                    <b>{val}</b>
                                </TableCell>
                            ))}
                            <TableCell align="center">
                                <b>{totalRow.totalPPM}</b>
                            </TableCell>
                        </TableRow>

                    </TableBody>
                </Table>
            </TableContainer>

            {/* YEARLY SUMMARY */}
            <Box mt={3}>
                <Typography fontWeight="bold">
                    Yearly Average PPM : {Math.round(yearlyAveragePPM)}
                </Typography>
            </Box>

        </Box>
    );
};

export default ComplaintAnalysis;
