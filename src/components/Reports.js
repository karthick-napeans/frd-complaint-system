import React, { useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
} from 'recharts';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import html2pdf from 'html2pdf.js';

const Reports = ({ userRole }) => {
  const [reportType, setReportType] = useState('repair');
  const [dateRange, setDateRange] = useState({ start: '2025-10-01', end: '2025-11-01' });
  const [openPdfDialog, setOpenPdfDialog] = useState(false);

  // Sample data for Repair/QS Analysis
  const repairTrendData = [
    { month: 'Aug', complaints: 45, repairs: 38, closed: 32 },
    { month: 'Sep', complaints: 52, repairs: 48, closed: 41 },
    { month: 'Oct', complaints: 68, repairs: 60, closed: 52 },
    { month: 'Nov', complaints: 75, repairs: 70, closed: 65 },
  ];

  const repairByModel = [
    { model: 'Model A', count: 45 },
    { model: 'Model B', count: 38 },
    { model: 'Model C', count: 28 },
    { model: 'Model D', count: 15 },
  ];

  const repairByCause = [
    { name: 'Manufacturing', value: 35 },
    { name: 'Assembly', value: 25 },
    { name: 'Design', value: 20 },
    { name: 'Other', value: 20 },
  ];

  // Sample data for DRE Analysis
  const dreTrendData = [
    { week: 'Week 1', liveCases: 12, reviewed: 10, closed: 8 },
    { week: 'Week 2', liveCases: 15, reviewed: 14, closed: 11 },
    { week: 'Week 3', liveCases: 18, reviewed: 16, closed: 14 },
    { week: 'Week 4', liveCases: 22, reviewed: 20, closed: 18 },
  ];

  const dreStatus = [
    { status: 'Open', count: 18 },
    { status: 'In Review', count: 25 },
    { status: 'Closed', count: 42 },
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c'];

  const handleExportPNG = (chartName) => {
    console.log(`Exporting ${chartName} as PNG`);
  };

  const handleExportPDF = () => {
    const element = document.getElementById('reportContent');
    const opt = {
      margin: 10,
      filename: `${reportType}_analysis_report.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
    };
    html2pdf().set(opt).from(element).save();
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Reports & Analysis
        </Typography>
        <Box sx={{ gap: 1, display: 'flex' }}>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportPDF}
          >
            Export PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrintReport}
          >
            Print
          </Button>
        </Box>
      </Box>

      {/* Filter Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Report Type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                SelectProps={{ native: true }}
                fullWidth
              >
                <option value="repair">Repair/Claim Analysis (QS)</option>
                <option value="dre">DRE Analysis</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                type="date"
                label="Start Date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                type="date"
                label="End Date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button variant="contained" fullWidth>
                Apply Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box id="reportContent">
        {/* Repair/QS Analysis */}
        {reportType === 'repair' && (
          <Grid container spacing={3}>
            {/* Summary Cards */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography color="textSecondary">Total Complaints</Typography>
                      <Typography variant="h4" sx={{ mt: 1 }}>
                        240
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography color="textSecondary">Open/Pending</Typography>
                      <Typography variant="h4" sx={{ mt: 1, color: 'warning.main' }}>
                        45
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography color="textSecondary">Resolution Rate</Typography>
                      <Typography variant="h4" sx={{ mt: 1, color: 'success.main' }}>
                        87%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography color="textSecondary">Avg Resolution</Typography>
                      <Typography variant="h4" sx={{ mt: 1 }}>
                        12.5 days
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Complaint Trend</Typography>
                    <Button size="small" startIcon={<DownloadIcon />} onClick={() => handleExportPNG('trend')}>
                      PNG
                    </Button>
                  </Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={repairTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="complaints" stroke="#8884d8" />
                      <Line type="monotone" dataKey="repairs" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="closed" stroke="#ffc658" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Repairs by Model</Typography>
                    <Button size="small" startIcon={<DownloadIcon />} onClick={() => handleExportPNG('model')}>
                      PNG
                    </Button>
                  </Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={repairByModel}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="model" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Repairs by Cause</Typography>
                    <Button size="small" startIcon={<DownloadIcon />} onClick={() => handleExportPNG('cause')}>
                      PNG
                    </Button>
                  </Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={repairByCause}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {repairByCause.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* DRE Analysis */}
        {reportType === 'dre' && (
          <Grid container spacing={3}>
            {/* Summary Cards */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography color="textSecondary">Live Cases</Typography>
                      <Typography variant="h4" sx={{ mt: 1 }}>
                        22
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography color="textSecondary">Under Review</Typography>
                      <Typography variant="h4" sx={{ mt: 1, color: 'info.main' }}>
                        25
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography color="textSecondary">Completed</Typography>
                      <Typography variant="h4" sx={{ mt: 1, color: 'success.main' }}>
                        42
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography color="textSecondary">Completion Rate</Typography>
                      <Typography variant="h4" sx={{ mt: 1 }}>
                        63%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">DRE Weekly Trend</Typography>
                    <Button size="small" startIcon={<DownloadIcon />} onClick={() => handleExportPNG('dre-trend')}>
                      PNG
                    </Button>
                  </Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dreTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="liveCases" stroke="#8884d8" />
                      <Line type="monotone" dataKey="reviewed" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="closed" stroke="#ffc658" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">DRE Status Distribution</Typography>
                    <Button size="small" startIcon={<DownloadIcon />} onClick={() => handleExportPNG('dre-status')}>
                      PNG
                    </Button>
                  </Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dreStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, count }) => `${status}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {dreStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default Reports;
