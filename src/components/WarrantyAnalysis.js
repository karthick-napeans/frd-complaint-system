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
  DialogContent, Chip,
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
  ReferenceLine
} from 'recharts';
import SettingsIcon from '@mui/icons-material/Settings';

const WarrantyAnalysis = () => {
  const [customerSelected, setCustomerSelected] = useState('Customer A');
  const [prodDateFrom, setProdDateFrom] = useState('2023-01-01');
  const [prodDateTo, setProdDateTo] = useState('2025-12-31');
  const [repairDateFrom, setRepairDateFrom] = useState('2023-01-01');
  const [repairDateTo, setRepairDateTo] = useState('2025-12-31');

  // Master Configuration - Last Improvement Date
  const [masterConfig, setMasterConfig] = useState({
    lastImprovementDate: '2024-02',
    improvementDescription: 'Process Optimization Phase 1',
  });

  const [openConfigDialog, setOpenConfigDialog] = useState(false);
  const [tempConfig, setTempConfig] = useState(masterConfig);

  // Mock warranty data
  const warrantyData = [
    { vin_no: 'VIN001', Model: 'FH', model_name: 'CRETA', part_no: 'P001', part_name: 'WHEEL BEARING', prod_date: '2023-10-03', repair_date: '2025-05-08', used_months: 18, mileage: 32594, c_code: 'ZZ4', repair_count: 1 },
    { vin_no: 'VIN002', Model: 'FH', model_name: 'CRETA', part_no: 'P002', part_name: 'BRAKE DISC', prod_date: '2023-09-26', repair_date: '2025-04-22', used_months: 19, mileage: 44293, c_code: 'ZZ3', repair_count: 1 },
    { vin_no: 'VIN003', Model: 'HQ', model_name: 'VENUE', part_no: 'P001', part_name: 'WHEEL BEARING', prod_date: '2023-08-15', repair_date: '2025-03-10', used_months: 20, mileage: 55000, c_code: 'ZZ2', repair_count: 1 },
    { vin_no: 'VIN004', Model: 'FH', model_name: 'CRETA', part_no: 'P003', part_name: 'ENGINE', prod_date: '2023-07-01', repair_date: '2025-02-15', used_months: 21, mileage: 65000, c_code: 'ZZ1', repair_count: 1 },
    { vin_no: 'VIN005', Model: 'SV', model_name: 'XCENT', part_no: 'P002', part_name: 'BRAKE DISC', prod_date: '2023-06-20', repair_date: '2025-01-30', used_months: 22, mileage: 48000, c_code: 'ZZ3', repair_count: 1 },
    { vin_no: 'VIN006', Model: 'HQ', model_name: 'VENUE', part_no: 'P001', part_name: 'WHEEL BEARING', prod_date: '2023-05-10', repair_date: '2024-12-20', used_months: 23, mileage: 72000, c_code: 'ZZ4', repair_count: 1 },
    { vin_no: 'VIN007', Model: 'FH', model_name: 'CRETA', part_no: 'P001', part_name: 'WHEEL BEARING', prod_date: '2023-04-15', repair_date: '2024-11-25', used_months: 24, mileage: 85000, c_code: 'ZZ2', repair_count: 1 },
  ];

  const filteredData = useMemo(() => {
    return warrantyData.filter(item => {
      const prodDate = new Date(item.prod_date);
      const repairDate = new Date(item.repair_date);
      const prodFromDate = new Date(prodDateFrom);
      const prodToDate = new Date(prodDateTo);
      const repFromDate = new Date(repairDateFrom);
      const repToDate = new Date(repairDateTo);

      return prodDate >= prodFromDate && prodDate <= prodToDate &&
        repairDate >= repFromDate && repairDate <= repToDate;
    });
  }, [prodDateFrom, prodDateTo, repairDateFrom, repairDateTo]);

  const modelAnalysis = useMemo(() => {
    const models = {};
    filteredData.forEach(item => {
      if (!models[item.model_name]) {
        models[item.model_name] = { name: item.model_name, production: 0, repairs: 0 };
      }
      models[item.model_name].production += 1;
      models[item.model_name].repairs += item.repair_count;
    });
    return Object.values(models);
  }, [filteredData]);

  const mileageAnalysis = useMemo(() => {
    const ranges = {
      '0-10K': { label: '0-10K', count: 0 },
      '10-20K': { label: '10-20K', count: 0 },
      '20-30K': { label: '20-30K', count: 0 },
      '30-40K': { label: '30-40K', count: 0 },
      '40-50K': { label: '40-50K', count: 0 },
      '50K+': { label: '50K+', count: 0 },
    };

    filteredData.forEach(item => {
      if (item.mileage < 10000) ranges['0-10K'].count++;
      else if (item.mileage < 20000) ranges['10-20K'].count++;
      else if (item.mileage < 30000) ranges['20-30K'].count++;
      else if (item.mileage < 40000) ranges['30-40K'].count++;
      else if (item.mileage < 50000) ranges['40-50K'].count++;
      else ranges['50K+'].count++;
    });

    return Object.values(ranges);
  }, [filteredData]);

  const partAnalysis = useMemo(() => {
    const parts = {};
    filteredData.forEach(item => {
      if (!parts[item.part_name]) {
        parts[item.part_name] = { name: item.part_name, count: 0 };
      }
      parts[item.part_name].count++;
    });
    return Object.values(parts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredData]);

  const monthAnalysis = useMemo(() => {
    const months = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    filteredData.forEach(item => {
      const date = new Date(item.repair_date);
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      months[monthKey] = (months[monthKey] || 0) + 1;
    });

    return Object.entries(months).map(([month, count]) => ({ month, count }));
  }, [filteredData]);

  const usedMonthsAnalysis = useMemo(() => {
    const ranges = {
      '0-5': { label: '0-5', count: 0 },
      '5-10': { label: '5-10', count: 0 },
      '10-15': { label: '10-15', count: 0 },
      '15-20': { label: '15-20', count: 0 },
      '20+': { label: '20+', count: 0 },
    };

    filteredData.forEach(item => {
      if (item.used_months < 5) ranges['0-5'].count++;
      else if (item.used_months < 10) ranges['5-10'].count++;
      else if (item.used_months < 15) ranges['10-15'].count++;
      else if (item.used_months < 20) ranges['15-20'].count++;
      else ranges['20+'].count++;
    });

    return Object.values(ranges);
  }, [filteredData]);

  const causeCodeAnalysis = useMemo(() => {
    const codes = {};
    filteredData.forEach(item => {
      codes[item.c_code] = (codes[item.c_code] || 0) + 1;
    });
    return Object.entries(codes).map(([code, count]) => ({ code, count }));
  }, [filteredData]);

  const improvementTrendData = [
    { period: '2023 Q1', production: 48, repair: 42, improvement: 3 },
    { period: '2023 Q2', production: 52, repair: 38, improvement: 7 },
    { period: '2023 Q3', production: 58, repair: 32, improvement: 13 },
    { period: '2023 Q4', production: 62, repair: 28, improvement: 17 },
    { period: '2024 Q1', production: 65, repair: 25, improvement: 20 },
    { period: '2024 Q2', production: 70, repair: 20, improvement: 25 }, // ← Improvement marker point
    { period: '2024 Q3', production: 75, repair: 15, improvement: 30 },
    { period: '2024 Q4', production: 78, repair: 12, improvement: 33 },
  ];

  const qualityMetricsData = [
    { month: 'Jan 2024', defects: 28, warranty: 32, cost: 35 },
    { month: 'Feb 2024', defects: 26, warranty: 30, cost: 33 }, // ← Improvement marker point
    { month: 'Mar 2024', defects: 24, warranty: 28, cost: 31 },
    { month: 'Apr 2024', defects: 22, warranty: 26, cost: 29 },
    { month: 'May 2024', defects: 20, warranty: 24, cost: 27 },
    { month: 'Jun 2024', defects: 18, warranty: 22, cost: 25 },
    { month: 'Jul 2024', defects: 16, warranty: 20, cost: 23 },
    { month: 'Aug 2024', defects: 15, warranty: 19, cost: 22 },
    { month: 'Sep 2024', defects: 14, warranty: 18, cost: 21 },
    { month: 'Oct 2024', defects: 13, warranty: 17, cost: 20 },
  ];

  const handleOpenConfigDialog = () => {
    setTempConfig(masterConfig);
    setOpenConfigDialog(true);
  };

  const handleSaveConfig = () => {
    setMasterConfig(tempConfig);
    setOpenConfigDialog(false);
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  const ModernChartCard = ({ title, subtitle, children, height = 320 }) => (
    <Card
      sx={{
        height: '100%',
        borderRadius: 4,
        background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
        border: '1px solid #eef2f6',
        boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
        transition: 'all .25s ease',
        '&:hover': {
          boxShadow: '0 14px 40px rgba(0,0,0,0.1)',
          transform: 'translateY(-2px)',
        },
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



  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Warranty Claims Analysis
        </Typography>
        <MuiButton
          startIcon={<SettingsIcon />}
          variant="outlined"
          onClick={handleOpenConfigDialog}
        >
          Config
        </MuiButton>
      </Box>

      {/* Master Configuration Dialog */}
      <Dialog
        open={openConfigDialog}
        onClose={() => setOpenConfigDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          },
        }}
      >
        {/* Header */}
        <DialogTitle sx={{ pb: 0 }}>
          <Typography variant="h6" fontWeight={700}>
            Improvement Baseline Configuration
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: 'block' }}
          >
            This configuration controls the baseline marker shown in analysis charts
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {/* Date */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              fontWeight={600}
              color="text.secondary"
              sx={{ mb: 0.5, display: 'block' }}
            >
              Improvement Date
            </Typography>

            <TextField
              type="month"
              value={tempConfig.lastImprovementDate}
              onChange={(e) =>
                setTempConfig({
                  ...tempConfig,
                  lastImprovementDate: e.target.value,
                })
              }
              fullWidth
              size="small"
            />
          </Box>

          {/* Description */}
          <Box>
            <Typography
              variant="caption"
              fontWeight={600}
              color="text.secondary"
              sx={{ mb: 0.5, display: 'block' }}
            >
              Improvement Description
            </Typography>

            <TextField
              value={tempConfig.improvementDescription}
              onChange={(e) =>
                setTempConfig({
                  ...tempConfig,
                  improvementDescription: e.target.value,
                })
              }
              fullWidth
              multiline
              rows={3}
              placeholder="Describe what process / design improvement was implemented"
            />
          </Box>
        </DialogContent>

        {/* Actions */}
        <DialogActions
          sx={{
            px: 3,
            pb: 2,
            pt: 1,
            justifyContent: 'space-between',
          }}
        >
          <MuiButton
            onClick={() => setOpenConfigDialog(false)}
            color="inherit"
          >
            Cancel
          </MuiButton>

          <MuiButton
            onClick={handleSaveConfig}
            variant="contained"
            size="medium"
          >
            Save Configuration
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Current Configuration Display */}
      <Card
        sx={{
          mb: 2,
          borderRadius: 2,
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        }}
      >
        <CardContent sx={{ py: 2.5 }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1.5,
            }}
          >
            <Box>
              <Typography
                fontSize={14}
                fontWeight={600}
              >
                Improvement Baseline
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Active reference for trend analysis
              </Typography>
            </Box>

            <Chip
              label="ACTIVE"
              size="small"
              sx={{
                fontSize: 11,
                fontWeight: 600,
              }}
            />
          </Box>

          {/* Compact Content */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Last Improvement Date
              </Typography>
              <TextField type='date'
                value={masterConfig.lastImprovementDate}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                sx={{ mt: 0.5, width: '100%' }}
              >
                {masterConfig.lastImprovementDate}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Description
              </Typography>
              <Typography
                fontSize={13}
                fontWeight={600}
                noWrap
              >
                {masterConfig.improvementDescription}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>


      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Customer</InputLabel>
                <Select value={customerSelected} onChange={(e) => setCustomerSelected(e.target.value)} label="Customer">
                  <MenuItem value="Customer A">Customer A</MenuItem>
                  <MenuItem value="Customer B">Customer B</MenuItem>
                  <MenuItem value="Customer C">Customer C</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2.5}>
              <TextField type="date" label="Prod Date From" value={prodDateFrom} onChange={(e) => setProdDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" />
            </Grid>

            <Grid item xs={12} sm={6} md={2.5}>
              <TextField type="date" label="Prod Date To" value={prodDateTo} onChange={(e) => setProdDateTo(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" />
            </Grid>

            <Grid item xs={12} sm={6} md={2.5}>
              <TextField type="date" label="Repair Date From" value={repairDateFrom} onChange={(e) => setRepairDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" />
            </Grid>

            <Grid item xs={12} sm={6} md={2.5}>
              <TextField type="date" label="Repair Date To" value={repairDateTo} onChange={(e) => setRepairDateTo(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{filteredData.length}</Typography>
            <Typography variant="caption">Total Claims</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f3e5f5' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{new Set(filteredData.map(d => d.model_name)).size}</Typography>
            <Typography variant="caption">Models</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#e8f5e9' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{new Set(filteredData.map(d => d.part_name)).size}</Typography>
            <Typography variant="caption">Parts</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#fff3e0' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{new Set(filteredData.map(d => d.c_code)).size}</Typography>
            <Typography variant="caption">Cause Codes</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* 6 Original Charts */}
      <Grid container spacing={3}>

        {/* 1️⃣ Model-wise Repairs */}
        <Grid item xs={12} md={6}>
          <ModernChartCard title="Model-wise Repairs" subtitle="Production vs Repairs">
            <BarChart data={modelAnalysis} barGap={6}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="name" {...axisStyle} />
              <YAxis {...axisStyle} />
              <Tooltip {...tooltipStyle} />
              <Legend iconType="circle" />

              <Bar dataKey="repairs" fill="#6366f1" radius={[8, 8, 0, 0]} />
              <Bar dataKey="production" fill="#22c55e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ModernChartCard>
        </Grid>

        {/* 2️⃣ Mileage-wise Distribution */}
        <Grid item xs={12} md={6}>
          <ModernChartCard title="Mileage-wise Distribution">
            <BarChart data={mileageAnalysis}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="label" {...axisStyle} />
              <YAxis {...axisStyle} />
              <Tooltip {...tooltipStyle} />

              <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ModernChartCard>
        </Grid>

        {/* 3️⃣ Top 5 Parts */}
        <Grid item xs={12} md={6}>
          <ModernChartCard title="Top 5 Parts">
            <BarChart data={partAnalysis}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="name" angle={-30} textAnchor="end" {...axisStyle} />
              <YAxis {...axisStyle} />
              <Tooltip {...tooltipStyle} />

              <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ModernChartCard>
        </Grid>

        {/* 4️⃣ Month-wise Trend */}
        <Grid item xs={12} md={6}>
          <ModernChartCard title="Month-wise Trend">
            <LineChart data={monthAnalysis}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="month" angle={-30} textAnchor="end" {...axisStyle} />
              <YAxis {...axisStyle} />
              <Tooltip {...tooltipStyle} />

              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ModernChartCard>
        </Grid>

        {/* 5️⃣ Used Months Distribution */}
        <Grid item xs={12} md={6}>
          <ModernChartCard title="Used Months Distribution">
            <PieChart>
              <Pie
                data={usedMonthsAnalysis}
                dataKey="count"
                nameKey="label"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={4}
              >
                {usedMonthsAnalysis.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend />
            </PieChart>
          </ModernChartCard>
        </Grid>

        {/* 6️⃣ By Cause Code */}
        <Grid item xs={12} md={6}>
          <ModernChartCard title="By Cause Code">
            <PieChart>
              <Pie
                data={causeCodeAnalysis}
                dataKey="count"
                nameKey="code"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={4}
              >
                {causeCodeAnalysis.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend />
            </PieChart>
          </ModernChartCard>
        </Grid>

      </Grid>


      {/* 2 NEW BASELINE CHARTS WITH VERTICAL REFERENCE LINES */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2, fontWeight: 700 }}>
        Quality Improvement Trends
      </Typography>

      <Grid container spacing={3}>

        {/* 7️⃣ Production & Repair Improvement Trend */}
        <Grid item xs={12}>
          <ModernChartCard title="Production & Repair Improvement Trend" height={400}>
            <ComposedChart data={improvementTrendData}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="period" angle={-30} textAnchor="end" {...axisStyle} />
              <YAxis {...axisStyle} />
              <Tooltip formatter={(v) => `${v}%`} {...tooltipStyle} />
              <Legend />

              {/* Bars FIRST */}
              <Bar dataKey="production" fill="#06b6d4" radius={[6, 6, 0, 0]} />

              {/* Lines */}
              <Line dataKey="repair" stroke="#6366f1" strokeWidth={3} dot={false} />
              <Line dataKey="improvement" stroke="#f59e0b" strokeWidth={3} dot={false} />

              {/* ✅ ReferenceLine LAST (on top layer) */}
              <ReferenceLine
                x="2024 Q2"
                stroke="#000000"
                strokeDasharray="6 6"
                strokeWidth={3}
                isFront
                label={{
                  value: ` ${masterConfig.lastImprovementDate}`,
                  position: 'top',
                  fill: '#000000',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
            </ComposedChart>

          </ModernChartCard>
        </Grid>

        {/* 8️⃣ Quality Metrics Over Time */}
        <Grid item xs={12}>
          <ModernChartCard title="Quality Metrics Over Time" height={400}>
            <ComposedChart data={qualityMetricsData}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="month" angle={-30} textAnchor="end" {...axisStyle} />
              <YAxis {...axisStyle} />
              <Tooltip {...tooltipStyle} />
              <Legend />

              <ReferenceLine
                x="Feb 2024"
                stroke="#000000"
                strokeDasharray="6 6"
                strokeWidth={2}
                label={{
                  value: ` ${masterConfig.lastImprovementDate}`,
                  fill: '#000000',
                  // fill: '#16a34a',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />

              <Line dataKey="defects" stroke="#ec4899" strokeWidth={3} dot={false} />
              <Line dataKey="warranty" stroke="#06b6d4" strokeWidth={3} dot={false} />
              <Line dataKey="cost" stroke="#f59e0b" strokeWidth={3} dot={false} />
            </ComposedChart>
          </ModernChartCard>
        </Grid>
      </Grid>
    </Container>
  );
};

export default WarrantyAnalysis;
