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
import { getDashboardData, getPPMData, getComplaintsList } from "../api/pageApi";
import { useDispatch, useSelector } from "react-redux";
import { loadMasters } from "../store/masterSlice";

export default function Dashboard() {
  const dispatch = useDispatch();
  const loaded = useSelector((s) => s.masters.loaded);
  const [filterDays, setFilterDays] = useState(30);
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

  // Distribution data
  const [customerPpmDist, setCustomerPpmDist] = useState([]);
  const [modelPpmDist, setModelPpmDist] = useState([]);
  const [partPpmDist, setPartPpmDist] = useState([]);
  const [causePpmDist, setCausePpmDist] = useState([]);

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

  const { repairCauses, customers } = useSelector((s) => s.masters);

  const loadDashboardStats = async (from, to) => {
    const errors = validateDates(from, to);
    if (errors.fromDate || errors.toDate) return;

    try {
      const payload = {
        FromDate: from,
        ToDate: to,
      };

      // Fetch data in parallel
      const [res, ppmRes, complaintsRes] = await Promise.all([
        getDashboardData(payload),
        getPPMData(payload),
        getComplaintsList(payload)
      ]);

      const rawPpmData = Array.isArray(ppmRes) ? ppmRes : (ppmRes?.data || []);
      const rawComplaintsData = Array.isArray(complaintsRes) ? complaintsRes : (complaintsRes?.data || []);

      // 1. Basic Stats
      setTotalFieldReports(res?.TotalFieldReports || 0);
      setTotalComplaints(res?.TotalCustomerComplaints || 0);
      setTotalDreReports(res?.TotalDreEntry || 0);
      setTotalComplaintDraft(res?.TotalCustomerComplaintInDraft || 0);
      setTotalDreDraft(res?.TotalDreInDraft || 0);
      setTotalParts(res?.TotalParts || 0);
      setTotalModels(res?.TotalModels || 0);
      setTotalAttachmentDue(res?.TotalCustomerComplaintsAttachmentsInDue || 0);

      // 2. Customer wise Rejection Distribution
      // Primary: Aggregate from PPM data (requested by user)
      let cDist = rawPpmData
        .map(item => {
          let totalRejections = 0;
          Object.keys(item).forEach(key => {
            if (key.startsWith('Data') && item[key]) {
              const yearData = item[key];
              // Try to get direct total first
              if (typeof yearData.Rejection === 'number' && yearData.Rejection > 0) {
                totalRejections += yearData.Rejection;
              } else if (Array.isArray(yearData.MonthlyRejection)) {
                // Fallback to summing monthly array
                totalRejections += yearData.MonthlyRejection.reduce((a, b) => a + (Number(b) || 0), 0);
              }
            }
          });
          return { name: item.CustomerName, value: totalRejections };
        })
        .filter(i => i.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Fallback: If PPM data is empty, use complaints list
      if (cDist.length === 0) {
        const mapped = rawComplaintsData.map(c => {
          const cust = customers.find(cust => cust.CustomerId === c.CustomerId);
          return { ...c, CustName: cust ? cust.CustomerName : (c.CustomerName || c.CustomerEmail || "Unknown") };
        });
        cDist = processDist(mapped, "CustName");
      }
      setCustomerPpmDist(cDist);

      // 1.5 Filter Complaints by Date & Status (to match history table)
      const filteredComplaints = rawComplaintsData.filter(c => {
        const cDate = new Date(c.ComplaintDate);
        const matchFrom = !from || cDate >= new Date(from);
        const matchTo = !to || cDate <= new Date(to);
        const isNotDraft = c.Status && c.Status.toUpperCase() !== 'DRAFT';
        return matchFrom && matchTo && isNotDraft;
      });

      // 3. Model, Part, Cause Distribution (Rejection based)
      const processDist = (data, key) => {
        const counts = (data || []).reduce((acc, curr) => {
          const val = curr[key];
          if (val) acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {});
        return Object.entries(counts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
      };

      setModelPpmDist(processDist(filteredComplaints, "Model"));
      setPartPpmDist(processDist(filteredComplaints, "Part"));

      // Map Cause IDs to Names if necessary, or use ProblemStatement
      const causeData = filteredComplaints.map(c => {
        const cause = repairCauses.find(rc => rc.RepairCauseCodeId === c.RepairCauseCodeId);
        return { ...c, CauseName: cause ? cause.RepairCauseCodeName : c.ProblemStatement };
      });
      setCausePpmDist(processDist(causeData, "CauseName"));

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

  const PIE_COLORS = ["#1976d2", "#ff9800", "#4caf50", "#f44336", "#9c27b0"];

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
    <Box sx={{ background: "#f4f6f8", }}>
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
            title: "Customer Complaints",
            main: totalComplaints,
            sub: [
              { label: "Draft", value: totalComplaintDraft },
              { label: "Attachment Due", value: totalAttachmentDue },
            ],
            bg: "rgba(76,175,80,0.08)",
            accent: "#2e7d32",
          },
          {
            title: "Field Reports",
            main: totalFieldReports,
            sub: [],
            bg: "rgba(25,118,210,0.08)",
            accent: "#1976d2",
          },

          {
            title: "DRE Entry",
            main: totalDreReports,
            sub: [{ label: "Draft", value: totalDreDraft }],
            bg: "rgba(255,152,0,0.08)",
            accent: "#f57c00",
          },
        ].map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
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
      <Grid container spacing={2}>

        {/* 1️⃣ Customer Based PPM */}
        <Grid item xs={12} sm={6} md={6}>
          <Card sx={{ borderRadius: 5, height: '100%' }}>
            <CardContent>
              <Typography fontWeight={600} mb={1} variant="subtitle2" color="primary">
                Customer wise Rejections
              </Typography>
              <ResponsiveContainer height={250}>
                <PieChart>
                  <Pie
                    data={customerPpmDist}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={5}
                  >
                    {customerPpmDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 2️⃣ Model wise PPM */}
        <Grid item xs={12} sm={6} md={6}>
          <Card sx={{ borderRadius: 5, height: '100%' }}>
            <CardContent>
              <Typography fontWeight={600} mb={1} variant="subtitle2" color="secondary">
                Model wise Rejections
              </Typography>
              <ResponsiveContainer height={250}>
                <PieChart>
                  <Pie
                    data={modelPpmDist}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={5}
                  >
                    {modelPpmDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 3️⃣ Part wise PPM */}
        {/* <Grid item xs={12} sm={6} md={6}>
          <Card sx={{ borderRadius: 5, height: '100%' }}>
            <CardContent>
              <Typography fontWeight={600} mb={1} variant="subtitle2" color="success.main">
                Part wise Rejections
              </Typography>
              <ResponsiveContainer height={250}>
                <PieChart>
                  <Pie
                    data={partPpmDist}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={5}
                  >
                    {partPpmDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid> */}

        {/* 4️⃣ Cause wise PPM */}
        {/* <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 5, height: '100%' }}>
            <CardContent>
              <Typography fontWeight={600} mb={1} variant="subtitle2" color="warning.main">
                Cause Code wise Rejections
              </Typography>
              <ResponsiveContainer height={250}>
                <PieChart>
                  <Pie
                    data={causePpmDist}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={5}
                  >
                    {causePpmDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid> */}

      </Grid>
    </Box>
  );
}