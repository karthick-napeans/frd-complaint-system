import React, { useMemo, useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { loadMasters } from "../store/masterSlice";
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
    Bar, ReferenceLine,
    LabelList, PieChart, Pie, Cell
} from "recharts";
import html2canvas from "html2canvas";
import DownloadIcon from "@mui/icons-material/Download";
import IconButton from "@mui/material/IconButton";
import * as XLSX from "xlsx-js-style";

import { getPPMData, saveMonthlySalesData, getComplaintTrends } from "../api/pageApi";

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];


const ComplaintAnalysis = ({ userRole }) => {
    const dispatch = useDispatch();
    console.log("Rendering ComplaintAnalysis with userRole:", userRole);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [exportPieInfo, setExportPieInfo] = useState(null);
    const hiddenPieExportRef = useRef(null);
    const [salesInput, setSalesInput] = useState({});
    const [editingCell, setEditingCell] = useState(null);
    const [tempValue, setTempValue] = useState("");
    const [ppmSourceData, setPpmSourceData] = useState([]);
    const [trendsSourceData, setTrendsSourceData] = useState({
        FourMTrends: [],
        ModelTrends: [],
        PartTrends: [],
        DefectTrends: []
    });
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 2;
    const lastYear = currentYear - 1;
    const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
    const [editReason, setEditReason] = useState("");
    const [pendingEditCell, setPendingEditCell] = useState(null);
    const inputRef = useRef(null);
    const salesQuantityRef = useRef(null);
    const isQcAdmin = ["qc_admin", "super_admin"].includes(userRole?.toLowerCase());

    /* ================= FETCH PPM DATA ================= */

    useEffect(() => {
        dispatch(loadMasters());
        loadPPM();
        loadTrends();
    }, [dispatch]);

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
                const dataCurrent = item.currentYearData || {};
                const dataLast = item.historyYear1 || {};
                const dataPrev = item.historyYear2 || {};

                const monthlySales = dataCurrent.MonthlySales || Array(12).fill(0);
                const monthlyRejection = dataCurrent.MonthlyRejection || Array(12).fill(0);
                const monthlyPlan = dataCurrent.monthlyPlannedPPM || Array(12).fill(0);

                return {
                    customerId: item.CustomerId,
                    customerName: item.CustomerName,

                    salesPrev: dataPrev.Sales || 0,
                    rejPrev: dataPrev.Rejection || 0,
                    planPpmPrev: dataPrev.ppm || 0,

                    salesLast: dataLast.Sales || 0,
                    rejLast: dataLast.Rejection || 0,
                    planPpmLast: dataLast.ppm || 0,

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

    const loadTrends = async () => {
        try {
            const res = await getComplaintTrends();
            if (res) {
                setTrendsSourceData({
                    FourMTrends: res.FourMTrends || [],
                    ModelTrends: res.ModelTrends || [],
                    PartTrends: res.PartTrends || [],
                    DefectTrends: res.DefectTrends || []
                });
            }
        } catch (err) {
            console.error("Trends API Error:", err);
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
        // Convert to number
        const numericValue = Number(value);

        // Allow 0, reject empty, invalid, and negative values
        if (value === "" || isNaN(numericValue) || numericValue < 0) {
            return;
        }

        const payload = {
            CustomerId: customerId,
            Year: currentYear,
            Month: monthIndex + 1,
            Value:
                type === "sales"
                    ? numericValue
                    : (row.sales?.[monthIndex] ?? 0),
            PlannedPPM:
                type === "plan"
                    ? numericValue
                    : (row.planPPM?.[monthIndex] ?? 0),
        };

        console.log("Saving payload:", payload);

        try {
            await saveMonthlySalesData(payload);

            if (type === "sales") {
                handleSalesCellClick(customerId, monthIndex, numericValue);
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
            const activePlans = planPPM.filter(p => p > 0);

            const ppmMonths = sales.map((s, i) =>
                s === 0
                    ? 0
                    : Number(((rejection[i] * 1000000) / s).toFixed(0))
            );

            const totalSales = sales.reduce((a, b) => a + b, 0);
            const totalRej = rejection.reduce((a, b) => a + b, 0);

            const totalPPM =
                totalSales === 0
                    ? 0
                    : Number(((totalRej * 1000000) / totalSales).toFixed(0));

            const ppmPrev = customer.salesPrev === 0
                ? 0
                : Number(((customer.rejPrev * 1000000) / customer.salesPrev).toFixed(0));

            const ppmLast = customer.salesLast === 0
                ? 0
                : Number(((customer.rejLast * 1000000) / customer.salesLast).toFixed(0));

            return {
                customerId: customer.customerId,
                customerName: customer.customerName,

                sales,
                rejection,
                planPPM,
                avgPlanPPM: activePlans.length === 0 ? 0 : Number((activePlans.reduce((a, b) => a + b, 0) / activePlans.length).toFixed(0)),
                ppmMonths,

                totalSales,
                totalRej,
                totalPPM,

                salesPrev: customer.salesPrev,
                salesLast: customer.salesLast,

                rejPrev: customer.rejPrev,
                rejLast: customer.rejLast,

                planPpmPrev: customer.planPpmPrev,
                planPpmLast: customer.planPpmLast,

                ppmPrev,
                ppmLast
            };

        });

    }, [ppmSourceData]);

    const totals = useMemo(() => {

        if (!ppmData.length) return null;

        const monthlySales = Array(12).fill(0);
        const monthlyRejection = Array(12).fill(0);
        const monthlyPlanPPM = Array(12).fill(0);

        let salesPrev = 0;
        let salesLast = 0;
        let rejPrev = 0;
        let rejLast = 0;

        let planPrevSum = 0;
        let planLastSum = 0;
        let planPrevCount = 0;
        let planLastCount = 0;

        ppmData.forEach(row => {
            salesPrev += row.salesPrev || 0;
            salesLast += row.salesLast || 0;
            rejPrev += row.rejPrev || 0;
            rejLast += row.rejLast || 0;

            if (row.planPpmPrev > 0) {
                planPrevSum += row.planPpmPrev;
                planPrevCount++;
            }
            if (row.planPpmLast > 0) {
                planLastSum += row.planPpmLast;
                planLastCount++;
            }

            (row.sales || []).forEach((s, i) => { monthlySales[i] += Number(s) || 0; });
            (row.rejection || []).forEach((r, i) => { monthlyRejection[i] += Number(r) || 0; });
            (row.planPPM || []).forEach((p, i) => {
                const val = Number(p) || 0;
                monthlyPlanPPM[i] += val;
            });
        });

        const totalSales = monthlySales.reduce((a, b) => a + b, 0);
        const totalRej = monthlyRejection.reduce((a, b) => a + b, 0);
        const totalPPM = totalSales === 0 ? 0 : Number(((totalRej * 1000000) / totalSales).toFixed(0));
        const ppmMonths = monthlySales.map((s, i) => s === 0 ? 0 : Number(((monthlyRejection[i] * 1000000) / s).toFixed(0)));

        const planPPMMonths = monthlyPlanPPM.map((total, i) => {
            const count = ppmData.filter(row => (row.planPPM?.[i] ?? 0) > 0).length;
            return count === 0 ? 0 : Number((total / count).toFixed(0));
        });

        const activeMonths = planPPMMonths.filter(p => p > 0);
        const totalPlanPPM = activeMonths.length === 0 ? 0 : Number((activeMonths.reduce((a, b) => a + b, 0) / activeMonths.length).toFixed(0));

        const totalPPMLast = salesLast === 0 ? 0 : Number(((rejLast * 1000000) / salesLast).toFixed(0));
        const totalPlanPpmPrev = planPrevCount === 0 ? 0 : Number((planPrevSum / planPrevCount).toFixed(0));
        const totalPlanPpmLast = planLastCount === 0 ? 0 : Number((planLastSum / planLastCount).toFixed(0));

        return {
            salesPrev, salesLast, rejPrev, rejLast,
            monthlySales, monthlyRejection, totalSales, totalRej,
            totalPPM, ppmMonths, monthlyPlanPPM, planPPMMonths, totalPlanPPM, totalPPMLast,
            totalPlanPpmPrev, totalPlanPpmLast
        };

    }, [ppmData]);

    const trendRows = useMemo(() => {
        if (selectedCustomerId) {
            return ppmData.filter(row => row.customerId === selectedCustomerId);
        }
        return ppmData;
    }, [selectedCustomerId, ppmData]);

    const trendTotals = useMemo(() => {
        if (!trendRows.length) return null;

        const monthlySales = Array(12).fill(0);
        const monthlyRejection = Array(12).fill(0);
        const monthlyPlanPPM = Array(12).fill(0);

        let salesPrev = 0;
        let salesLast = 0;
        let rejPrev = 0;
        let rejLast = 0;

        let planPrevSum = 0;
        let planLastSum = 0;
        let planPrevCount = 0;
        let planLastCount = 0;

        trendRows.forEach(row => {
            salesPrev += row.salesPrev || 0;
            salesLast += row.salesLast || 0;
            rejPrev += row.rejPrev || 0;
            rejLast += row.rejLast || 0;

            if (row.planPpmPrev > 0) {
                planPrevSum += row.planPpmPrev;
                planPrevCount++;
            }
            if (row.planPpmLast > 0) {
                planLastSum += row.planPpmLast;
                planLastCount++;
            }

            (row.sales || []).forEach((s, i) => { monthlySales[i] += Number(s) || 0; });
            (row.rejection || []).forEach((r, i) => { monthlyRejection[i] += Number(r) || 0; });
            (row.planPPM || []).forEach((p, i) => {
                const val = Number(p) || 0;
                monthlyPlanPPM[i] += val;
            });
        });

        const totalSales = monthlySales.reduce((a, b) => a + b, 0);
        const totalRej = monthlyRejection.reduce((a, b) => a + b, 0);
        const totalPPM = totalSales === 0 ? 0 : Number(((totalRej * 1000000) / totalSales).toFixed(0));
        const ppmMonths = monthlySales.map((s, i) => s === 0 ? 0 : Number(((monthlyRejection[i] * 1000000) / s).toFixed(0)));

        const planPPMMonths = monthlyPlanPPM.map((total, i) => {
            const count = trendRows.filter(row => (row.planPPM?.[i] ?? 0) > 0).length;
            return count === 0 ? 0 : Number((total / count).toFixed(0));
        });

        const activeMonths = planPPMMonths.filter(p => p > 0);
        const totalPlanPPM = activeMonths.length === 0 ? 0 : Number((activeMonths.reduce((a, b) => a + b, 0) / activeMonths.length).toFixed(0));

        const totalPPMLast = salesLast === 0 ? 0 : Number(((rejLast * 1000000) / salesLast).toFixed(0));
        const totalPlanPpmPrev = planPrevCount === 0 ? 0 : Number((planPrevSum / planPrevCount).toFixed(0));
        const totalPlanPpmLast = planLastCount === 0 ? 0 : Number((planLastSum / planLastCount).toFixed(0));

        return {
            salesPrev, salesLast, rejPrev, rejLast,
            monthlySales, monthlyRejection, totalSales, totalRej,
            totalPPM, ppmMonths, monthlyPlanPPM, planPPMMonths, totalPlanPPM, totalPPMLast,
            totalPlanPpmPrev, totalPlanPpmLast
        };
    }, [trendRows]);

    const monthlyTrend = useMemo(() => {

        if (!trendRows.length) return [];

        const monthlySales = Array(12).fill(0);
        const monthlyRejection = Array(12).fill(0);
        const monthlyPlan = Array(12).fill(0);

        trendRows.forEach(row => {

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
                sales: monthlySales[i] || 0,
                actual: Number(actualPPM.toFixed(0)),
                plan: monthlyPlan[i] || 0
            };

        });

    }, [trendRows]);

    const yearlyTrend = useMemo(() => {

        if (!trendRows.length || !trendTotals) return [];

        return [
            {
                year: lastYear,
                actual: Math.round(trendTotals.totalPPMLast),
                plan: Math.round(trendTotals.totalPlanPpmLast)
            },
            {
                year: currentYear,
                actual: Math.round(trendTotals.totalPPM),
                plan: Math.round(trendTotals.totalPlanPPM)
            }
        ];

    }, [trendRows, trendTotals]);

    const processedTrends = useMemo(() => {
        const processGroup = (dataArray, keyField) => {
            const filtered = selectedCustomerId
                ? (dataArray || []).filter(item => item.CustomerId === selectedCustomerId)
                : (dataArray || []);

            const grouped = {};
            filtered.forEach(item => {
                const key = item[keyField] || "Unknown";
                if (!grouped[key]) {
                    grouped[key] = 0;
                }
                grouped[key] += item.ComplaintCount;
            });

            return Object.entries(grouped)
                .map(([name, value]) => ({ name, value }))
                .filter(item => item.value > 0)
                .sort((a, b) => b.value - a.value);
        };

        return {
            defect: processGroup(trendsSourceData.DefectTrends, "Defect"),
            fourM: processGroup(trendsSourceData.FourMTrends, "FourM"),
            model: processGroup(trendsSourceData.ModelTrends, "Model"),
            part: processGroup(trendsSourceData.PartTrends, "Part"),
        };
    }, [trendsSourceData, selectedCustomerId]);

    const COLORS = ["#1976d2", "#ff9800", "#4caf50", "#f44336", "#9c27b0", "#00bcd4", "#ffeb3b", "#e91e63", "#3f51b5", "#009688"];

    const exportRef = useRef(null);
    const monthlyExportRef = useRef(null);
    const defectPieRef = useRef(null);
    const fourMPieRef = useRef(null);
    const modelPieRef = useRef(null);
    const partPieRef = useRef(null);

    const handlePieDownload = async (data, title, fileName) => {
        setExportPieInfo({ data, title, fileName });

        setTimeout(async () => {
            if (!hiddenPieExportRef.current) return;
            try {
                const canvas = await html2canvas(hiddenPieExportRef.current, {
                    backgroundColor: "#ffffff",
                    scale: 2,
                    useCORS: true,
                    logging: false
                });
                const image = canvas.toDataURL("image/jpeg", 1.0);
                const link = document.createElement("a");
                link.href = image;
                link.download = `${fileName}.jpeg`;
                link.click();
            } catch (error) {
                console.error("Download failed:", error);
            } finally {
                setExportPieInfo(null);
            }
        }, 150);
    };

    const CustomPieLegend = ({ data }) => (
        <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1.5, pb: 1 }}>
            {data.map((entry, index) => (
                <Box key={index} sx={{ display: "flex", alignItems: "center" }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: COLORS[index % COLORS.length], mr: 0.5, borderRadius: "2px" }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: COLORS[index % COLORS.length] }}>
                        {entry.name}
                    </Typography>
                </Box>
            ))}
        </Box>
    );

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

    const handleSalesQuantityDownload = async () => {
        if (!salesQuantityRef.current) return;

        try {
            const canvas = await html2canvas(salesQuantityRef.current, {
                backgroundColor: "#ffffff",
                scale: 2,
                useCORS: true
            });

            const image = canvas.toDataURL("image/jpeg", 1.0);

            const link = document.createElement("a");
            link.href = image;
            link.download = "Sales-Quantity-Trend.jpeg";
            link.click();
        } catch (error) {
            console.error("Download failed:", error);
        }
    };
    const handleExcelDownload = () => {

    const workbook = XLSX.utils.book_new();
    const wsData = [];

    // ================= HEADER ROW 1 =================
    wsData.push([
        "Customer",
        "Type",
        String(previousYear),
        String(lastYear),
        `${currentYear} Avg`,
        String(currentYear),
        "", "", "", "", "", "", "", "", "", "", "",
        "Remarks",
        "Reduced %"
    ]);

    // ================= HEADER ROW 2 =================
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

    // ================= CUSTOMER DATA =================
    ppmData.forEach((row) => {

        // REJ QTY
        wsData.push([
            row.customerName,
            "REJ QTY",
            row.rejPrev,
            row.rejLast,
            calculateDisplayedAverage(row.rejection),
            ...(row.rejection || Array(12).fill(0)),
            "",
            "-100%"
        ]);

        // SALES QTY
        wsData.push([
            "",
            "SALES QTY",
            row.salesPrev,
            row.salesLast,
            calculateDisplayedAverage(row.sales),
            ...(row.sales || Array(12).fill(0)),
            "",
            ""
        ]);

        // PLAN PPM
        wsData.push([
            "",
            "PLAN PPM",
            row.planPpmPrev,
            row.planPpmLast,
            row.avgPlanPPM,
            ...(row.planPPM || Array(12).fill(0)),
            "",
            ""
        ]);

        // ACTUAL PPM
        wsData.push([
            "",
            "ACTUAL PPM",
            row.ppmPrev,
            row.ppmLast,
            calculateDisplayedAverage(row.ppmMonths),
            ...(row.ppmMonths || Array(12).fill(0)),
            "",
            ""
        ]);
    });

    // ================= TOTAL SECTION =================
    if (totals) {

        wsData.push([
            "TOTAL",
            "REJ QTY",
            totals.rejPrev,
            totals.rejLast,
            calculateDisplayedAverage(totals.monthlyRejection),
            ...(totals.monthlyRejection || Array(12).fill(0)),
            "",
            ""
        ]);

        wsData.push([
            "",
            "SALES QTY",
            totals.salesPrev,
            totals.salesLast,
            calculateDisplayedAverage(totals.monthlySales),
            ...(totals.monthlySales || Array(12).fill(0)),
            "",
            ""
        ]);

        wsData.push([
            "",
            "PLAN PPM",
            totals.totalPlanPpmPrev,
            totals.totalPlanPpmLast,
            totals.totalPlanPPM,
            ...(totals.planPPMMonths || Array(12).fill(0)),
            "",
            ""
        ]);

        wsData.push([
            "",
            "ACTUAL PPM",
            "-",
            "-",
            calculateDisplayedAverage(totals.ppmMonths),
            ...(totals.ppmMonths || Array(12).fill(0)),
            "",
            ""
        ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // ================= MERGES =================
    ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
        { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
        { s: { r: 0, c: 5 }, e: { r: 0, c: 16 } },
        { s: { r: 0, c: 17 }, e: { r: 1, c: 17 } },
        { s: { r: 0, c: 18 }, e: { r: 1, c: 18 } }
    ];

    // ================= HEADER STYLE =================
    const headerStyle = {
        font: {
            bold: true,
            color: { rgb: "000000" }
        },
        alignment: {
            horizontal: "center",
            vertical: "center"
        },
        fill: {
            fgColor: { rgb: "C9DAEB" }
        },
        border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
        }
    };

    const subHeaderStyle = {
        font: {
            bold: true
        },
        alignment: {
            horizontal: "center",
            vertical: "center"
        },
        fill: {
            fgColor: { rgb: "CADBEC" }
        },
        border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
        }
    };

    // Header style
    for (let col = 0; col <= 18; col++) {

        const cell1 = XLSX.utils.encode_cell({ r: 0, c: col });
        const cell2 = XLSX.utils.encode_cell({ r: 1, c: col });

        if (ws[cell1]) ws[cell1].s = headerStyle;
        if (ws[cell2]) ws[cell2].s = subHeaderStyle;
    }

    // ================= COLUMN WIDTH =================
    ws["!cols"] = [
        { wch: 18 },
        { wch: 15 },
        ...Array(17).fill({ wch: 12 })
    ];

    XLSX.utils.book_append_sheet(workbook, ws, "PPM Report");

    XLSX.writeFile(
        workbook,
        `PPM_Report_${currentYear}.xlsx`
    );
};

/*
    const handleExcelDownload = () => {
        const workbook = XLSX.utils.book_new();

        const wsData = [];

        // === HEADER ROW 1 ===
        wsData.push([
            "Customer",
            "Type",
            String(previousYear),
            String(lastYear),
            `${currentYear} Avg`,
            String(currentYear),
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
                row.rejPrev,
                row.rejLast,
                calculateDisplayedAverage(row.rejection),
                ...row.rejection,
                "",
                "-100%"
            ]);

            wsData.push([
                "",
                "SALES QTY",
                row.salesPrev,
                row.salesLast,
                calculateDisplayedAverage(row.sales),
                ...row.sales,
                "",
                ""
            ]);

            wsData.push([
                "",
                "PLAN PPM",
                row.planPpmPrev,
                row.planPpmLast,
                totals.totalPlanPPM,
                ...totals.planPPMMonths,
                "",
                ""
            ]);

            wsData.push([
                "",
                "ACTUAL PPM",
                row.ppmPrev,
                row.ppmLast,
                calculateDisplayedAverage(row.ppmMonths),
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
*/
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


    const calculateDisplayedAverage = (arr = []) => {
        const activeValues = (arr || []).map(v => Number(v) || 0).filter(v => v > 0);
        if (activeValues.length === 0) return 0;

        return Math.round(
            activeValues.reduce((sum, val) => sum + val, 0) / activeValues.length
        );
    };

    const renderStaticPieLabel = (props) => {
        const { cx, cy, midAngle, outerRadius, percent, name, fill, value } = props;

        // Hide very small slices
        if (!value || percent < 0.03) return null;

        const RADIAN = Math.PI / 180;
        const sin = Math.sin(-RADIAN * midAngle);
        const cos = Math.cos(-RADIAN * midAngle);

        const radius = outerRadius + 30; // Push label outside pie
        const x = cx + radius * cos;
        const y = cy + radius * sin;
        const textAnchor = cos >= 0 ? 'start' : 'end';

        const percentage = (percent * 100).toFixed(0) + "%";

        return (
            <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central">
                <tspan x={x} dy="-0.6em" fill={fill} fontSize={20} fontWeight="bold">
                    {percentage}
                </tspan>
                <tspan x={x} dy="1.4em" fill={fill} fontSize={16} fontWeight={500}>
                    {name}
                </tspan>
            </text>
        );
    };

    return (
        <Box >

            <Typography align="left" fontWeight="bold" fontSize={20} mb={1} >
                CUSTOMER PPM REPORT - {currentYear}
            </Typography>

            {selectedCustomerId && (
                <Box
                    sx={{
                        mb: 2,
                        p: 1.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        bgcolor: "#e3f2fd",
                        borderRadius: 2,
                        border: "1px solid #bbdefb"
                    }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#0d47a1" }}>
                        Currently showing trends for: {ppmData.find(c => c.customerId === selectedCustomerId)?.customerName}
                    </Typography>
                    <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => setSelectedCustomerId(null)}
                        sx={{ textTransform: "none" }}
                    >
                        Show All Customers
                    </Button>
                </Box>
            )}

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
                            <BarChart data={yearlyTrend} barGap={8}>
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

                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    wrapperStyle={{ paddingBottom: 20, fontSize: 12 }}
                                />

                                <Bar
                                    dataKey="plan"
                                    name="Plan PPM"
                                    radius={[4, 4, 0, 0]}
                                    fill="#94a3b8"
                                    barSize={32}
                                >
                                    <LabelList dataKey="plan" position="top" fill="#94a3b8" style={{ fontSize: 11, fontWeight: 600 }} />
                                </Bar>
                                <Bar
                                    dataKey="actual"
                                    name="Actual PPM"
                                    radius={[4, 4, 0, 0]}
                                    fill="#6366f1"
                                    barSize={32}
                                >
                                    <LabelList dataKey="actual" position="top" fill="#6366f1" style={{ fontSize: 11, fontWeight: 600 }} />
                                </Bar>
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
                                >
                                    <LabelList dataKey="plan" position="top" fill="#3b82f6" style={{ fontSize: 11, fontWeight: 600 }} />
                                </Line>

                                <Line
                                    type="monotone"
                                    dataKey="actual"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                >
                                    <LabelList dataKey="actual" position="top" fill="#ef4444" style={{ fontSize: 11, fontWeight: 600 }} />
                                </Line>
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* <Grid item xs={12} md={12}>
                    <Paper
                        ref={salesQuantityRef}
                        sx={{
                            p: 2,
                            borderRadius: 4,
                            background: "linear-gradient(145deg,#ffffff,#f8fafc)",
                            boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                            position: "relative"
                        }}
                    >
                        <IconButton
                            onClick={handleSalesQuantityDownload}
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
                            Sales Quantity Trend
                        </Typography>

                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart
                                data={monthlyTrend}
                                margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                            >
                                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />

                                <XAxis
                                    dataKey="month"
                                    tick={{ fill: "#64748b", fontSize: 12 }}
                                />

                                <YAxis
                                    tick={{ fill: "#64748b", fontSize: 12 }}
                                    domain={[0, dataMax => dataMax === 0 ? 100 : Math.ceil(dataMax * 1.2)]}
                                />

                                <Tooltip />

                                <Line
                                    type="monotone"
                                    dataKey="sales"
                                    name="Sales Quantity"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                >
                                    <LabelList dataKey="sales" position="top" fill="#10b981" style={{ fontSize: 11, fontWeight: 600 }} />
                                </Line>
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid> */}

            </Grid>

            {/* ================= TREND PIE CHARTS ================= */}
            <Grid container spacing={4} mb={3}>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, borderRadius: 4, background: "#ffffff", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", height: "100%", border: "1px solid #f0f0f0", position: "relative" }}>
                        <IconButton onClick={() => handlePieDownload(processedTrends.defect, "Defect wise Rejections", "Defect_wise_Rejections")} sx={{ position: "absolute", top: 8, right: 8 }} size="small">
                            <DownloadIcon sx={{ color: "#64748b", fontSize: 20 }} />
                        </IconButton>
                        <Typography variant="subtitle2" fontWeight={600} mb={1} color="#1976d2" align="left">Defect wise Rejections</Typography>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={processedTrends.defect} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} stroke="#fff" strokeWidth={2} label={false} labelLine={false}>
                                    {processedTrends.defect.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, borderRadius: 4, background: "#ffffff", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", height: "100%", border: "1px solid #f0f0f0", position: "relative" }}>
                        <IconButton onClick={() => handlePieDownload(processedTrends.fourM, "4M wise Rejections", "4M_wise_Rejections")} sx={{ position: "absolute", top: 8, right: 8 }} size="small">
                            <DownloadIcon sx={{ color: "#64748b", fontSize: 20 }} />
                        </IconButton>
                        <Typography variant="subtitle2" fontWeight={600} mb={1} color="#e91e63" align="left">4M wise Rejections</Typography>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={processedTrends.fourM} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} stroke="#fff" strokeWidth={2} label={false} labelLine={false}>
                                    {processedTrends.fourM.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, borderRadius: 4, background: "#ffffff", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", height: "100%", border: "1px solid #f0f0f0", position: "relative" }}>
                        <IconButton onClick={() => handlePieDownload(processedTrends.model, "Model Rejections", "Model_wise_Rejections")} sx={{ position: "absolute", top: 8, right: 8 }} size="small">
                            <DownloadIcon sx={{ color: "#64748b", fontSize: 20 }} />
                        </IconButton>
                        <Typography variant="subtitle2" fontWeight={600} mb={1} color="#1976d2" align="left">Model Rejections</Typography>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={processedTrends.model} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} stroke="#fff" strokeWidth={2} label={false} labelLine={false}>
                                    {processedTrends.model.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, borderRadius: 4, background: "#ffffff", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", height: "100%", border: "1px solid #f0f0f0", position: "relative" }}>
                        <IconButton onClick={() => handlePieDownload(processedTrends.part, "Part Rejections", "Part_wise_Rejections")} sx={{ position: "absolute", top: 8, right: 8 }} size="small">
                            <DownloadIcon sx={{ color: "#64748b", fontSize: 20 }} />
                        </IconButton>
                        <Typography variant="subtitle2" fontWeight={600} mb={1} color="#e91e63" align="left">Part Rejections</Typography>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={processedTrends.part} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} stroke="#fff" strokeWidth={2} label={false} labelLine={false}>
                                    {processedTrends.part.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* HIDDEN EXPORT CONTAINER (No Flicker) */}
            <Box sx={{ position: 'absolute', top: -9999, left: -9999, zIndex: -1 }}>
                <Paper ref={hiddenPieExportRef} sx={{ width: 800, height: 800, p: 4, borderRadius: 4, background: "#ffffff" }}>
                    {exportPieInfo && (
                        <>
                            <Typography variant="h5" fontWeight={700} mb={4} color="#1976d2" align="center">
                                {exportPieInfo.title}
                            </Typography>
                            <ResponsiveContainer width="100%" height={650}>
                                <PieChart>
                                    <Pie
                                        data={exportPieInfo.data}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={130}
                                        outerRadius={200}
                                        stroke="#fff"
                                        strokeWidth={3}
                                        label={renderStaticPieLabel}
                                        labelLine={false}
                                        isAnimationActive={false}
                                    >
                                        {exportPieInfo.data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <CustomPieLegend data={exportPieInfo.data} />
                        </>
                    )}
                </Paper>
            </Box>

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

                                <TableCell><b>{previousYear}</b></TableCell>
                                <TableCell><b>{lastYear}</b></TableCell>
                                <TableCell><b>{currentYear}</b></TableCell>

                                <TableCell colSpan={13}><b>{currentYear}</b></TableCell>
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
                                        <TableCell
                                            rowSpan={4}
                                            sx={{
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                color: selectedCustomerId === row.customerId ? "#1976d2" : "inherit",
                                                backgroundColor: selectedCustomerId === row.customerId ? "#e3f2fd" : "inherit",
                                                "&:hover": {
                                                    backgroundColor: "#f5f5f5"
                                                }
                                            }}
                                            onClick={() => setSelectedCustomerId(row.customerId)}
                                        >
                                            {row.customerName}
                                        </TableCell>

                                        <TableCell sx={{ fontWeight: 600 }}>
                                            REJ QTY
                                        </TableCell>

                                        <TableCell>{row.rejPrev ?? "-"}</TableCell>
                                        <TableCell>{row.rejLast ?? "-"}</TableCell>
                                        <TableCell>
                                            {calculateDisplayedAverage(row.rejection) || "-"}
                                        </TableCell>

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
                                        <TableCell>
                                            {calculateDisplayedAverage(row.sales) || "-"}
                                        </TableCell>

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

                                        <TableCell>{row.planPpmPrev}</TableCell>
                                        <TableCell>{row.planPpmLast}</TableCell>
                                        <TableCell>{row.avgPlanPPM}</TableCell>

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
                                                color: row.ppmPrev > row.planPpmPrev ? "#d32f2f" : "#2e7d32"
                                            }}
                                        >
                                            {row.ppmPrev ?? "-"}
                                        </TableCell>

                                        <TableCell
                                            sx={{
                                                fontWeight: 600,
                                                color: row.ppmLast > row.planPpmLast ? "#d32f2f" : "#2e7d32"
                                            }}
                                        >
                                            {row.ppmLast ?? "-"}
                                        </TableCell>

                                        <TableCell
                                            sx={{
                                                fontWeight: 600,
                                                color: calculateDisplayedAverage(row.ppmMonths) > row.avgPlanPPM ? "#d32f2f" : "#2e7d32"
                                            }}
                                        >
                                            {calculateDisplayedAverage(row.ppmMonths) || "-"}
                                        </TableCell>

                                        {(row.ppmMonths || []).map((val, i) => (
                                            <TableCell
                                                key={i}
                                                sx={{
                                                    fontWeight: 600,
                                                    color:
                                                        val > (row.planPPM?.[i] ?? 0)
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

                            {totals && (
    <>
        {/* REJ QTY */}
        <TableRow sx={{ background: "#f1f5f9", fontWeight: 700 }}>
            <TableCell rowSpan={4}><b>TOTAL</b></TableCell>

            <TableCell><b>REJ QTY</b></TableCell>

            <TableCell>{totals.rejPrev}</TableCell>
            <TableCell>{totals.rejLast}</TableCell>

            <TableCell>
                {
                    ppmData.length
                        ? Math.round(
                            ppmData.reduce(
                                (sum, row) =>
                                    sum + calculateDisplayedAverage(row.rejection),
                                0
                            ) / ppmData.length
                        )
                        : 0
                }
            </TableCell>

            {(totals.monthlyRejection || []).map((v, i) => (
                <TableCell key={i}>{v}</TableCell>
            ))}
        </TableRow>

        {/* SALES QTY */}
        <TableRow sx={{ background: "#f1f5f9", fontWeight: 700 }}>
            <TableCell><b>SALES QTY</b></TableCell>

            <TableCell>{totals.salesPrev}</TableCell>
            <TableCell>{totals.salesLast}</TableCell>

            <TableCell>
                {calculateDisplayedAverage(totals.monthlySales)}
            </TableCell>

            {(totals.monthlySales || []).map((v, i) => (
                <TableCell key={i}>{v}</TableCell>
            ))}
        </TableRow>

        {/* PLAN PPM */}
        <TableRow sx={{ background: "#f1f5f9", fontWeight: 700 }}>
            <TableCell><b>PLAN PPM</b></TableCell>

            <TableCell>{totals.totalPlanPpmPrev}</TableCell>
            <TableCell>{totals.totalPlanPpmLast}</TableCell>

            <TableCell>{totals.totalPlanPPM}</TableCell>

            {(totals.planPPMMonths || []).map((v, i) => (
                <TableCell key={i}>{v}</TableCell>
            ))}
        </TableRow>

        {/* ACTUAL PPM */}
        <TableRow sx={{ background: "#f1f5f9", fontWeight: 700 }}>
            <TableCell><b>ACTUAL PPM</b></TableCell>

            <TableCell>-</TableCell>
            <TableCell>-</TableCell>

            <TableCell>
                {
                    ppmData.length
                        ? Math.round(
                            ppmData.reduce(
                                (sum, row) =>
                                    sum + calculateDisplayedAverage(row.ppmMonths),
                                0
                            ) / ppmData.length
                        )
                        : 0
                }
            </TableCell>

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
