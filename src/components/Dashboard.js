import React from 'react';
import { useEffect } from "react"; 
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { useDispatch, useSelector } from "react-redux";
import { loadMasters } from "../store/masterSlice";



const Dashboard = () => {

  const dispatch = useDispatch();
  const loaded = useSelector(state => state.masters.loaded);

  useEffect(() => {
    if (!loaded) {
      dispatch(loadMasters());
    }
  }, [loaded, dispatch]);

  const statData = [
    { title: 'Total Complaints', value: '242', change: '+8%', icon: TrendingUpIcon, color: 'primary' },
    { title: 'Pending Review', value: '45', change: '-3%', icon: PendingIcon, color: 'warning' },
    { title: 'Resolved', value: '197', change: '+12%', icon: CheckCircleIcon, color: 'success' },
    { title: 'Open Issues', value: '12', change: '+5%', icon: WarningIcon, color: 'error' },
  ];

  const trendData = [
    { month: 'Aug', complaints: 45, resolved: 32 },
    { month: 'Sep', complaints: 52, resolved: 41 },
    { month: 'Oct', complaints: 68, resolved: 52 },
    { month: 'Nov', complaints: 77, resolved: 65 },
  ];

  const complaintsByModel = [
    { model: 'Model A', count: 52 },
    { model: 'Model B', count: 48 },
    { model: 'Model C', count: 35 },
    { model: 'Model D', count: 22 },
  ];

  const recentComplaints = [
    { id: 'COMP042', customer: 'Customer A', model: 'Model B', date: '2025-11-02', status: 'Open', severity: 'High' },
    { id: 'COMP041', customer: 'Customer C', model: 'Model D', date: '2025-11-01', status: 'In Review', severity: 'Medium' },
    { id: 'COMP040', customer: 'Customer B', model: 'Model A', date: '2025-10-31', status: 'Resolved', severity: 'Low' },
    { id: 'COMP039', customer: 'Customer A', model: 'Model C', date: '2025-10-30', status: 'Open', severity: 'Critical' },
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'error';
      case 'In Review': return 'warning';
      case 'Resolved': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        background: 'linear-gradient(180deg, #f8fafc, #eef2f7)',
      }}
    >

      <Box sx={{ px: 3, py: 4, width: '100%' }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
          Complaint Management Dashboard
        </Typography>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statData.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    transition: '0.3s',
                    '&:hover': { transform: 'translateY(-4px)' },
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between">
                      <Box>
                        <Typography color="text.secondary" fontSize={14}>
                          {stat.title}
                        </Typography>
                        <Typography variant="h5" fontWeight={700} mt={1}>
                          {stat.value}
                        </Typography>
                        <Chip label={stat.change} size="small" color={stat.color} sx={{ mt: 1 }} />
                      </Box>
                      <Icon sx={{ fontSize: 44, opacity: 1 }} color={stat.color} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
              <CardContent>
                <Typography fontWeight={600} mb={2}>Complaint Trend</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="complaints" stroke="#6366f1" strokeWidth={3} />
                    <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
              <CardContent>
                <Typography fontWeight={600} mb={2}>Complaints by Model</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={complaintsByModel}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Table */}
        <Card sx={{ borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Typography fontWeight={600} mb={2}>Recent Complaints</Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 360 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Severity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentComplaints.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.customer}</TableCell>
                      <TableCell>{row.model}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>
                        <Chip size="small" label={row.status} color={getStatusColor(row.status)} />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={row.severity} color={getSeverityColor(row.severity)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;
