import React, { useState, useMemo, useEffect } from 'react';
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
import { getWrantyReport } from '../api/pageApi';
import { generateWarrantyMockData } from './generateWarrantyMockData';



const warrantyMockData = [
  {
    Row_No: 1,
    HK: "HK00000001",
    Domestic_Export: "Domestic",
    System_Code: "SYS1",
    Period_Code: "2024Q2",
    Sequence_No: 1,
    Order_Type: "A",
    Order_Description: "Brake system issue",
    VIN: "VIN00000000000000000001",
    Plant_Code: "A",
    Model_Code: "MDL1",
    Model_Name: "Model Alpha",
    Part_Number: "PN000001",
    Part_Name: "Brake Pad",
    Old_Part_Number: "OPN000001",
    Cause_Code: "CC1",
    Nature_Code: "NC1",
    Production_Date: "2023-04-18T00:00:00",
    Repair_Date: "2023-05-22T00:00:00",
    Sales_Date: "2023-05-24T00:00:00",
    Used_Month: 14,
    Mileage: 21657,
    Supply_Ratio: 0.85,
    Burden_Ratio: 0.72,
    Apply_Ratio: 0.25,
    Part_Cost: 4500,
    Labor_Cost: 1200,
    Sublet_Cost: 300,
    Total_Cost: 6000
  },

  {
    Row_No: 2,
    HK: "HK00000002",
    Domestic_Export: "Export",
    System_Code: "SYS2",
    Period_Code: "2024Q1",
    Sequence_No: 2,
    Order_Type: "B",
    Order_Description: "Engine oil leakage",
    VIN: "VIN00000000000000000002",
    Plant_Code: "B",
    Model_Code: "MDL2",
    Model_Name: "Model Beta",
    Part_Number: "PN000002",
    Part_Name: "Oil Seal",
    Old_Part_Number: "OPN000002",
    Cause_Code: "CC2",
    Nature_Code: "NC2",
    Production_Date: "2022-11-10T00:00:00",
    Repair_Date: "2023-01-15T00:00:00",
    Sales_Date: "2022-12-01T00:00:00",
    Used_Month: 26,
    Mileage: 40210,
    Supply_Ratio: 0.78,
    Burden_Ratio: 0.66,
    Apply_Ratio: 0.3,
    Part_Cost: 7800.5,
    Labor_Cost: 2400,
    Sublet_Cost: 600,
    Total_Cost: 10800.5
  }
];



const WarrantyAnalysis = () => {
  const [customerSelected, setCustomerSelected] = useState('Customer A');
  const [prodDateFrom, setProdDateFrom] = useState('2023-01-01');
  const [prodDateTo, setProdDateTo] = useState('2025-12-31');
  const [repairDateFrom, setRepairDateFrom] = useState('2023-01-01');
  const [repairDateTo, setRepairDateTo] = useState('2025-12-31');
  const [rawData, setRawData] = useState([]);
  const [rawWarrantyData, setRawWarrantyData] = useState([]);
  const [loading, setLoading] = useState(false);

  const normalizeWarrantyData = (apiData = []) =>
    apiData.map(d => ({
      rowNo: d.Row_No,
      hk: d.HK?.trim(),
      domesticExport: d.Domestic_Export,
      systemCode: d.System_Code,
      period: d.Period_Code,
      sequenceNo: d.Sequence_No,

      orderType: d.Order_Type?.trim(),
      orderDescription: d.Order_Description,

      vin: d.VIN,
      plantCode: d.Plant_Code?.trim(),

      modelCode: d.Model_Code,
      modelName: d.Model_Name,

      partNumber: d.Part_Number,
      partName: d.Part_Name,
      oldPartNumber: d.Old_Part_Number,

      causeCode: d.Cause_Code,
      natureCode: d.Nature_Code,

      productionDate: new Date(d.Production_Date),
      repairDate: new Date(d.Repair_Date),
      salesDate: new Date(d.Sales_Date),

      usedMonths: d.Used_Month,
      mileage: d.Mileage,

      supplyRatio: d.Supply_Ratio,
      burdenRatio: d.Burden_Ratio,
      applyRatio: d.Apply_Ratio,

      partCost: d.Part_Cost,
      laborCost: d.Labor_Cost,
      subletCost: d.Sublet_Cost,
      totalCost: d.Total_Cost,
    }));


  useEffect(() => {
    fetchWarrantyReport();
  }, [customerSelected, prodDateFrom, prodDateTo]);

  const toDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };


  const fetchWarrantyReport = async () => {
    try {
      setLoading(true);

      // 🔴 MOCK DATA (acts like backend)
      const mockData = generateWarrantyMockData(500);

      const prodFrom = toDate(prodDateFrom);
      const prodTo = toDate(prodDateTo);

      // ✅ BACKEND-LIKE PRODUCTION FILTER
      const prodFiltered = mockData.filter(d => {
        const prodDate = toDate(d.Production_Date);
        return (
          prodDate &&
          prodFrom &&
          prodTo &&
          prodDate >= prodFrom &&
          prodDate <= prodTo
        );
      });

      setRawData(prodFiltered);

      /*
      // 🟢 REAL API (later)
      const response = await getWrantyReport({
        CustomerId: 6,
        ProductionFromDate: prodDateFrom,
        ProductionToDate: prodDateTo,
      });
      setRawData(response.data);
      */

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };



  const warrantyData = useMemo(() => {
    return normalizeWarrantyData(rawData);
  }, [rawData]);

  const filteredData = useMemo(() => {
    return warrantyData.filter(d =>
      d.productionDate >= new Date(prodDateFrom) &&
      d.productionDate <= new Date(prodDateTo) &&
      d.repairDate >= new Date(repairDateFrom) &&
      d.repairDate <= new Date(repairDateTo)
    );
  }, [warrantyData, prodDateFrom, prodDateTo, repairDateFrom, repairDateTo]);




  // Master Configuration - Last Improvement Date
  const [masterConfig, setMasterConfig] = useState({
    lastImprovementDate: '2024-02',
    improvementDescription: 'Process Optimization Phase 1',
  });

  const [openConfigDialog, setOpenConfigDialog] = useState(false);
  const [tempConfig, setTempConfig] = useState(masterConfig);







  const modelAnalysis = useMemo(() => {
    const map = {};
    filteredData.forEach(d => {
      if (!map[d.modelName]) {
        map[d.modelName] = { name: d.modelName, production: 0, repairs: 0 };
      }
      map[d.modelName].production += 1;
      map[d.modelName].repairs += 1; // each record = one repair
    });
    return Object.values(map);
  }, [filteredData]);



  const mileageAnalysis = useMemo(() => {
    const ranges = {
      '0-10K': 0,
      '10-20K': 0,
      '20-30K': 0,
      '30-40K': 0,
      '40-50K': 0,
      '50K+': 0,
    };

    filteredData.forEach(d => {
      if (d.mileage < 10000) ranges['0-10K']++;
      else if (d.mileage < 20000) ranges['10-20K']++;
      else if (d.mileage < 30000) ranges['20-30K']++;
      else if (d.mileage < 40000) ranges['30-40K']++;
      else if (d.mileage < 50000) ranges['40-50K']++;
      else ranges['50K+']++;
    });

    return Object.entries(ranges).map(([label, count]) => ({ label, count }));
  }, [filteredData]);


  const partAnalysis = useMemo(() => {
    const map = {};
    filteredData.forEach(d => {
      map[d.partName] = (map[d.partName] || 0) + 1;
    });

    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredData]);

  const monthAnalysis = useMemo(() => {
    const map = {};
    filteredData.forEach(d => {
      const key = d.repairDate.toLocaleString('en', {
        month: 'short',
        year: 'numeric',
      });
      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map).map(([month, count]) => ({ month, count }));
  }, [filteredData]);


  const usedMonthsAnalysis = useMemo(() => {
    const ranges = {
      '0-5': 0,
      '5-10': 0,
      '10-15': 0,
      '15-20': 0,
      '20+': 0,
    };

    filteredData.forEach(d => {
      if (d.usedMonths < 5) ranges['0-5']++;
      else if (d.usedMonths < 10) ranges['5-10']++;
      else if (d.usedMonths < 15) ranges['10-15']++;
      else if (d.usedMonths < 20) ranges['15-20']++;
      else ranges['20+']++;
    });

    return Object.entries(ranges).map(([label, count]) => ({ label, count }));
  }, [filteredData]);


  const causeCodeAnalysis = useMemo(() => {
    const map = {};
    filteredData.forEach(d => {
      map[d.causeCode] = (map[d.causeCode] || 0) + 1;
    });
    return Object.entries(map).map(([code, count]) => ({ code, count }));
  }, [filteredData]);


  const improvementTrendData = useMemo(() => {
    const map = {};

    filteredData.forEach(d => {
      const year = d.productionDate.getFullYear();
      const quarter = `Q${Math.ceil((d.productionDate.getMonth() + 1) / 3)}`;
      const period = `${year} ${quarter}`;

      if (!map[period]) {
        map[period] = {
          period,
          production: 0,
          repair: 0,
          improvement: 0,
        };
      }

      map[period].production += 1;
      map[period].repair += 1;
    });

    return Object.values(map);
  }, [filteredData]);


  const qualityMetricsData = useMemo(() => {
    const map = {};

    filteredData.forEach(d => {
      const key = d.repairDate.toLocaleString('en', {
        month: 'short',
        year: 'numeric',
      });

      if (!map[key]) {
        map[key] = {
          month: key,
          defects: 0,
          warranty: 0,
          cost: 0,
        };
      }

      map[key].defects += 1;
      map[key].warranty += 1;
      map[key].cost += d.totalCost;
    });

    return Object.values(map);
  }, [filteredData]);


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

  const summaryStats = useMemo(() => ([
    {
      label: 'Total Claims',
      value: filteredData.length,
      bg: '#e3f2fd',
    },
    {
      label: 'Models',
      value: new Set(filteredData.map(d => d.modelName)).size,
      bg: '#f3e5f5',
    },
    {
      label: 'Parts',
      value: new Set(filteredData.map(d => d.partName)).size,
      bg: '#e8f5e9',
    },
    {
      label: 'Cause Codes',
      value: new Set(filteredData.map(d => d.causeCode)).size,
      bg: '#fff3e0',
    },
  ]), [filteredData]);




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
        {summaryStats.map((stat, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                backgroundColor: stat.bg,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', color: 'primary.main' }}
              >
                {stat.value}
              </Typography>
              <Typography variant="caption">
                {stat.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
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
