import React, { useMemo, useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow, Grid,
    TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    BarChart, Area,
    Bar, ReferenceLine
} from "recharts";
import html2canvas from "html2canvas";
import DownloadIcon from "@mui/icons-material/Download";
import IconButton from "@mui/material/IconButton";
import * as XLSX from "xlsx-js-style";

import { getPPMData, saveMonthlySalesData } from "../api/pageApi";

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const PLAN_PPM = 50;

const ComplaintAnalysis = ({ userRole }) => {
    console.log("Rendering ComplaintAnalysis with userRole:", userRole);
    const [salesInput, setSalesInput] = useState({});
    const [editingCell, setEditingCell] = useState(null);
    const [tempValue, setTempValue] = useState("");
    const [ppmSourceData, setPpmSourceData] = useState([]);
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 2;
    const lastYear = currentYear - 1;
    const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
    const [editReason, setEditReason] = useState("");
    const [pendingEditCell, setPendingEditCell] = useState(null);
    const inputRef = useRef(null);
    const isQcAdmin = ["qc_admin", "super_admin"].includes(userRole?.toLowerCase());

    /* ================= FETCH PPM DATA ================= */

    useEffect(() => {
        loadPPM();
    }, []);

    useEffect(() => {
        if (editingCell && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingCell]);

    const loadPPM = async () => {

        try {

            const res = await getPPMData();

            const formatted = (res || []).map(item => {

                const monthlySales =
                    item.Data2026?.MonthlySales || Array(12).fill(0);

                const monthlyRejection =
                    item.Data2026?.MonthlyRejection || Array(12).fill(0);

                const monthlyPlan =
                    item.Data2026?.monthlyPlannedPPM || Array(12).fill(0);

                return {

                    customerId: item.CustomerId,
                    customerName: item.CustomerName,

                    salesPrev: item.Data2024?.Sales || 0,
                    rejPrev: item.Data2024?.Rejection || 0,
                    ppmPrev: item.Data2024?.ppm || 0,

                    salesLast: item.Data2025?.Sales || 0,
                    rejLast: item.Data2025?.Rejection || 0,
                    ppmLast: item.Data2025?.ppm || 0,

                    sales: monthlySales,
                    rejection: monthlyRejection,
                    planPPM: monthlyPlan

                };

            });

            setPpmSourceData(formatted);

        } catch (err) {

            console.error("PPM API Error:", err);

        }

    };

    const handleSalesCellClick = (row, value, index) => {
        const key = `sales-${row.customerId}-${index}`;
        setEditingCell(key);
        setTempValue(value ?? "");
    };

    const handlePlanCellClick = (row, value, index) => {
        const key = `plan-${row.customerId}-${index}`;
        setEditingCell(key);
        setTempValue(value ?? "");
    };

    const saveMonthlyData = async (
        type,
        customerId,
        monthIndex,
        value,
        row
    ) => {

        const payload = {
            CustomerId: customerId,
            Year: currentYear,
            Month: monthIndex + 1,
            Value: type === "sales" ? Number(value) : (row.sales?.[monthIndex] ?? 0),
            PlannedPPM: type === "plan" ? Number(value) : (row.planPPM?.[monthIndex] ?? 0)
        };

        console.log("Saving payload:", payload);

        try {

            await saveMonthlySalesData(payload);

            if (type === "sales") {
                handleSalesCellClick(customerId, monthIndex, value);
            }

            console.log("Saved successfully");

            await loadPPM();

        } catch (error) {

            console.error("Save failed:", error);

        }
    };

    const ppmData = useMemo(() => {

        return (ppmSourceData || []).map(customer => {

            const sales = customer?.sales || Array(12).fill(0);
            const rejection = customer?.rejection || Array(12).fill(0);
            const planPPM = customer?.planPPM || Array(12).fill(0);

            const ppmMonths = sales.map((s, i) =>
                s === 0
                    ? 0
                    : Number(((rejection[i] * 1000000) / s).toFixed(1))
            );

            const totalSales = sales.reduce((a, b) => a + b, 0);
            const totalRej = rejection.reduce((a, b) => a + b, 0);

            const totalPPM =
                totalSales === 0
                    ? 0
                    : Number(((totalRej * 1000000) / totalSales).toFixed(1));

            const ppmPrev = customer.salesPrev === 0
                ? 0
                : Number(((customer.rejPrev * 1000000) / customer.salesPrev).toFixed(1));

            const ppmLast = customer.salesLast === 0
                ? 0
                : Number(((customer.rejLast * 1000000) / customer.salesLast).toFixed(1));

            return {
                customerId: customer.customerId,
                customerName: customer.customerName,

                sales,
                rejection,
                planPPM,
                ppmMonths,

                totalSales,
                totalRej,
                totalPPM,

                salesPrev: customer.salesPrev,
                salesLast: customer.salesLast,

                rejPrev: customer.rejPrev,
                rejLast: customer.rejLast,

                ppmPrev,
                ppmLast
            };

        });

    }, [ppmSourceData]);

    const totals = useMemo(() => {

        if (!ppmData.length) return null;

        const monthlySales = Array(12).fill(0);
        const monthlyRejection = Array(12).fill(0);

        let salesPrev = 0;
        let salesLast = 0;

        let rejPrev = 0;
        let rejLast = 0;

        ppmData.forEach(row => {

            salesPrev += row.salesPrev || 0;
            salesLast += row.salesLast || 0;

            rejPrev += row.rejPrev || 0;
            rejLast += row.rejLast || 0;

            row.sales.forEach((s, i) => {
                monthlySales[i] += Number(s) || 0;
            });

            row.rejection.forEach((r, i) => {
                monthlyRejection[i] += Number(r) || 0;
            });

        });

        const totalSales = monthlySales.reduce((a, b) => a + b, 0);
        const totalRej = monthlyRejection.reduce((a, b) => a + b, 0);

        const totalPPM =
            totalSales === 0
                ? 0
                : Number(((totalRej * 1000000) / totalSales).toFixed(1));

        const ppmMonths = monthlySales.map((s, i) =>
            s === 0
                ? 0
                : Number(((monthlyRejection[i] * 1000000) / s).toFixed(1))
        );

        return {
            salesPrev,
            salesLast,
            rejPrev,
            rejLast,

            monthlySales,
            monthlyRejection,

            totalSales,
            totalRej,
            totalPPM,
            ppmMonths
        };

    }, [ppmData]);

    const monthlyTrend = useMemo(() => {

        if (!ppmData.length) return [];

        const monthlySales = Array(12).fill(0);
        const monthlyRejection = Array(12).fill(0);
        const monthlyPlan = Array(12).fill(0);

        ppmData.forEach(row => {

            (row.sales || []).forEach((s, i) => {
                monthlySales[i] += Number(s) || 0;
            });

            (row.rejection || []).forEach((r, i) => {
                monthlyRejection[i] += Number(r) || 0;
            });

            (row.planPPM || []).forEach((p, i) => {
                if (!monthlyPlan[i] && p) {
                    monthlyPlan[i] = Number(p);
                }
            });

        });

        return MONTHS.map((month, i) => {

            const actualPPM =
                monthlySales[i] > 0
                    ? (monthlyRejection[i] * 1000000) / monthlySales[i]
                    : 0;

            return {
                month,
                actual: Number(actualPPM.toFixed(1)),
                plan: monthlyPlan[i] || 0
            };

        });

    }, [ppmData]);

    const yearlyTrend = useMemo(() => {

        if (!ppmData.length) return [];

        const previousYearAvg =
            ppmData.reduce((sum, row) => sum + row.ppmPrev, 0) / ppmData.length;

        const lastYearAvg =
            ppmData.reduce((sum, row) => sum + row.ppmLast, 0) / ppmData.length;

        const currentYearAvg =
            ppmData.reduce((sum, row) => sum + row.totalPPM, 0) / ppmData.length;

        return [
            { year: `${previousYear} ACT`, value: Number(previousYearAvg.toFixed(1)) },
            { year: `${lastYear} ACT`, value: Number(lastYearAvg.toFixed(1)) },
            { year: `${currentYear} ACT`, value: Number(currentYearAvg.toFixed(1)) }
        ];

    }, [ppmData]);

    const exportRef = useRef(null);
    const monthlyExportRef = useRef(null);

    const handleDownload = async () => {
        if (!exportRef.current) return;

        try {
            const canvas = await html2canvas(exportRef.current, {
                backgroundColor: "#ffffff",
                scale: 2, // higher quality
                useCORS: true
            });

            const image = canvas.toDataURL("image/jpeg", 1.0);

            const link = document.createElement("a");
            link.href = image;
            link.download = "Yearly-PPM-Trend.jpeg";
            link.click();
        } catch (error) {
            console.error("Download failed:", error);
        }
    };

    const handleMonthlyDownload = async () => {
        if (!monthlyExportRef.current) return;

        try {
            const canvas = await html2canvas(monthlyExportRef.current, {
                backgroundColor: "#ffffff",
                scale: 2,
                useCORS: true
            });

            const image = canvas.toDataURL("image/jpeg", 1.0);

            const link = document.createElement("a");
            link.href = image;
            link.download = "Monthly-Performance-vs-Plan.jpeg";
            link.click();
        } catch (error) {
            console.error("Download failed:", error);
        }
    };

    const handleExcelDownload = () => {
        const workbook = XLSX.utils.book_new();

        const wsData = [];

        // === HEADER ROW 1 ===
        wsData.push([
            "Customer",
            "Type",
            "2023",
            "2024",
            "2025 Avg",
            "2025",
            "", "", "", "", "", "", "", "", "", "", "",
            "Remarks",
            "Reduced %"
        ]);

        // === HEADER ROW 2 ===
        wsData.push([
            "",
            "",
            "ACT",
            "ACT",
            "AVG",
            ...MONTHS,
            "",
            ""
        ]);

        // === BODY DATA ===
        ppmData.forEach((row) => {
            wsData.push([
                row.customerName,
                "REJ QTY",
                row.rej2023,
                row.rej2024,
                row.totalRej,
                ...row.rejection,
                "",
                "-100%"
            ]);

            wsData.push([
                "",
                "SALES QTY",
                row.sales2023,
                row.sales2024,
                row.totalSales,
                ...row.sales,
                "",
                ""
            ]);

            wsData.push([
                "",
                "PLAN PPM",
                PLAN_PPM,
                PLAN_PPM,
                PLAN_PPM,
                ...Array(12).fill(PLAN_PPM),
                "",
                ""
            ]);

            wsData.push([
                "",
                "ACTUAL PPM",
                row.ppm2023,
                row.ppm2024,
                row.totalPPM,
                ...row.ppmMonths,
                "",
                ""
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // === MERGE CELLS ===
        ws["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // Customer
            { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // Type
            { s: { r: 0, c: 2 }, e: { r: 0, c: 2 } }, // 2023
            { s: { r: 0, c: 3 }, e: { r: 0, c: 3 } }, // 2024
            { s: { r: 0, c: 4 }, e: { r: 0, c: 4 } }, // 2025 Avg
            { s: { r: 0, c: 5 }, e: { r: 0, c: 16 } }, // 2025 months merge
            { s: { r: 0, c: 17 }, e: { r: 1, c: 17 } }, // Remarks
            { s: { r: 0, c: 18 }, e: { r: 1, c: 18 } }, // Reduced %
        ];

        // === HEADER STYLE ===
        const headerStyle = {
            font: { bold: true, color: { rgb: "000000" } },
            alignment: { horizontal: "center", vertical: "center" },
            fill: { fgColor: { rgb: "C9DAEB" } },
            border: {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" }
            }
        };

        const subHeaderStyle = {
            font: { bold: true },
            alignment: { horizontal: "center" },
            fill: { fgColor: { rgb: "CADBEC" } },
            border: {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" }
            }
        };

        // Apply styles
        for (let col = 0; col <= 18; col++) {
            const cell1 = XLSX.utils.encode_cell({ r: 0, c: col });
            const cell2 = XLSX.utils.encode_cell({ r: 1, c: col });

            if (ws[cell1]) ws[cell1].s = headerStyle;
            if (ws[cell2]) ws[cell2].s = subHeaderStyle;
        }

        // Auto column width
        ws["!cols"] = Array(19).fill({ wch: 14 });

        XLSX.utils.book_append_sheet(workbook, ws, "PPM Report");

        XLSX.writeFile(workbook, "PPM_Report_Styled.xlsx");
    };

    const submitReason = () => {

        if (!editReason.trim()) {
            alert("Please enter reason");
            return;
        }

        if (pendingEditCell) {
            setEditingCell(pendingEditCell.cellKey);
            setTempValue(pendingEditCell.value);
        }

        setReasonDialogOpen(false);
        setPendingEditCell(null);
    };

    return (
        <Box >

            <Typography align="left" fontWeight="bold" fontSize={20} mb={1} >
                CUSTOMER PPM REPORT - {currentYear}
            </Typography>

            <Grid container spacing={4} mb={1}>

                {/* ================= YEARLY COMPARISON ================= */}
                <Grid item xs={12} md={4}>
                    <Paper
                        ref={exportRef}
                        sx={{
                            p: 2,
                            borderRadius: 4,
                            background: "linear-gradient(145deg,#ffffff,#f8fafc)",
                            boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                            position: "relative"
                        }}
                    >
                        {/* Download Button */}
                        <IconButton
                            onClick={handleDownload}
                            sx={{
                                position: "absolute",
                                top: 12,
                                right: 12,
                                bgcolor: "#f1f5f9",
                                "&:hover": { bgcolor: "#e2e8f0" }
                            }}
                        >
                            <DownloadIcon fontSize="small" />
                        </IconButton>

                        <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            mb={3}
                            color="#1e293b"
                        >
                            Yearly PPM Trend
                        </Typography>

                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={yearlyTrend}>
                                <CartesianGrid stroke="#f1f5f9" vertical={false} />

                                <XAxis
                                    dataKey="year"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#64748b", fontSize: 12 }}
                                />

                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#64748b", fontSize: 12 }}
                                />

                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "12px",
                                        border: "none",
                                        boxShadow: "0 10px 25px rgba(0,0,0,0.12)"
                                    }}
                                />

                                <Bar
                                    dataKey="value"
                                    radius={[12, 12, 0, 0]}
                                    fill="#6366f1"
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* ================= MONTHLY TREND ================= */}
                <Grid item xs={12} md={8}>
                    <Paper
                        ref={monthlyExportRef}
                        sx={{
                            p: 2,
                            borderRadius: 4,
                            background: "linear-gradient(145deg,#ffffff,#f8fafc)",
                            boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                            position: "relative"
                        }}
                    >
                        {/* Download Button */}
                        <IconButton
                            onClick={handleMonthlyDownload}
                            sx={{
                                position: "absolute",
                                top: 12,
                                right: 12,
                                bgcolor: "#f1f5f9",
                                "&:hover": { bgcolor: "#e2e8f0" }
                            }}
                        >
                            <DownloadIcon fontSize="small" />
                        </IconButton>

                        <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            mb={3}
                            color="#1e293b"
                        >
                            Monthly Performance vs Plan
                        </Typography>

                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart
                                data={monthlyTrend}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />

                                <XAxis
                                    dataKey="month"
                                    tick={{ fill: "#64748b", fontSize: 12 }}
                                />

                                <YAxis
                                    domain={[
                                        0,
                                        (dataMax) => (dataMax === 0 ? 5 : dataMax * 1.5)
                                    ]}
                                    tick={{ fill: "#64748b", fontSize: 12 }}
                                />

                                <Tooltip />

                                <Line
                                    type="monotone"
                                    dataKey="plan"
                                    stroke="#3b82f6"
                                    strokeDasharray="6 6"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="actual"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

            </Grid>

            <Box sx={{ overflowX: "auto" }}>
                <Button
                    variant="contained"
                    sx={{ mt: 1, mb: 1, float: "right" }}
                    onClick={handleExcelDownload}
                >
                    Download Excel
                </Button>

                <TableContainer
                    component={Paper}
                    elevation={3}
                    sx={{
                        mt: 3,
                        borderRadius: 3
                    }}
                >
                    <Table
                        size="small"
                        sx={{
                            minWidth: 1800,
                            borderCollapse: "collapse",

                            "& th, & td": {
                                textAlign: "center",
                                verticalAlign: "middle",
                                fontSize: 13,
                                border: "1px solid #d0d7de"
                            },

                            // Strong outer border
                            border: "1px solid #90a4ae",

                            // Header bottom border
                            "& thead th": {
                                borderBottom: "1px solid #78909c"
                            }
                        }}
                    >
                        {/* ================= HEADER ================= */}
                        <TableHead>

                            {/* Top Header */}
                            <TableRow sx={{ backgroundColor: "#c9daeb" }}>
                                <TableCell rowSpan={2}><b>Customer</b></TableCell>
                                <TableCell rowSpan={2}><b>Type</b></TableCell>

                                <TableCell><b>2023</b></TableCell>
                                <TableCell><b>2024</b></TableCell>
                                <TableCell><b>2025</b></TableCell>

                                <TableCell colSpan={13}><b>2025</b></TableCell>
                            </TableRow>

                            {/* Month Row */}
                            <TableRow sx={{ backgroundColor: "#cadbec" }}>
                                <TableCell><b>ACT</b></TableCell>
                                <TableCell><b>ACT</b></TableCell>
                                <TableCell><b>AVG</b></TableCell>

                                {MONTHS.map((m) => (
                                    <TableCell key={m}>
                                        <b>{m}</b>
                                    </TableCell>
                                ))}
                            </TableRow>

                        </TableHead>

                        {/* ================= BODY ================= */}
                        <TableBody>

                            {(ppmData || []).map(row => (
                                <React.Fragment key={row.customerId}>

                                    {/* REJ QTY */}
                                    <TableRow hover>
                                        <TableCell rowSpan={4} sx={{ fontWeight: 600 }}>
                                            {row.customerName}
                                        </TableCell>

                                        <TableCell sx={{ fontWeight: 600 }}>
                                            REJ QTY
                                        </TableCell>

                                        <TableCell>{row.rejPrev ?? "-"}</TableCell>
                                        <TableCell>{row.rejLast ?? "-"}</TableCell>
                                        <TableCell>{row.totalRej ?? "-"}</TableCell>

                                        {(row.rejection || []).map((val, i) => (
                                            <TableCell
                                                key={i}

                                            >
                                                {val ?? "-"}
                                            </TableCell>
                                        ))}

                                    </TableRow>


                                    {/* SALES QTY */}
                                    <TableRow hover>

                                        <TableCell sx={{ fontWeight: 600 }}>
                                            SALES QTY
                                        </TableCell>

                                        <TableCell>{row.salesPrev ?? "-"}</TableCell>
                                        <TableCell>{row.salesLast ?? "-"}</TableCell>
                                        <TableCell>{row.totalSales ?? "-"}</TableCell>

                                        {(row.sales || []).map((val, i) => {

                                            const cellKey = `sales-${row.customerId}-${i}`;
                                            const isEditing = editingCell === cellKey;

                                            return (
                                                <TableCell
                                                    key={i}
                                                    sx={{ cursor: "pointer" }}
                                                    onDoubleClick={() => handleSalesCellClick(row, val, i)}
                                                >
                                                    {isEditing ? (
                                                        <TextField
                                                            autoFocus
                                                            size="small"
                                                            type="number"
                                                            inputRef={inputRef}
                                                            value={tempValue}
                                                            onChange={(e) => setTempValue(e.target.value)}
                                                            onKeyDown={async (e) => {

                                                                if (e.key === "Enter") {

                                                                    await saveMonthlyData(
                                                                        "sales",
                                                                        row.customerId,
                                                                        i,
                                                                        tempValue,
                                                                        row
                                                                    );

                                                                    setEditingCell(null);
                                                                }

                                                                if (e.key === "Escape") {
                                                                    setEditingCell(null);
                                                                }

                                                            }}
                                                            sx={{
                                                                width: 80,
                                                                "& input": {
                                                                    textAlign: "center",
                                                                    padding: "4px"
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        val ?? "-"
                                                    )}

                                                </TableCell>
                                            );

                                        })}
                                    </TableRow>


                                    {/* PLAN */}
                                    <TableRow hover>

                                        <TableCell sx={{ fontWeight: 600 }}>
                                            PLAN PPM
                                        </TableCell>

                                        <TableCell>-</TableCell>
                                        <TableCell>-</TableCell>
                                        <TableCell>-</TableCell>

                                        {MONTHS.map((_, i) => {

                                            const val = row.planPPM?.[i] ?? 0;

                                            const cellKey = `plan-${row.customerId}-${i}`;
                                            const isEditing = editingCell === cellKey;

                                            return (
                                                <TableCell
                                                    key={i}
                                                    sx={{ cursor: "pointer" }}
                                                    onDoubleClick={() =>
                                                        handlePlanCellClick(row, val, i)
                                                    }
                                                >
                                                    {isEditing ? (
                                                        <TextField
                                                            autoFocus
                                                            size="small"
                                                            type="number"
                                                            inputRef={inputRef}
                                                            value={tempValue}
                                                            onChange={(e) => setTempValue(e.target.value)}
                                                            onKeyDown={async (e) => {

                                                                if (e.key === "Enter") {

                                                                    await saveMonthlyData(
                                                                        "plan",
                                                                        row.customerId,
                                                                        i,
                                                                        tempValue,
                                                                        row
                                                                    );

                                                                    setEditingCell(null);
                                                                }

                                                                if (e.key === "Escape") {
                                                                    setEditingCell(null);
                                                                }

                                                            }}
                                                            sx={{
                                                                width: 80,
                                                                "& input": {
                                                                    textAlign: "center",
                                                                    padding: "4px"
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        val
                                                    )}
                                                </TableCell>
                                            );

                                        })}
                                    </TableRow>


                                    {/* ACTUAL */}
                                    <TableRow hover>

                                        <TableCell sx={{ fontWeight: 600 }}>
                                            ACTUAL PPM
                                        </TableCell>

                                        <TableCell
                                            sx={{
                                                fontWeight: 600,
                                                color: row.ppmPrev > PLAN_PPM ? "#d32f2f" : "#2e7d32"
                                            }}
                                        >
                                            {row.ppmPrev ?? "-"}
                                        </TableCell>

                                        <TableCell
                                            sx={{
                                                fontWeight: 600,
                                                color: row.ppmLast > PLAN_PPM ? "#d32f2f" : "#2e7d32"
                                            }}
                                        >
                                            {row.ppmLast ?? "-"}
                                        </TableCell>

                                        <TableCell
                                            sx={{
                                                fontWeight: 600,
                                                color:
                                                    row.totalPPM > PLAN_PPM
                                                        ? "#d32f2f"
                                                        : "#2e7d32"
                                            }}
                                        >
                                            {row.totalPPM ?? "-"}
                                        </TableCell>

                                        {(row.ppmMonths || []).map((val, i) => (
                                            <TableCell
                                                key={i}
                                                sx={{
                                                    fontWeight: 600,
                                                    color:
                                                        val > PLAN_PPM
                                                            ? "#d32f2f"
                                                            : "#2e7d32",

                                                }}
                                            >
                                                {val ?? "-"}
                                            </TableCell>
                                        ))}

                                    </TableRow>

                                </React.Fragment>
                            ))}


                            {/* ================= TOTAL SECTION ================= */}

                            {totals && (
                                <>
                                    <TableRow sx={{ background: "#f1f5f9", fontWeight: 700 }}>
                                        <TableCell rowSpan={4}><b>TOTAL</b></TableCell>

                                        <TableCell><b>REJ QTY</b></TableCell>

                                        <TableCell>{totals.rejPrev}</TableCell>
                                        <TableCell>{totals.rejLast}</TableCell>
                                        <TableCell>{totals.totalRej}</TableCell>

                                        {(totals.monthlyRejection || []).map((v, i) => (
                                            <TableCell key={i}>{v}</TableCell>
                                        ))}
                                    </TableRow>


                                    <TableRow sx={{ background: "#f1f5f9", fontWeight: 700 }}>
                                        <TableCell><b>SALES QTY</b></TableCell>

                                        <TableCell>{totals.salesPrev}</TableCell>
                                        <TableCell>{totals.salesLast}</TableCell>
                                        <TableCell>{totals.totalSales}</TableCell>

                                        {(totals.monthlySales || []).map((v, i) => (
                                            <TableCell key={i}>{v}</TableCell>
                                        ))}
                                    </TableRow>


                                    <TableRow sx={{ background: "#f1f5f9", fontWeight: 700 }}>
                                        <TableCell><b>PLAN PPM</b></TableCell>

                                        <TableCell>{PLAN_PPM}</TableCell>
                                        <TableCell>{PLAN_PPM}</TableCell>
                                        <TableCell>{PLAN_PPM}</TableCell>

                                        {MONTHS.map((_, i) => (
                                            <TableCell key={i}>{PLAN_PPM}</TableCell>
                                        ))}
                                    </TableRow>


                                    <TableRow sx={{ background: "#f1f5f9", fontWeight: 700 }}>
                                        <TableCell><b>ACTUAL PPM</b></TableCell>

                                        <TableCell>-</TableCell>
                                        <TableCell>-</TableCell>
                                        <TableCell>{totals.totalPPM}</TableCell>

                                        {(totals.ppmMonths || []).map((v, i) => (
                                            <TableCell key={i}>{v}</TableCell>
                                        ))}
                                    </TableRow>
                                </>
                            )}

                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Dialog open={reasonDialogOpen} onClose={() => setReasonDialogOpen(false)}>

                <DialogTitle>
                    Reason to Modify Sales Data
                </DialogTitle>

                <DialogContent>

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Reason"
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                    />

                </DialogContent>

                <DialogActions>

                    <Button
                        onClick={() => setReasonDialogOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={submitReason}
                    >
                        Submit
                    </Button>

                </DialogActions>

            </Dialog>

        </Box>
    );
};

export default ComplaintAnalysis;   