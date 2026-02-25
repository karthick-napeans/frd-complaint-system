import React, { useEffect, useState } from "react";
import {
  Box,
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
  TextField,
  MenuItem,
} from "@mui/material";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import AssignmentIcon from "@mui/icons-material/Assignment";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import FilterListIcon from "@mui/icons-material/FilterList";

import { useDispatch, useSelector } from "react-redux";
import { loadMasters } from "../store/masterSlice";


const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getFromDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatDate(d);
};


export default function Dashboard() {

  const dispatch = useDispatch();
  const loaded = useSelector((s) => s.masters.loaded);

  useEffect(() => {
    if (!loaded) dispatch(loadMasters());
  }, [loaded, dispatch]);


  // ---------- FILTER ----------
  const [filterDays, setFilterDays] = useState(7);

  const today = formatDate(new Date());
  const fromDate = getFromDate(filterDays);

  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // ---------- STATS ----------
  const [totalFieldReports, setTotalFieldReports] = useState(0);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [totalDreReports, setTotalDreReports] = useState(0);


  // ---------- CHART DATA ----------
  const [trendData, setTrendData] = useState([]);
  const [modelData, setModelData] = useState([]);
  const [statusData, setStatusData] = useState([]);

  // ---------- TABLE ----------
  const [recentComplaints, setRecentComplaints] = useState([]);

  // ---------- LOAD DASHBOARD ----------
  const loadDashboardStats = async (from, to) => {

    console.log("Loading dashboard:", from, to);
    // TODO: replace with real API
    // const res = await getDashboardStats(from, to);

    // MOCK DATA
    const res = {
      fieldReports: 124,
      complaints: 89,
      dreReports: 56,
      trend: [
        { month: "Jan", complaints: 20, resolved: 15 },
        { month: "Feb", complaints: 30, resolved: 22 },
        { month: "Mar", complaints: 40, resolved: 33 },
        { month: "Apr", complaints: 50, resolved: 44 },
      ],
      model: [
        { model: "Model A", count: 20 },
        { model: "Model B", count: 35 },
        { model: "Model C", count: 15 },
      ],
      status: [
        { name: "Open", value: 25 },
        { name: "Review", value: 40 },
        { name: "Resolved", value: 24 },
      ],
    };


    setTotalFieldReports(res.fieldReports);
    setTotalComplaints(res.complaints);
    setTotalDreReports(res.dreReports);

    setTrendData(res.trend);
    setModelData(res.model);
    setStatusData(res.status);
    setRecentComplaints(res.recent);
  };

  useEffect(() => {
    loadDashboardStats(fromDate, today);
  }, [filterDays]);


  // ---------- STAT CARDS ----------
  const statData = [
    {
      title: "Total Field Reports",
      value: totalFieldReports,
      color: "primary",
      icon: AssignmentIcon,
    },
    {
      title: "Customer Complaints",
      value: totalComplaints,
      color: "error",
      icon: ReportProblemIcon,
    },
    {
      title: "DRE Reports",
      value: totalDreReports,
      color: "success",
      icon: AnalyticsIcon,
    },
    {
      title: "Filter",
      isFilter: true,
      icon: FilterListIcon,
      color: "secondary",
    },
  ];


  return (
    <Box sx={{ background: "#f4f6f8", minHeight: "100vh" }}>

      {/* HEADER */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          Complaint Management Dashboard
        </Typography>

        {/* FILTER */}
        <Box display="flex" gap={2} alignItems="center">

          <TextField
            select
            size="small"
            label="Filter"
            value={filterDays}
            onChange={(e) => {

              const val = e.target.value;

              setFilterDays(val);

              if (val !== "custom") {
                const from = getFromDate(Number(val));
                loadDashboardStats(from, today);
              }
            }}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value={7}>Last 7 Days</MenuItem>
            <MenuItem value={14}>Last 14 Days</MenuItem>
            <MenuItem value={20}>Last 20 Days</MenuItem>
            <MenuItem value={90}>Last 90 Days</MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </TextField>


          {/* CUSTOM DATE RANGE */}
          {filterDays === "custom" && (
            <>
              <TextField
                type="date"
                size="small"
                label="From"
                value={customFrom}
                InputLabelProps={{ shrink: true }}
                onChange={(e) =>
                  setCustomFrom(e.target.value)
                }
              />

              <TextField
                type="date"
                size="small"
                label="To"
                value={customTo}
                InputLabelProps={{ shrink: true }}
                onChange={(e) =>
                  setCustomTo(e.target.value)
                }
              />

              <Chip
                label="Apply"
                color="primary"
                onClick={() =>
                  loadDashboardStats(
                    customFrom,
                    customTo
                  )
                }
                clickable
              />
            </>
          )}
        </Box>
      </Box>


      {/* ---------- STATS ---------- */}
      <Grid container spacing={3} mb={3}>

        {statData.map((stat, i) => {

          const Icon = stat.icon;

          return (

            <Grid item xs={12} sm={6} md={3} key={i}>

              <Card
                sx={{
                  borderRadius: 4,
                  background:
                    "linear-gradient(135deg,#ffffff,#f9fafc)",
                  boxShadow:
                    "0 6px 18px rgba(0,0,0,0.08)",
                  transition: "0.3s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                  },
                }}
              >

                <CardContent>

                  <Box
                    display="flex"
                    justifyContent="space-between"
                  >

                    <Box>

                      <Typography
                        color="text.secondary"
                        fontSize={13}
                      >
                        {stat.title}
                      </Typography>

                      <Typography
                        variant="h4"
                        fontWeight={700}
                        mt={1}
                      >
                        {stat.value}
                      </Typography>

                      <Chip
                        label={
                          filterDays === "custom"
                            ? "Custom Range"
                            : `${filterDays} Days`
                        }
                        size="small"
                        color={stat.color}
                        sx={{ mt: 1 }}
                      />

                    </Box>

                    <Box
                      sx={{
                        background:
                          "rgba(25,118,210,0.08)",
                        borderRadius: 3,
                        p: 1.5,
                        height: "fit-content",
                      }}
                    >
                      <Icon
                        color={stat.color}
                        sx={{ fontSize: 32 }}
                      />
                    </Box>

                  </Box>

                </CardContent>

              </Card>

            </Grid>
          );
        })}
      </Grid>



      {/* ---------- CHARTS ---------- */}
      <Grid container spacing={3}>

        {/* TREND */}
        <Grid item xs={12} md={4}>

          <Card
            sx={{
              borderRadius: 4,
              boxShadow:
                "0 6px 18px rgba(0,0,0,0.08)",
            }}
          >

            <CardContent>

              <Typography fontWeight={600} mb={2}>
                Complaint Trend
              </Typography>

              <ResponsiveContainer height={260}>

                <LineChart data={trendData}>

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="month" />

                  <YAxis />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="complaints"
                    stroke="#1976d2"
                    strokeWidth={3}
                  />

                  <Line
                    type="monotone"
                    dataKey="resolved"
                    stroke="#2e7d32"
                    strokeWidth={3}
                  />

                </LineChart>

              </ResponsiveContainer>

            </CardContent>

          </Card>

        </Grid>



        {/* MODEL */}
        <Grid item xs={12} md={4}>

          <Card sx={{ borderRadius: 4 }}>

            <CardContent>

              <Typography fontWeight={600} mb={2}>
                Complaints by Model
              </Typography>

              <ResponsiveContainer height={260}>

                <BarChart data={modelData}>

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="model" />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="count"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </CardContent>

          </Card>

        </Grid>



        {/* STATUS */}
        <Grid item xs={12} md={4}>

          <Card sx={{ borderRadius: 4 }}>

            <CardContent>

              <Typography fontWeight={600} mb={2}>
                Complaints by Status
              </Typography>

              <ResponsiveContainer height={260}>

                <BarChart data={statusData}>

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="name" />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="value"
                    fill="#ef5350"
                    radius={[6, 6, 0, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </CardContent>

          </Card>

        </Grid>

      </Grid>

    </Box>
  );
}