import React, { useMemo, useState } from 'react';
import {
    Box,
    Container,
    Grid,
    Typography,
    Card,
    CardContent,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Chip,
} from '@mui/material';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    LineChart,
    Line,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';

 
const dreData = [
    { dreId: 'DRE-001', model: 'FH', part: 'ENGINE', date: '2024-01-10', status: 'Submitted' },
    { dreId: 'DRE-002', model: 'FH', part: 'BRAKE DISC', date: '2024-01-18', status: 'Submitted' },
    { dreId: 'DRE-003', model: 'HQ', part: 'ENGINE', date: '2024-02-05', status: 'Completed' },
    { dreId: 'DRE-004', model: 'SV', part: 'WHEEL BEARING', date: '2024-02-22', status: 'Submitted' },
    { dreId: 'DRE-005', model: 'FH', part: 'ENGINE', date: '2024-03-12', status: 'Completed' },
    { dreId: 'DRE-006', model: 'HQ', part: 'BRAKE DISC', date: '2024-04-03', status: 'Submitted' },
    { dreId: 'DRE-007', model: 'SV', part: 'ENGINE', date: '2024-04-19', status: 'Completed' },
    { dreId: 'DRE-008', model: 'FH', part: 'WHEEL BEARING', date: '2024-05-01', status: 'Completed' },
    { dreId: 'DRE-009', model: 'HQ', part: 'ENGINE', date: '2024-05-20', status: 'Submitted' },
    { dreId: 'DRE-010', model: 'SV', part: 'BRAKE DISC', date: '2024-06-11', status: 'Completed' },
];

/* ---------------- CONSTANTS ---------------- */
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#06b6d4', '#ec4899'];

const ModernChartCard = ({ title, subtitle, children, height = 300 }) => (
    <Card
        sx={{
            height: '100%',
            borderRadius: 3,
            border: '1px solid #e5e7eb',
            boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
        }}
    >
        <CardContent>
            <Typography fontWeight={600}>{title}</Typography>
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

const DREAnalysis = () => {
    const [modelFilter, setModelFilter] = useState('All');
    const [fromDate, setFromDate] = useState('2024-01-01');
    const [toDate, setToDate] = useState('2024-12-31');

    /* -------- FILTERED DATA -------- */
    const filteredData = useMemo(() => {
        return dreData.filter((d) => {
            const dt = new Date(d.date);
            return (
                (modelFilter === 'All' || d.model === modelFilter) &&
                dt >= new Date(fromDate) &&
                dt <= new Date(toDate)
            );
        });
    }, [modelFilter, fromDate, toDate]);

    /* -------- ANALYTICS -------- */
    const modelAnalysis = useMemo(() => {
        const map = {};
        filteredData.forEach((d) => {
            map[d.model] = (map[d.model] || 0) + 1;
        });
        return Object.entries(map).map(([name, count]) => ({ name, count }));
    }, [filteredData]);

    const partAnalysis = useMemo(() => {
        const map = {};
        filteredData.forEach((d) => {
            map[d.part] = (map[d.part] || 0) + 1;
        });
        return Object.entries(map).map(([name, count]) => ({ name, count }));
    }, [filteredData]);

    const statusAnalysis = useMemo(() => {
        const map = {};
        filteredData.forEach((d) => {
            map[d.status] = (map[d.status] || 0) + 1;
        });
        return Object.entries(map).map(([name, count]) => ({ name, count }));
    }, [filteredData]);

    const monthlyTrend = useMemo(() => {
        const map = {};
        filteredData.forEach((d) => {
            const m = new Date(d.date).toLocaleString('default', {
                month: 'short',
                year: 'numeric',
            });
            map[m] = (map[m] || 0) + 1;
        });
        return Object.entries(map).map(([month, count]) => ({
            month,
            count,
        }));
    }, [filteredData]);

    /* ---------------- UI ---------------- */
    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Typography fontSize={28} fontWeight={700} sx={{ mb: 3 }}>
                DRE Analysis Dashboard
            </Typography>

            {/* FILTERS */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Model</InputLabel>
                                <Select
                                    value={modelFilter}
                                    label="Model"
                                    onChange={(e) => setModelFilter(e.target.value)}
                                >
                                    <MenuItem value="All">All</MenuItem>
                                    <MenuItem value="FH">FH</MenuItem>
                                    <MenuItem value="HQ">HQ</MenuItem>
                                    <MenuItem value="SV">SV</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <TextField
                                type="date"
                                label="From"
                                size="small"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <TextField
                                type="date"
                                label="To"
                                size="small"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* SUMMARY */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    ['Total DREs', filteredData.length],
                    ['Models', new Set(filteredData.map((d) => d.model)).size],
                    ['Parts', new Set(filteredData.map((d) => d.part)).size],
                    ['Completed', filteredData.filter((d) => d.status === 'Completed').length],
                ].map(([label, value]) => (
                    <Grid item xs={6} md={3} key={label}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography fontWeight={700}>{value}</Typography>
                            <Typography variant="caption">{label}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* CHARTS */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <ModernChartCard title="Model-wise DRE Count">
                        <BarChart data={modelAnalysis}>
                            <CartesianGrid strokeDasharray="4 4" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ModernChartCard>
                </Grid>

                <Grid item xs={12} md={6}>
                    <ModernChartCard title="Part-wise Analysis">
                        <PieChart>
                            <Pie data={partAnalysis} dataKey="count" nameKey="name" outerRadius={90}>
                                {partAnalysis.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ModernChartCard>
                </Grid>

                <Grid item xs={12} md={6}>
                    <ModernChartCard title="DRE Status Distribution">
                        <PieChart>
                            <Pie data={statusAnalysis} dataKey="count" nameKey="name" outerRadius={90}>
                                {statusAnalysis.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ModernChartCard>
                </Grid>

                <Grid item xs={12} md={6}>
                    <ModernChartCard title="Monthly DRE Trend">
                        <LineChart data={monthlyTrend}>
                            <CartesianGrid strokeDasharray="4 4" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line
                                dataKey="count"
                                stroke="#22c55e"
                                strokeWidth={3}
                                dot={false}
                            />
                            <ReferenceLine
                                x="Mar 2024"
                                stroke="#000"
                                strokeDasharray="6 6"
                                label="Process Improvement"
                            />
                        </LineChart>
                    </ModernChartCard>
                </Grid>
            </Grid>
        </Container>
    );
};

export default DREAnalysis;
