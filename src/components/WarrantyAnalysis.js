import React, { useState, useMemo, useEffect } from "react";
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
  Checkbox,
  ListItemText,
} from "@mui/material";
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart, ReferenceLine
} from "recharts";
import { getWrantyReport } from "../api/pageApi";
import { useSelector } from "react-redux";

const WarrantyAnalysis = () => {
  const { customers } = useSelector((state) => state.masters);
  const activeCustomers = customers.filter((c) => c.IsActive);

  const [customerSelected, setCustomerSelected] = useState("");
  const [rawData, setRawData] = useState([]);

  const [selectedModels, setSelectedModels] = useState([]);
  const [selectedParts, setSelectedParts] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [prodDateFrom, setProdDateFrom] = useState("2024-01-01");
  const [prodDateTo, setProdDateTo] = useState("2025-12-31");
  const [repairFrom, setRepairFrom] = useState("2024-01-01");
  const [repairTo, setRepairTo] = useState("2025-12-31");



  useEffect(() => {
    if (activeCustomers.length > 0 && !customerSelected) {
      setCustomerSelected(activeCustomers[0].CustomerId);
    }
  }, [activeCustomers]);

  useEffect(() => {
    if (!customerSelected || !prodDateFrom || !prodDateTo) return;

    fetchWarrantyReport();
  }, [customerSelected, prodDateFrom, prodDateTo]);

  const fetchWarrantyReport = async () => {
    try {
      const payload = {
        CustomerId: String(customerSelected),
        ProductionFromDate: prodDateFrom,
        ProductionToDate: prodDateTo,
      };

      console.log("Sending Payload:", payload);

      const response = await getWrantyReport(payload);
      console.log("API RESPONSE:", response);

      const apiData = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setRawData(apiData);

    } catch (error) {
      console.error("API ERROR:", error?.response?.data || error);
    }
  };


  const getRegionFromRO = (hk) => {
    if (!hk) {
      console.log("HK is undefined!");
      return null;
    }

    const cleanHK = hk.trim();
    console.log("Clean HK:", cleanHK);

    if (cleanHK.length < 4) {
      console.log("HK too short:", cleanHK);
      return null;
    }

    const regionChar = cleanHK[3];   // INDEX 3 CORRECT

    console.log("Region Char Picked:", regionChar);

    const regionMap = {
      W: "West",
      E: "East",
      S: "South",
      N: "North"
    };

    return regionMap[regionChar] || null;
  };




  const parseDate = (v) => (v ? new Date(v.split("T")[0]) : null);

  const warrantyData = useMemo(() => {
    return rawData.map((d, index) => {

      console.log("Row:", index, "HK value:", d.HK);

      const regionValue = getRegionFromRO(d.HK);

      console.log("Detected Region:", regionValue);

      return {
        ...d,
        sec: d.Domestic_Export?.trim(),
        hk: d.HK?.trim(),
        region: regionValue,
        productionDate: parseDate(d.Production_Date),
        repairDate: parseDate(d.Repair_Date),
      };
    });
  }, [rawData]);

  const baseData = warrantyData; 

  const uiFilteredData = useMemo(() => {
    return baseData.filter(d => {

      if (selectedModels.length && !selectedModels.includes(d.Model_Name))
        return false;

      if (selectedParts.length && !selectedParts.includes(d.Part_Number))
        return false;

      if (selectedRegions.length && !selectedRegions.includes(d.region))
        return false;

      return true;
    });
  }, [baseData, selectedModels, selectedParts, selectedRegions]);


  const filteredData = useMemo(() => {
    return warrantyData.filter((d) => {

      if (d.sec !== "Domestic") return false;

      if (repairFrom && repairTo) {

        // If no repair date, exclude
        if (!d.repairDate) return false;

        const from = new Date(repairFrom);
        const to = new Date(repairTo);
        to.setHours(23, 59, 59, 999);

        if (d.repairDate < from || d.repairDate > to)
          return false;
      }

      return true;
    });
  }, [warrantyData, repairFrom, repairTo]);


  // const filteredData = warrantyData;


  // 1️⃣ Production vs Repair
  const prodRepairData = useMemo(() => {

    const productionMap = {};
    const repairMap = {};

    const from = repairFrom ? new Date(repairFrom) : null;
    const to = repairTo ? new Date(repairTo) : null;
    if (to) to.setHours(23, 59, 59, 999);

    // 🔵 Production from UI filtered data
    uiFilteredData.forEach(d => {
      if (!d.productionDate) return;

      const key = d.productionDate.toISOString().slice(0, 7);
      productionMap[key] = (productionMap[key] || 0) + 1;
    });

    // 🔴 Repair from UI filtered + repair date filter
    uiFilteredData.forEach(d => {
      if (!d.repairDate) return;

      if (from && to) {
        if (d.repairDate < from || d.repairDate > to)
          return;
      }

      const key = d.repairDate.toISOString().slice(0, 7);
      repairMap[key] = (repairMap[key] || 0) + 1;
    });

    const allMonths = new Set([
      ...Object.keys(productionMap),
      ...Object.keys(repairMap)
    ]);

    return Array.from(allMonths)
      .sort()
      .map(month => ({
        month,
        production: productionMap[month] || 0,
        repair: repairMap[month] || 0
      }));

  }, [uiFilteredData, repairFrom, repairTo]);



  // 2️⃣ Used Month
  const usedMonthData = useMemo(() => {
    const map = {};
    uiFilteredData.forEach((d) => {
      const key = d.Used_Month;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([label, count]) => ({
      label,
      count,
    }));
  }, [uiFilteredData]);

  // 3️⃣ Mileage
  const mileageData = useMemo(() => {
    const ranges = {
      "0-10K": 0,
      "10-20K": 0,
      "20-30K": 0,
      "30-40K": 0,
      "40K+": 0,
    };

    uiFilteredData.forEach((d) => {
      if (d.Mileage < 10000) ranges["0-10K"]++;
      else if (d.Mileage < 20000) ranges["10-20K"]++;
      else if (d.Mileage < 30000) ranges["20-30K"]++;
      else if (d.Mileage < 40000) ranges["30-40K"]++;
      else ranges["40K+"]++;
    });

    return Object.entries(ranges).map(([label, count]) => ({
      label,
      count,
    }));
  }, [uiFilteredData]);

  // 4️⃣ Nature
  const natureData = useMemo(() => {
    const map = {};
    uiFilteredData.forEach((d) => {
      map[d.Nature_Code] = (map[d.Nature_Code] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({
      name,
      count,
    }));
  }, [uiFilteredData]);

  // 5️⃣ Region
  const regionData = useMemo(() => {
    const map = {};

    uiFilteredData.forEach((d) => {
      if (!d.region) return;   // skip null
      map[d.region] = (map[d.region] || 0) + 1;
    });

    return ["North", "South", "East", "West"].map(r => ({
      region: r,
      count: map[r] || 0
    }));
  }, [uiFilteredData]);

  const improvementBaseline = [
    { month: "Sep 2024", description: "Initial target set" },
    { month: "Nov 2024", description: "Process optimization phase 1" },
    { month: "Jun 2025", description: "Tooling improvement completed" }
  ];

  // Latest entry
  const latestImprovement =
    improvementBaseline[improvementBaseline.length - 1];

  const sortedData = [...prodRepairData].sort((a, b) => {
    return new Date(a.month) - new Date(b.month);
  });

  // ---------- UI ----------
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Warranty Analysis
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>

            {/* ROW 1 */}
            <Grid item xs={12} md={3}>
              <FormControl
                fullWidth
                size="small"
                sx={{
                  "& .MuiInputLabel-root": {
                    backgroundColor: "#fff",
                    px: 0.5,
                  }
                }}
              >
                <InputLabel shrink>Customer</InputLabel>
                <Select
                  value={customerSelected}
                  onChange={(e) => setCustomerSelected(e.target.value)}
                  label="Customer"
                >
                  {activeCustomers.map((c) => (
                    <MenuItem key={c.CustomerId} value={c.CustomerId}>
                      {c.CustomerName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl
                fullWidth
                size="small"
                sx={{
                  "& .MuiInputLabel-root": {
                    backgroundColor: "#fff",
                    px: 0.5,
                  }
                }}
              >
                <InputLabel shrink>Model</InputLabel>
                <Select
                  multiple
                  value={selectedModels}
                  onChange={(e) => setSelectedModels(e.target.value)}
                  renderValue={(selected) => selected.join(", ")}
                >
                  {[...new Set(warrantyData.map((d) => d.Model_Name))].map(
                    (model) => (
                      <MenuItem key={model} value={model}>
                        <Checkbox checked={selectedModels.includes(model)} />
                        <ListItemText primary={model} />
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl
                fullWidth
                size="small"
                sx={{
                  "& .MuiInputLabel-root": {
                    backgroundColor: "#fff",
                    px: 0.5,
                  }
                }}
              >
                <InputLabel shrink>Part No</InputLabel>
                <Select
                  multiple
                  value={selectedParts}
                  onChange={(e) => setSelectedParts(e.target.value)}
                  renderValue={(selected) => selected.join(", ")}
                >
                  {[...new Set(warrantyData.map((d) => d.Part_Number))].map(
                    (part) => (
                      <MenuItem key={part} value={part}>
                        <Checkbox checked={selectedParts.includes(part)} />
                        <ListItemText primary={part} />
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl
                fullWidth
                size="small"
                sx={{
                  "& .MuiInputLabel-root": {
                    backgroundColor: "#fff",
                    px: 0.5,
                  }
                }}
              >
                <InputLabel shrink>Region</InputLabel>
                <Select
                  multiple
                  value={selectedRegions}
                  onChange={(e) => setSelectedRegions(e.target.value)}
                >
                  {["North", "South", "East", "West"].map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ROW 2 - 4 DATE PICKERS */}

            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                label="Production From"
                value={prodDateFrom}
                onChange={(e) => setProdDateFrom(e.target.value)}
                fullWidth
                size="small"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                label="Production To"
                value={prodDateTo}
                onChange={(e) => setProdDateTo(e.target.value)}
                fullWidth
                size="small"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                label="Repair From"
                value={repairFrom}
                onChange={(e) => setRepairFrom(e.target.value)}
                fullWidth
                size="small"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                label="Repair To"
                value={repairTo}
                onChange={(e) => setRepairTo(e.target.value)}
                fullWidth
                size="small"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

          </Grid>
        </CardContent>
      </Card>


      {/* Charts */}
      <Grid container spacing={3}>

        {/* ✅ ROW 1 — FULL WIDTH */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography fontWeight="bold">
                Production vs Repair
              </Typography>

              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart
                  data={sortedData}
                  barCategoryGap="30%"   // space between months
                  barGap={4}             // space inside category
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  {/* 🔥 Force categorical axis */}
                  <XAxis
                    dataKey="month"
                    angle={-90}          // 🔥 rotate vertical
                    textAnchor="end"     // align properly
                    interval={0}         // show all months
                    height={80}          // give space for rotated text
                  />

                  <YAxis />

                  <Tooltip
                    formatter={(value, name, props) => {
                      if (
                        props?.payload?.month === latestImprovement.month
                      ) {
                        return [
                          value,
                          `${name} - Improvement: ${latestImprovement.description}`
                        ];
                      }
                      return [value, name];
                    }}
                  />

                  <Legend />

                  {/* Production Bar */}
                  <Bar
                    dataKey="production"
                    fill="#3b82f6"
                    barSize={25}   // control column width
                  />

                  {/* Repair Line */}
                  <Line
                    type="monotone"
                    dataKey="repair"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />

                  {/* Vertical Dotted Improvement Line */}
                  <ReferenceLine
                    x={latestImprovement.month}
                    stroke="black"
                    strokeWidth={2}
                    strokeDasharray="6 6"
                    label={{
                      value: "Improvement",
                      position: "top",
                      fill: "black",
                      fontSize: 12
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </Grid>

        {/* ✅ ROW 2 — 50% + 50% */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography fontWeight="bold">
                Used Months
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={usedMonthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography fontWeight="bold">
                Repair by Mileage
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mileageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* ✅ ROW 3 — 50% + 50% */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography fontWeight="bold">
                Nature
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart layout="vertical" data={natureData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography fontWeight="bold">
                Sales Region
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default WarrantyAnalysis;
