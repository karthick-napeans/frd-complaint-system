import React, { useState, useMemo } from 'react';
import {
    Box,
    Container,
    Card,
    CardContent,
    Grid,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    Chip,
    DialogActions,
    Button as MuiButton,
} from '@mui/material';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart,
    ReferenceLine,
} from 'recharts';
import SettingsIcon from '@mui/icons-material/Settings';

/* ================= COLORS & STYLES ================= */
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4'];

const gridStyle = {
    stroke: '#eaeef4',
    strokeDasharray: '4 4',
};

const axisStyle = {
    tick: { fill: '#6b7280', fontSize: 12 },
    axisLine: false,
    tickLine: false,
};

const tooltipStyle = {
    contentStyle: {
        borderRadius: 12,
        border: 'none',
        boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
    },
};

/* ================= CARD ================= */
const ModernChartCard = ({ title, subtitle, children, height = 320 }) => (
    <Card
        sx={{
            height: '100%',
            borderRadius: 4,
            background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
            border: '1px solid #eef2f6',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
        }}
    >
        <CardContent>
            <Typography fontWeight={600} fontSize={16}>
                {title}
            </Typography>
            {subtitle && (
                <Typography variant="caption" color="text.secondary">
                    {subtitle}
                </Typography>
            )}
            <Box sx={{ mt: 2 }}>
                <ResponsiveContainer width="100%" height={height}>
                    {children}
                </ResponsiveContainer>
            </Box>
        </CardContent>
    </Card>
);

/* ================= MAIN COMPONENT ================= */
const ComplaintAnalysis = () => {
    const [customer, setCustomer] = useState('Customer A');
    const [fromDate, setFromDate] = useState('2023-01-01');
    const [toDate, setToDate] = useState('2025-12-31');

    /* -------- BASELINE CONFIG -------- */
    const [masterConfig, setMasterConfig] = useState({
        lastImprovementDate: '2024-02',
        improvementDescription: 'Complaint handling process optimization',
    });

    const [openConfigDialog, setOpenConfigDialog] = useState(false);
    const [tempConfig, setTempConfig] = useState(masterConfig);

    const complaintData = [
        // ===================== 2023 (BEFORE IMPROVEMENT) =====================
        { id: 1, customer: 'Customer A', category: 'Product Quality', severity: 'High', date: '2023-01-12', resolution_days: 10 },
        { id: 2, customer: 'Customer B', category: 'Service Delay', severity: 'High', date: '2023-02-08', resolution_days: 9 },
        { id: 3, customer: 'Customer C', category: 'Billing Issue', severity: 'Medium', date: '2023-02-25', resolution_days: 6 },
        { id: 4, customer: 'Customer A', category: 'Dealer Issue', severity: 'Medium', date: '2023-03-18', resolution_days: 7 },
        { id: 5, customer: 'Customer B', category: 'Product Quality', severity: 'High', date: '2023-04-22', resolution_days: 11 },

        { id: 6, customer: 'Customer C', category: 'Service Delay', severity: 'Medium', date: '2023-05-10', resolution_days: 8 },
        { id: 7, customer: 'Customer A', category: 'Billing Issue', severity: 'Low', date: '2023-06-01', resolution_days: 4 },
        { id: 8, customer: 'Customer B', category: 'Dealer Issue', severity: 'Medium', date: '2023-06-19', resolution_days: 6 },
        { id: 9, customer: 'Customer C', category: 'Product Quality', severity: 'High', date: '2023-07-14', resolution_days: 10 },
        { id: 10, customer: 'Customer A', category: 'Service Delay', severity: 'Medium', date: '2023-08-03', resolution_days: 7 },

        { id: 11, customer: 'Customer B', category: 'Billing Issue', severity: 'Low', date: '2023-09-09', resolution_days: 3 },
        { id: 12, customer: 'Customer C', category: 'Product Quality', severity: 'High', date: '2023-10-21', resolution_days: 9 },
        { id: 13, customer: 'Customer A', category: 'Dealer Issue', severity: 'Medium', date: '2023-11-11', resolution_days: 6 },
        { id: 14, customer: 'Customer B', category: 'Service Delay', severity: 'Medium', date: '2023-12-02', resolution_days: 7 },

        // ===================== 2024 (IMPROVEMENT APPLIED FEB) =====================
        { id: 15, customer: 'Customer C', category: 'Product Quality', severity: 'High', date: '2024-01-15', resolution_days: 8 },

        // 🔹 Improvement starts here
        { id: 16, customer: 'Customer A', category: 'Product Quality', severity: 'Medium', date: '2024-02-18', resolution_days: 6 },
        { id: 17, customer: 'Customer B', category: 'Service Delay', severity: 'Medium', date: '2024-03-12', resolution_days: 5 },
        { id: 18, customer: 'Customer C', category: 'Billing Issue', severity: 'Low', date: '2024-04-05', resolution_days: 3 },
        { id: 19, customer: 'Customer A', category: 'Dealer Issue', severity: 'Low', date: '2024-05-20', resolution_days: 3 },
        { id: 20, customer: 'Customer B', category: 'Product Quality', severity: 'Medium', date: '2024-06-30', resolution_days: 5 },

        // ===================== LATE 2024 (POST IMPROVEMENT STABLE) =====================
        { id: 21, customer: 'Customer C', category: 'Service Delay', severity: 'Low', date: '2024-07-22', resolution_days: 2 },
        { id: 22, customer: 'Customer A', category: 'Billing Issue', severity: 'Low', date: '2024-08-18', resolution_days: 2 },
        { id: 23, customer: 'Customer B', category: 'Dealer Issue', severity: 'Low', date: '2024-09-14', resolution_days: 3 },
        { id: 24, customer: 'Customer C', category: 'Product Quality', severity: 'Medium', date: '2024-10-06', resolution_days: 4 },
        { id: 25, customer: 'Customer A', category: 'Service Delay', severity: 'Low', date: '2024-11-19', resolution_days: 2 },

        // ===================== 2025 (CONTROLLED & OPTIMIZED) =====================
        { id: 26, customer: 'Customer B', category: 'Billing Issue', severity: 'Low', date: '2025-01-10', resolution_days: 1 },
        { id: 27, customer: 'Customer C', category: 'Service Delay', severity: 'Low', date: '2025-02-08', resolution_days: 2 },
        { id: 28, customer: 'Customer A', category: 'Product Quality', severity: 'Medium', date: '2025-03-05', resolution_days: 4 },
        { id: 29, customer: 'Customer B', category: 'Dealer Issue', severity: 'Low', date: '2025-04-12', resolution_days: 2 },
        { id: 30, customer: 'Customer C', category: 'Billing Issue', severity: 'Low', date: '2025-05-18', resolution_days: 1 },
    ];

    const filteredData = useMemo(() => {
        return complaintData.filter((c) => {
            const d = new Date(c.date);
            return (
                d >= new Date(fromDate) &&
                d <= new Date(toDate) &&
                (customer === 'All' || c.customer === customer)
            );
        });
    }, [customer, fromDate, toDate]);

    const categoryAnalysis = useMemo(() => {
        const map = {};
        filteredData.forEach((c) => {
            map[c.category] = (map[c.category] || 0) + 1;
        });
        return Object.entries(map).map(([name, count]) => ({ name, count }));
    }, [filteredData]);

    const severityAnalysis = useMemo(() => {
        const map = {};
        filteredData.forEach((c) => {
            map[c.severity] = (map[c.severity] || 0) + 1;
        });
        return Object.entries(map).map(([label, count]) => ({ label, count }));
    }, [filteredData]);

    const monthlyTrend = useMemo(() => {
        const map = {};
        filteredData.forEach((c) => {
            const m = new Date(c.date).toLocaleString('default', { month: 'short', year: 'numeric' });
            map[m] = (map[m] || 0) + 1;
        });
        return Object.entries(map).map(([month, count]) => ({ month, count }));
    }, [filteredData]);

    const resolutionBuckets = useMemo(() => {
        const buckets = { '0-2 Days': 0, '3-5 Days': 0, '6-10 Days': 0, '10+ Days': 0 };
        filteredData.forEach((c) => {
            if (c.resolution_days <= 2) buckets['0-2 Days']++;
            else if (c.resolution_days <= 5) buckets['3-5 Days']++;
            else if (c.resolution_days <= 10) buckets['6-10 Days']++;
            else buckets['10+ Days']++;
        });
        return Object.entries(buckets).map(([label, count]) => ({ label, count }));
    }, [filteredData]);

    const improvementTrendData = [
        { period: '2023 Q1', complaints: 85 },
        { period: '2023 Q2', complaints: 78 },
        { period: '2023 Q3', complaints: 70 },
        { period: '2023 Q4', complaints: 64 },
        { period: '2024 Q1', complaints: 55 },
        { period: '2024 Q2', complaints: 42 },
        { period: '2024 Q3', complaints: 35 },
        { period: '2024 Q4', complaints: 28 },
    ];

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    Customer Complaint Analysis
                </Typography>

            </Box>


            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Customer</InputLabel>
                                <Select value={customer} label="Customer" onChange={(e) => setCustomer(e.target.value)}>
                                    <MenuItem value="All">All</MenuItem>
                                    <MenuItem value="Customer A">Customer A</MenuItem>
                                    <MenuItem value="Customer B">Customer B</MenuItem>
                                    <MenuItem value="Customer C">Customer C</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField type="date" label="From" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField type="date" label="To" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
                        <Typography fontWeight={700}>{filteredData.length}</Typography>
                        <Typography variant="caption">Total Complaints</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f3e5f5' }}>
                        <Typography fontWeight={700}>{categoryAnalysis.length}</Typography>
                        <Typography variant="caption">Categories</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#e8f5e9' }}>
                        <Typography fontWeight={700}>{severityAnalysis.length}</Typography>
                        <Typography variant="caption">Severity Levels</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#fff3e0' }}>
                        <Typography fontWeight={700}>
                            {Math.round(filteredData.reduce((a, b) => a + b.resolution_days, 0) / Math.max(filteredData.length, 1))}
                        </Typography>
                        <Typography variant="caption">Avg Resolution Days</Typography>
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <ModernChartCard title="Complaints by Category">
                        <BarChart data={categoryAnalysis}>
                            <CartesianGrid {...gridStyle} />
                            <XAxis dataKey="name" {...axisStyle} />
                            <YAxis {...axisStyle} />
                            <Tooltip {...tooltipStyle} />
                            <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ModernChartCard>
                </Grid>

                <Grid item xs={12} md={6}>
                    <ModernChartCard title="Severity Distribution">
                        <PieChart>
                            <Pie data={severityAnalysis} dataKey="count" nameKey="label" innerRadius={55} outerRadius={90}>
                                {severityAnalysis.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip {...tooltipStyle} />
                            <Legend />
                        </PieChart>
                    </ModernChartCard>
                </Grid>

                <Grid item xs={12} md={6}>
                    <ModernChartCard title="Monthly Complaint Trend">
                        <LineChart data={monthlyTrend}>
                            <CartesianGrid {...gridStyle} />
                            <XAxis dataKey="month" {...axisStyle} />
                            <YAxis {...axisStyle} />
                            <Tooltip {...tooltipStyle} />
                            <Line dataKey="count" stroke="#22c55e" strokeWidth={3} dot={false} />
                        </LineChart>
                    </ModernChartCard>
                </Grid>

                <Grid item xs={12} md={6}>
                    <ModernChartCard title="Resolution Time Distribution">
                        <BarChart data={resolutionBuckets}>
                            <CartesianGrid {...gridStyle} />
                            <XAxis dataKey="label" {...axisStyle} />
                            <YAxis {...axisStyle} />
                            <Tooltip {...tooltipStyle} />
                            <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ModernChartCard>
                </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
                <ModernChartCard title="Complaint Reduction After Improvement" height={420}>
                    <ComposedChart data={improvementTrendData}>
                        <CartesianGrid {...gridStyle} />
                        <XAxis dataKey="period" {...axisStyle} />
                        <YAxis {...axisStyle} />
                        <Tooltip {...tooltipStyle} />
                        <Bar dataKey="complaints" fill="#6366f1" radius={[6, 6, 0, 0]} />
                        <ReferenceLine
                            x="2024 Q2"
                            stroke="#000"
                            strokeDasharray="6 6"
                            strokeWidth={3}
                            label={{
                                value: masterConfig.lastImprovementDate,
                                fill: '#000',
                                fontWeight: 600,
                            }}
                        />
                    </ComposedChart>
                </ModernChartCard>
            </Box>

        </Container>
    );
};

export default ComplaintAnalysis;
