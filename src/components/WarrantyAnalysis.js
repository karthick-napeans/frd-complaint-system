import React, { useState, useMemo, useEffect, useRef } from "react";
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
  ListItemText, IconButton, Button
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
import CloseIcon from "@mui/icons-material/Close";
import { getWrantyReport, getAllImprovementList } from "../api/pageApi";
import { useSelector } from "react-redux";
import html2canvas from "html2canvas";
import DownloadIcon from "@mui/icons-material/Download";
import FilterListIcon from "@mui/icons-material/FilterList";
import Collapse from "@mui/material/Collapse";

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
  const [apiData, setApiData] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const todayObj = new Date();
  const today = formatLocalYYYYMMDD(todayObj);
  const fromObj = new Date(
    todayObj.getFullYear() - 1,
    todayObj.getMonth(),
    1
  );
  const lastYearMonthStart = formatLocalYYYYMMDD(fromObj);
  const [prodDateFrom, setProdDateFrom] = useState(lastYearMonthStart);
  const [prodDateTo, setProdDateTo] = useState(today);
  const [repairFrom, setRepairFrom] = useState(lastYearMonthStart);
  const [repairTo, setRepairTo] = useState(today);
  const [errors, setErrors] = useState({});
  const hasFetchedOnce = useRef(false);
  const [latestImprovement, setLatestImprovement] = useState(null);

  useEffect(() => {
    fetchImprovementList();
  }, []);

  const fetchImprovementList = async () => {
    try {
      const res = await getAllImprovementList();

      if (!res || res.length === 0) return;

      // Sort latest first
      const sorted = res.sort(
        (a, b) =>
          new Date(b.ImprovementDate) - new Date(a.ImprovementDate)
      );

      const latest = sorted[0];

      setLatestImprovement({
        id: latest.ImprovementId,
        date: latest.ImprovementDate,
        yearMonth: latest.ImprovementDate.slice(0, 7), // YYYY-MM
        description: latest.Details,
      });

    } catch (err) {
      console.error("Error fetching improvement list", err);
    }
  };

  useEffect(() => {
    if (!customerSelected) return;
    if (hasFetchedOnce.current) return;

    hasFetchedOnce.current = true;

    fetchWarrantyReport();
  }, [customerSelected]);

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

  const handleApplyFilters = async () => {
    const dateErrors = validateDates();

    if (Object.keys(dateErrors).length > 0) {
      setErrors(dateErrors);
      return;
    }

    setLoading(true);

    try {
      await fetchWarrantyReport();
      setFiltersOpen(false); // collapse after success
    } finally {
      setLoading(false);
    }
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

  // useEffect(() => {
  //   if (!customerSelected || !prodDateFrom || !prodDateTo) return;

  //   fetchWarrantyReport();
  // }, [customerSelected, prodDateFrom, prodDateTo]);

  const fetchWarrantyReport = async () => {
    try {
      const payload = {
        customerId: Number(customerSelected),
        productionFromDate: prodDateFrom || null,
        productionToDate: prodDateTo || null,
        repairFromDate: repairFrom || null,
        repairToDate: repairTo || null,
        modelList: selectedModels || [],
        partList: selectedParts || [],
        regionList: selectedRegions || [],
      };

      console.log("Sending Payload:", payload);

      const response = await getWrantyReport(payload);

      setApiData(response?.data || response || null);

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
    if (!apiData?.Trend) return [];

    return apiData.Trend.map(item => ({
      month: item.YearMonth,
      production: item.ProductionCount,
      repair: item.RepairCount,
    }));
  }, [apiData]);

  // 2️⃣ Used Month
  const usedMonthData = useMemo(() => {
    if (!apiData?.UsedMonthDistribution) return [];

    return apiData.UsedMonthDistribution.map(item => ({
      label: item.UsedMonthRange,
      count: item.FailureCount,
    }));
  }, [apiData]);

  // 3️⃣ Mileage
  const mileageData = useMemo(() => {
    if (!apiData?.MileageDistribution) return [];

    return apiData.MileageDistribution.map(item => ({
      label: item.MileageRange,
      count: item.FailureCount,
    }));
  }, [apiData]);

  // 4️⃣ Nature
  const natureData = useMemo(() => {
    if (!apiData?.NatureDistribution) return [];

    return apiData.NatureDistribution.map(item => ({
      name: item.Nature_Code,
      count: item.FailureCount,
    }));
  }, [apiData]);

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





  const sortedData = [...prodRepairData].sort((a, b) => {
    return new Date(a.month) - new Date(b.month);
  });



  // ---------- UI ----------
  return (
    <Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="h5" fontWeight="bold">
          Warranty Analysis
        </Typography>

        {!filtersOpen && (
          <Button
            variant="contained"
            size="small"
            startIcon={<FilterListIcon />}
            onClick={() => setFiltersOpen(true)}
          >
            Filters
          </Button>
        )}
      </Box>



      <Collapse in={filtersOpen} timeout="auto" unmountOnExit>
        <Card
          sx={{
            mb: 3,
            borderRadius: 3,
            boxShadow: 2,
          }}
        >
          <CardContent>

            {/* HEADER */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={3}
            >
              <Typography variant="h6" fontWeight={600}>
                Filters
              </Typography>

              <IconButton
                size="small"
                onClick={() => setFiltersOpen(false)}
                sx={{
                  backgroundColor: "#f5f5f5",
                  "&:hover": { backgroundColor: "#e0e0e0" },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* FILTER FIELDS */}
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

            {/* ACTION BUTTONS */}
            <Box
              display="flex"
              justifyContent="flex-end"
              gap={2}
              mt={4}
            >
              <Button
                variant="outlined"
                onClick={() => {
                  setSelectedModels([]);
                  setSelectedParts([]);
                  setSelectedRegions([]);
                  setProdDateFrom("");
                  setProdDateTo("");
                  setRepairFrom("");
                  setRepairTo("");
                }}
              >
                Reset
              </Button>

              <Button
                variant="contained"
                onClick={handleApplyFilters}
                disabled={loading}
              >
                {loading ? "Applying..." : "Apply Filters"}
              </Button>
            </Box>

          </CardContent>
        </Card>
      </Collapse>


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
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) return null;

                        const isBaseline =
                          latestImprovement?.yearMonth === label;

                        return (
                          <div
                            style={{
                              background: "#fff",
                              padding: "10px",
                              border: "1px solid #ddd",
                              borderRadius: 6,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            }}
                          >
                            <p style={{ margin: 0, fontWeight: 600 }}>
                              {label}
                            </p>

                            {payload.map((entry, index) => (
                              <p key={index} style={{ margin: 0 }}>
                                {entry.name}: {entry.value}
                              </p>
                            ))}

                            {isBaseline && (
                              <p
                                style={{
                                  marginTop: 6,
                                  fontWeight: 600,
                                  color: "red",
                                }}
                              >
                                Improvement: {latestImprovement.description}
                              </p>
                            )}
                          </div>
                        );
                      }}
                    />
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
                      x={latestImprovement?.yearMonth}
                      stroke="red"
                      strokeDasharray="5 5"
                      label={({ viewBox }) => {
                        const { x, y } = viewBox;
                        return (
                          <text
                            x={x}
                            y={y - 5}
                            textAnchor="middle"
                            fill="red"
                            fontWeight="bold"     // 🔥 bold
                            fontSize={12}
                          >
                            Latest Improvement
                          </text>
                        );
                      }}
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
