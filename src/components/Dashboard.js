import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  TextField,
  MenuItem, Button
} from "@mui/material";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getDashboardData } from "../api/pageApi";
import { useDispatch, useSelector } from "react-redux";
import { loadMasters } from "../store/masterSlice";

export default function Dashboard() {
  const dispatch = useDispatch();
  const loaded = useSelector((s) => s.masters.loaded);
  const [filterDays, setFilterDays] = useState(7);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [dateErrors, setDateErrors] = useState({
    fromDate: "",
    toDate: "",
  });
  const [totalFieldReports, setTotalFieldReports] = useState(0);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [totalDreReports, setTotalDreReports] = useState(0);
  const [totalComplaintDraft, setTotalComplaintDraft] = useState(0);
  const [totalDreDraft, setTotalDreDraft] = useState(0);
  const [totalParts, setTotalParts] = useState(0);
  const [totalModels, setTotalModels] = useState(0);
  const [totalAttachmentDue, setTotalAttachmentDue] = useState(0);

  useEffect(() => {
    if (!loaded) dispatch(loadMasters());
  }, [loaded, dispatch]);

  useEffect(() => {
    const today = new Date();

    const toDate = today.toISOString().split("T")[0];

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    const fromDate = sixMonthsAgo.toISOString().split("T")[0];

    setCustomFrom(fromDate);
    setCustomTo(toDate);
  }, []);

  useEffect(() => {
    const from =
      filterDays === "custom"
        ? customFrom
        : getFromDate(filterDays);

    const to =
      filterDays === "custom"
        ? customTo
        : today;

    if (from && to) {
      loadDashboardStats(from, to);
    }
  }, [filterDays, customFrom, customTo]);

  const getFromDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1));
    return date.toISOString().split("T")[0];
  };

  const validateDates = (from, to) => {

    const errors = {
      fromDate: "",
      toDate: "",
    };

    const today = new Date().toISOString().split("T")[0];

    // if both empty → no error
    if (!from && !to) return errors;

    // future date validation
    if (from && from > today) {
      errors.fromDate = "Invalid Date";
    }

    if (to && to > today) {
      errors.toDate = "Invalid Date";
    }

    // range validation
    if (from && to && from > to) {
      errors.fromDate = "From date must be ≤ To date";
      errors.toDate = "To date must be ≥ From date";
    }

    return errors;
  };

  const loadDashboardStats = async (from, to) => {
    const errors = validateDates(from, to);
    if (errors.fromDate || errors.toDate) return;

    try {
      const payload = {
        FromDate: from,
        ToDate: to,
      };
      const res = await getDashboardData(payload);
      setTotalFieldReports(res?.TotalFieldReports || 0);
      setTotalComplaints(res?.TotalCustomerComplaints || 0);
      setTotalDreReports(res?.TotalDreEntry || 0);
      setTotalComplaintDraft(res?.TotalCustomerComplaintInDraft || 0);
      setTotalDreDraft(res?.TotalDreInDraft || 0);
      setTotalParts(res?.TotalParts || 0);
      setTotalModels(res?.TotalModels || 0);
      setTotalAttachmentDue(
        res?.TotalCustomerComplaintsAttachmentsInDue || 0
      );
    } catch (error) {
      console.error("Dashboard Error:", error);
    }
  };

  const handleFromChange = (value) => {
    setCustomFrom(value);

    const errors = validateDates(value, customTo);
    setDateErrors(errors);
  };

  const handleToChange = (value) => {
    setCustomTo(value);

    const errors = validateDates(customFrom, value);
    setDateErrors(errors);
  };

  const moduleData = [
    { name: "Field Reports", value: totalFieldReports },
    { name: "Customer", value: totalComplaints },
    { name: "DRE", value: totalDreReports },
    { name: "Masters", value: totalParts + totalModels },
  ];


  const submittedDre = totalDreReports - totalDreDraft;

  const dreData = [
    {
      name: "Draft",
      value: totalDreDraft,
    },
    {
      name: "Submitted",
      value: submittedDre < 0 ? 0 : submittedDre,
    },
  ];

  const COLORS = ["#1976d2", "#ff9800", "#4caf50"];

  const submittedComplaints =
    totalComplaints - totalComplaintDraft;

  const customerData = [
    {
      name: "Draft",
      value: totalComplaintDraft,
    },
    {
      name: "Submitted",
      value: submittedComplaints < 0 ? 0 : submittedComplaints,
    },
    {
      name: "Attachments Due",
      value: totalAttachmentDue,
    },
  ];
  return (
    <Box sx={{ background: "#f4f6f8", minHeight: "100vh", }}>
      {/* HEADER */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ color: "#3b3b3b" }}
        >
          Complaint Management Dashboard
        </Typography>

        {filterDays === "custom" && (
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              type="date"
              size="small"
              label="From"
              InputLabelProps={{ shrink: true }}
              value={customFrom || ""}
              onChange={(e) => handleFromChange(e.target.value)}
              error={!!dateErrors.fromDate}
              helperText={dateErrors.fromDate}
            />

            <TextField
              type="date"
              size="small"
              label="To"
              InputLabelProps={{ shrink: true }}
              value={customTo || ""}
              onChange={(e) => handleToChange(e.target.value)}
              error={!!dateErrors.toDate}
              helperText={dateErrors.toDate}
            />

            {/* <Button
              variant="contained"
              size="small"
              disabled={!customFrom || !customTo}
              onClick={handleApplyCustomFilter}
            >
              Apply
            </Button> */}
          </Box>
        )}

        <TextField
          select
          size="small"
          value={filterDays}
          onChange={(e) => setFilterDays(e.target.value)}
        >
          <MenuItem value={7}>Last 7 Days</MenuItem>
          <MenuItem value={14}>Last 14 Days</MenuItem>
          <MenuItem value={30}>Last 30 Days</MenuItem>
          <MenuItem value={90}>Last 90 Days</MenuItem>
          <MenuItem value="custom">Custom</MenuItem>
        </TextField>
      </Box>

      {/* STAT CARDS */}

      <Grid container spacing={3} mb={2}>
        {[
          {
            title: "Field Reports",
            main: totalFieldReports,
            sub: [],
            bg: "rgba(25,118,210,0.08)",
            accent: "#1976d2",
          },
          {
            title: "Customer Complaints",
            main: totalComplaints,
            sub: [
              { label: "Draft", value: totalComplaintDraft },
              { label: "Attachment Due", value: totalAttachmentDue },
            ],
            bg: "rgba(255,152,0,0.08)",
            accent: "#f57c00",
          },
          {
            title: "DRE Entry",
            main: totalDreReports,
            sub: [{ label: "Draft", value: totalDreDraft }],
            bg: "rgba(76,175,80,0.08)",
            accent: "#2e7d32",
          },
          {
            title: "Masters Data",
            main: totalParts + totalModels,
            sub: [{ label: "Models", value: totalModels }, { label: "Parts", value: totalParts }],
            bg: "rgba(156,39,176,0.08)",
            accent: "#8e24aa",
          },
        ].map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: 200,
                borderRadius: 4,
                background: card.bg,
                border: `1px solid ${card.accent}20`,
                boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
              }}
            >
              <CardContent sx={{ p: 2 }}>

                <Typography
                  variant="caption"
                  sx={{
                    textTransform: "uppercase",
                    fontWeight: 600,
                    color: card.accent,
                    fontSize: 11,
                  }}
                >
                  {card.title}
                </Typography>

                <Box
                  sx={{
                    mt: 1,
                    mb: 1,
                    p: 1.5,
                    borderRadius: 3,
                    background: "#ffffff",
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    sx={{ color: card.accent }}
                  >
                    {card.main}
                  </Typography>
                </Box>

                {card.sub.length > 0 && (
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    {card.sub.map((item, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          background: "#ffffff",
                          fontSize: 12,
                        }}
                      >
                        <Typography variant="caption">
                          {item.label}
                        </Typography>
                        <Typography fontWeight={700} variant="caption">
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

              </CardContent>
            </Card>
          </Grid>
        ))}

      </Grid>


      {/* CHARTS */}
      <Grid container spacing={1}>

        {/* 1️⃣ Module Comparison */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 5 }}>
            <CardContent>
              <Typography fontWeight={600} mb={2}>
                Module Comparison
              </Typography>

              <ResponsiveContainer height={230}>
                <BarChart data={moduleData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    fill="#1976d2"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 2️⃣ Customer Breakdown */}
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 5 }}>
            <CardContent>
              <Typography fontWeight={600} mb={2}>
                Customer Breakdown
              </Typography>

              <ResponsiveContainer height={230}>
                <PieChart width={350} height={300}>
                  <Pie
                    data={customerData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={4}
                  >
                    {customerData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 3️⃣ DRE Breakdown */}
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 5 }}>
            <CardContent>
              <Typography fontWeight={600} mb={2}>
                DRE Breakdown
              </Typography>

              <ResponsiveContainer height={230}>
                <PieChart>
                  <Pie
                    data={dreData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={4}
                  >
                    {dreData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}