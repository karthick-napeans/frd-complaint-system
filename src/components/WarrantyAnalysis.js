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
  ListItemText, IconButton
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
  ComposedChart, ReferenceLine, LabelList
} from "recharts";
import { getWrantyReport } from "../api/pageApi";
import { useSelector } from "react-redux";
import html2canvas from "html2canvas";
import DownloadIcon from "@mui/icons-material/Download";

const WarrantyAnalysis = () => {
  const { customers } = useSelector((state) => state.masters);
  const activeCustomers = customers.filter((c) => c.IsActive);

  const [customerSelected, setCustomerSelected] = useState("");
  const [rawData, setRawData] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [selectedParts, setSelectedParts] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const formatLocalYYYYMMDD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const todayObj = new Date();

  // To date = today
  const today = formatLocalYYYYMMDD(todayObj);

  // From date = first day of same month last year
  const fromObj = new Date(
    todayObj.getFullYear() - 1,
    todayObj.getMonth(),
    1
  );

  const lastYearMonthStart = formatLocalYYYYMMDD(fromObj);

  // state
  const [prodDateFrom, setProdDateFrom] = useState(lastYearMonthStart);
  const [prodDateTo, setProdDateTo] = useState(today);

  const [repairFrom, setRepairFrom] = useState(lastYearMonthStart);
  const [repairTo, setRepairTo] = useState(today);
  const [errors, setErrors] = useState({});



  const handleDateChange = (field, value) => {
    let newProdFrom = prodDateFrom;
    let newProdTo = prodDateTo;
    let newRepairFrom = repairFrom;
    let newRepairTo = repairTo;

    if (field === "prodDateFrom") {
      newProdFrom = value;
      setProdDateFrom(value);
    }

    if (field === "prodDateTo") {
      newProdTo = value;
      setProdDateTo(value);
    }

    if (field === "repairFrom") {
      newRepairFrom = value;
      setRepairFrom(value);
    }

    if (field === "repairTo") {
      newRepairTo = value;
      setRepairTo(value);
    }

    // validate using updated values
    const newErrors = validateDates({
      prodDateFrom: newProdFrom,
      prodDateTo: newProdTo,
      repairFrom: newRepairFrom,
      repairTo: newRepairTo,
    });

    setErrors(newErrors); // ✅ overwrite old errors
  };

  const validateDates = ({
    prodDateFrom,
    prodDateTo,
    repairFrom,
    repairTo,
  } = {}) => {   // ✅ default prevents crash
    const errors = {};

    const prodFrom = prodDateFrom ? new Date(prodDateFrom) : null;
    const prodTo = prodDateTo ? new Date(prodDateTo) : null;
    const repFrom = repairFrom ? new Date(repairFrom) : null;
    const repTo = repairTo ? new Date(repairTo) : null;

    prodFrom?.setHours(0, 0, 0, 0);
    prodTo?.setHours(0, 0, 0, 0);
    repFrom?.setHours(0, 0, 0, 0);
    repTo?.setHours(0, 0, 0, 0);

    if (prodFrom && prodTo && prodFrom > prodTo) {
      errors.prodDateFrom = "From date must be ≤ To date";
      errors.prodDateTo = "To date must be ≥ From date";
    }

    if (repFrom && repTo && repFrom > repTo) {
      errors.repairFrom = "From date must be ≤ To date";
      errors.repairTo = "To date must be ≥ From date";
    }

    return errors;
  };

  useEffect(() => {
    const dateErrors = validateDates();

    setErrors(prev => ({
      ...prev,
      ...dateErrors,
    }));
  }, [prodDateFrom, prodDateTo, repairFrom, repairTo]);

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
    if (!hk) return null;
    const cleanHK = hk.trim().toUpperCase();
    const regionMap = {
      W: "West",
      E: "East",
      S: "South",
      N: "North"
    };
    // Find first matching region character anywhere in string
    for (let char of cleanHK) {
      if (regionMap[char]) {
        return regionMap[char];
      }
    }
    return null;
  };

  const downloadChart = async (id, fileName) => {
    const element = document.getElementById(id);
    if (!element) return;

    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 2,
    });

    const link = document.createElement("a");
    link.download = `${fileName}.jpeg`;
    link.href = canvas.toDataURL("image/jpeg", 1.0);
    link.click();
  };

  const parseDate = (v) => (v ? new Date(v.split("T")[0]) : null);

  const warrantyData = useMemo(() => {
    return rawData.map((d, index) => {
      const regionValue = getRegionFromRO(d.HK);
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

  // 1️⃣ Production vs Repair
  const prodRepairData = useMemo(() => {

    const productionMap = {};
    const repairMap = {};

    const from = repairFrom ? new Date(repairFrom) : null;
    const to = repairTo ? new Date(repairTo) : null;
    if (to) to.setHours(23, 59, 59, 999);

    uiFilteredData.forEach(d => {
      if (!d.productionDate) return;

      const key = d.productionDate.toISOString().slice(0, 7);

      productionMap[key] = (productionMap[key] || 0) + 1;
    });

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
      if (!d.region) return;
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
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={2}>
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
                onChange={(e) => handleDateChange("prodDateFrom", e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: today }}
                error={!!errors.prodDateFrom}
                helperText={errors.prodDateFrom}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                label="Production To"
                value={prodDateTo}
                onChange={(e) => handleDateChange("prodDateTo", e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: today }}
                error={!!errors.prodDateTo}
                helperText={errors.prodDateTo}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                label="Repair From"
                value={repairFrom}
                onChange={(e) => handleDateChange("repairFrom", e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: today }}
                error={!!errors.repairFrom}
                helperText={errors.repairFrom}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                label="Repair To"
                value={repairTo}
                onChange={(e) => handleDateChange("repairTo", e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: today }}
                error={!!errors.repairTo}
                helperText={errors.repairTo}
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
            <div id="prodRepairDiv">

              <CardContent>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight="bold">
                    Production vs Repair
                  </Typography>

                  <IconButton
                    size="small"
                    onClick={() => downloadChart("prodRepairDiv", "production_vs_repair")}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Box>

                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={sortedData}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      dataKey="month"
                      angle={-50}
                      textAnchor="end"
                      interval={0}
                      height={80}
                    />

                    <YAxis />
                    <Tooltip />
                    <Legend />

                    <Bar dataKey="production" fill="#3b82f6" barSize={25} />

                    <Line
                      type="monotone"
                      dataKey="repair"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    >
                      <LabelList
                        dataKey="repair"
                        position="top"
                        fill="#000000"
                        fontSize={12}
                        offset={9}

                      />
                    </Line>

                    <ReferenceLine
                      x={latestImprovement.month}
                      stroke="black"
                      strokeWidth={2}
                      strokeDasharray="6 6"
                    />

                  </ComposedChart>
                </ResponsiveContainer>

              </CardContent>
            </div>
          </Card>
        </Grid>

        {/* ✅ ROW 2 — 50% + 50% */}
        <Grid item xs={12} md={6}>
          <Card>
            <div id="usedMonthDiv">

              <CardContent>

                <Box display="flex" justifyContent="space-between">
                  <Typography fontWeight="bold">
                    Used Months
                  </Typography>

                  <IconButton
                    size="small"
                    onClick={() => downloadChart("usedMonthDiv", "used_months")}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Box>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={usedMonthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis
                      domain={[
                        0,
                        (dataMax) => {
                          const even = Math.ceil(dataMax);
                          return even % 2 === 0 ? even : even + 1;
                        }
                      ]}
                      allowDecimals={false}
                    />                 <Tooltip />
                    <Bar dataKey="count" fill="#10b981">
                      <LabelList
                        dataKey="count"
                        position="center"     // 👈 center inside bar
                        fill="#070707"        // white text for visibility
                        fontSize={14}
                      />
                    </Bar>

                  </BarChart>
                </ResponsiveContainer>

              </CardContent>
            </div>

          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <div id="mileageDiv">

              <CardContent>

                <Box display="flex" justifyContent="space-between">
                  <Typography fontWeight="bold">
                    Repair by Mileage
                  </Typography>

                  <IconButton
                    size="small"
                    onClick={() => downloadChart("mileageDiv", "repair_by_mileage")}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Box>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mileageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis
                      domain={[
                        0,
                        (dataMax) => {
                          const even = Math.ceil(dataMax);
                          return even % 2 === 0 ? even : even + 1;
                        }
                      ]}
                      allowDecimals={false}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b">
                      <LabelList
                        dataKey="count"
                        position="center"
                        fill="#000000"
                        fontSize={14}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>



              </CardContent>
            </div>

          </Card>
        </Grid>

        {/* ✅ ROW 3 — 50% + 50% */}
        <Grid item xs={12} md={6}>
          <Card>
            <div id="natureDiv">
              <CardContent>
                <Box display="flex" justifyContent="space-between">
                  <Typography fontWeight="bold">
                    Nature
                  </Typography>

                  <IconButton
                    size="small"
                    onClick={() => downloadChart("natureDiv", "nature")}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Box>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart layout="vertical" data={natureData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      domain={[
                        0,
                        (dataMax) => {
                          const even = Math.ceil(dataMax);
                          return even % 2 === 0 ? even : even + 1;
                        }
                      ]}
                      allowDecimals={false}
                    />
                    <YAxis dataKey="name" type="category" interval={0} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1">
                      <LabelList
                        dataKey="count"
                        position="right"   // 👈 outside above bar
                        fill="#000000"
                        fontSize={14}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

              </CardContent>
            </div>

          </Card>
        </Grid>


        <Grid item xs={12} md={6}>
          <Card>
            <div id="regionDiv">

              <CardContent>

                <Box display="flex" justifyContent="space-between">
                  <Typography fontWeight="bold">
                    Sales Region
                  </Typography>

                  <IconButton
                    size="small"
                    onClick={() => downloadChart("regionDiv", "sales_region")}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Box>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    layout="vertical"          // 👈 important
                    data={regionData}
                  >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      type="number"
                      domain={[
                        0,
                        (dataMax) => {
                          const even = Math.ceil(dataMax);
                          return even % 2 === 0 ? even : even + 1;
                        }
                      ]}
                      allowDecimals={false}
                    />

                    <YAxis
                      dataKey="region"         // 👈 category axis
                      type="category"
                    />

                    <Tooltip />

                    <Bar
                      dataKey="count"
                      fill="#8b5cf6"
                      barSize={25}
                    >
                      <LabelList
                        dataKey="count"
                        position="right"       // 👈 outside right
                        offset={6}
                        fill="#000"
                        fontSize={14}
                      />
                    </Bar>

                  </BarChart>
                </ResponsiveContainer>

              </CardContent>
            </div>
          </Card>
        </Grid>


      </Grid>
    </Box>);
};

export default WarrantyAnalysis;
