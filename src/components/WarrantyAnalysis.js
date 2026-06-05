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
  ComposedChart, ReferenceLine, LabelList, Brush
} from "recharts";
import CloseIcon from "@mui/icons-material/Close";
import { getWrantyReport, getAllImprovementList } from "../api/pageApi";
import { useSelector, useDispatch } from "react-redux";
import { loadMasters } from "../store/masterSlice";
import html2canvas from "html2canvas";
import DownloadIcon from "@mui/icons-material/Download";
import FilterListIcon from "@mui/icons-material/FilterList";
import Collapse from "@mui/material/Collapse";

const WarrantyAnalysis = () => {
  const dispatch = useDispatch();
  const { customers, models, parts } = useSelector((state) => state.masters);
  const activeCustomers = customers.filter((c) => c.IsActive);
  const [customerSelected, setCustomerSelected] = useState("");
  const [rawData, setRawData] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [selectedParts, setSelectedParts] = useState([]);
  const [selectedPartNames, setSelectedPartNames] = useState([]);
  const [modelSearch, setModelSearch] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const [partNameSearch, setPartNameSearch] = useState("");
  const [selectedRegions, setSelectedRegions] = useState([]);

  const filteredModels = useMemo(() => {
    return models
      ?.filter((model) => model.IsActive)
      .filter((model) =>
        model.ModelName.toLowerCase().includes(modelSearch.toLowerCase())
      ) || [];
  }, [models, modelSearch]);

  const filteredParts = useMemo(() => {
    return parts
      ?.filter((part) => part.IsActive)
      .filter((part) =>
        part.PartNumber.toLowerCase().includes(partSearch.toLowerCase())
      ) || [];
  }, [parts, partSearch]);

  const uniquePartNames = useMemo(() => {
    const activeParts = parts?.filter(p => p.IsActive) || [];
    const names = activeParts.map(p => p.PartName).filter(Boolean);
    return [...new Set(names)];
  }, [parts]);

  const filteredPartNamesList = useMemo(() => {
    return uniquePartNames.filter(name => name.toLowerCase().includes(partNameSearch.toLowerCase()));
  }, [uniquePartNames, partNameSearch]);

  const finalPartList = useMemo(() => {
    let list = [...selectedParts];
    if (selectedPartNames.length > 0) {
      const matchingParts = parts.filter(p => selectedPartNames.includes(p.PartName)).map(p => p.PartNumber);
      list = [...list, ...matchingParts];
    }
    return [...new Set(list)];
  }, [selectedParts, selectedPartNames, parts]);
  const [selectedMonthYear, setSelectedMonthYear] = useState("");
  const [hideDatePickers, setHideDatePickers] = useState(false);

  const monthYearOptions = useMemo(() => {
    const options = [];
    const currentDate = new Date();
    // Generate for the last 36 months
    for (let i = 0; i < 36; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, "0");
      const value = `${year}-${monthNum}`;

      const label = d.toLocaleString("en-US", { month: "long", year: "numeric" });
      options.push({ value, label });
    }
    return options;
  }, []);

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
  const [userSelectedProd, setUserSelectedProd] = useState(false);
  const [userSelectedRepair, setUserSelectedRepair] = useState(false);
  const [errors, setErrors] = useState({});
  const hasFetchedOnce = useRef(false);
  const [latestImprovement, setLatestImprovement] = useState(null);
  const [improvementList, setImprovementList] = useState([]);
  const [downloadingChartId, setDownloadingChartId] = useState(null);

  const baselineColors = [
    "#ff0000", // red
    "#ffbe0b", // green
    "#51ff01", // orange
    "#5007fa", // purple
    "#00d9ff", // cyan
  ];

  const filteredBaselines = (customerSelected && selectedModels.length > 0 && selectedParts.length > 0)
    ? improvementList?.filter(b =>
        selectedModels.includes(b.modelId) && 
        b.customerId == customerSelected &&
        selectedParts.includes(b.partNumber)
      )
    : [];

  useEffect(() => {
    dispatch(loadMasters());
    fetchImprovementList();
  }, [dispatch]);

  const fetchImprovementList = async () => {
    try {
      const res = await getAllImprovementList();
      console.log("Improvement List Response:", res);

      if (!res || res.length === 0) return;

      const sorted = [...res].sort(
        (a, b) =>
          new Date(b.ImprovementDate) - new Date(a.ImprovementDate)
      );


      const mapped = sorted.map((item) => ({
        id: item.ImprovementId,
        modelCode: item.ModelCode || item.ModelName,
        modelId: item.ModelId,
        customerId: item.CustomerId,
        partNumber: item.PartNumber,
        yearMonth: item.ImprovementDate.slice(0, 7),
        description: item.Details,
        date: item.ImprovementDate,
      }));

      setLatestImprovement(mapped[0]); // latest record
      setImprovementList(mapped);      // optional if you need full list

    } catch (err) {
      console.error("Error fetching improvement list", err);
    }
  };

  useEffect(() => {
    if (!customerSelected) return;
    if (hasFetchedOnce.current) return;

    hasFetchedOnce.current = true;

    const initLoad = async () => {
      const hasData = await fetchWarrantyReport();
      if (!hasData) {
        setFiltersOpen(true);
      }
    };
    initLoad();
  }, [customerSelected]);

  const handleMonthYearChange = (e) => {
    const val = e.target.value;
    setSelectedMonthYear(val);
    if (val) {
      const [yearStr, monthStr] = val.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      const fromDateStr = `${yearStr}-${monthStr}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const toDateStr = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

      setRepairFrom(fromDateStr);
      setRepairTo(toDateStr);
    } else {
      setRepairFrom(lastYearMonthStart);
      setRepairTo(today);
    }
  };

  const handleDateChange = (field, value) => {
    let newProdFrom = prodDateFrom;
    let newProdTo = prodDateTo;
    let newRepairFrom = repairFrom;
    let newRepairTo = repairTo;

    if (field === "prodDateFrom") {
      newProdFrom = value;
      setProdDateFrom(value);
      setUserSelectedProd(true);
    }

    if (field === "prodDateTo") {
      newProdTo = value;
      setProdDateTo(value);
      setUserSelectedProd(true);
    }

    if (field === "repairFrom") {
      newRepairFrom = value;
      setRepairFrom(value);
      setUserSelectedRepair(true);
      setSelectedMonthYear("");
    }

    if (field === "repairTo") {
      newRepairTo = value;
      setRepairTo(value);
      setUserSelectedRepair(true);
      setSelectedMonthYear("");
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
    if (selectedMonthYear) {
      setHideDatePickers(true);
      setErrors({}); // Clear date picker validation errors since they are now hidden
    } else {
      setHideDatePickers(false);
      const dateErrors = validateDates();
      if (Object.keys(dateErrors).length > 0) {
        setErrors(dateErrors);
        return;
      }
    }

    setLoading(true);

    try {
      const hasData = await fetchWarrantyReport();
      if (hasData) {
        setFiltersOpen(false);
      }
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
      let formattedMonthYear = "";
      if (selectedMonthYear) {
        const parts = selectedMonthYear.split("-");
        if (parts.length === 2) {
          formattedMonthYear = `${parts[1]}${parts[0]}`;
        }
      }

      const minDateDefaultObj = new Date(
        todayObj.getFullYear() - 15,
        todayObj.getMonth(),
        todayObj.getDate()
      );
      const minDateDefault = formatLocalYYYYMMDD(minDateDefaultObj);
      const maxDateDefault = today;

      const payload = {
        customerId: Number(customerSelected),
        productionFromDate: userSelectedProd ? (prodDateFrom || null) : minDateDefault,
        productionToDate: userSelectedProd ? (prodDateTo || null) : maxDateDefault,
        repairFromDate: userSelectedRepair ? (repairFrom || null) : minDateDefault,
        repairToDate: userSelectedRepair ? (repairTo || null) : maxDateDefault,
        modelList: selectedModels.map(id => models.find(m => m.ModelId === id)?.ModelCode).filter(Boolean) || [],
        partList: finalPartList || [],
        regionList: selectedRegions || [],
        MonthYear: formattedMonthYear,
      };

      console.log("Sending Payload:", payload);

      const response = await getWrantyReport(payload);
      const data = response?.data || response || null;

      setApiData(data);

      const hasData = !!(data?.Trend && data.Trend.length > 0);
      return hasData;

    } catch (error) {
      console.error("API ERROR:", error?.response?.data || error);
      return false;
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
    let targetId = id;
    if (id === "prodRepairDiv") {
      setDownloadingChartId(id);
    }
    
    setTimeout(async () => {
      const element = document.getElementById(targetId);
      if (!element) {
        setDownloadingChartId(null);
        return;
      }

      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      const link = document.createElement("a");
      link.download = `${fileName}.jpeg`;
      link.href = canvas.toDataURL("image/jpeg", 1.0);
      link.click();
      setDownloadingChartId(null);
    }, 150);
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

      if (selectedModels.length && !selectedModels.some(id => models.find(m => m.ModelId === id)?.ModelName === d.Model_Name))
        return false;

      if (finalPartList.length && !finalPartList.includes(d.Part_Number))
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
    if (!apiData?.RegionDistribution) return [];

    const regionMap = {};

    apiData.RegionDistribution.forEach(item => {
      regionMap[item.Region] = item.FailureCount;
    });

    const regionNameMap = {
      N: "North",
      S: "South",
      E: "East",
      W: "West",
    };

    return ["N", "S", "E", "W"].map(code => ({
      region: regionNameMap[code],
      count: regionMap[code] || 0,
    }));

  }, [apiData]);

  // 6️⃣ Cause Code Distribution
  const causeCodeData = useMemo(() => {
    if (!apiData?.CauseCodeDistribution) return [];

    return apiData.CauseCodeDistribution.map(item => {
      const labelKey = Object.keys(item).find(key => key !== "FailureCount") || "Region";
      return {
        name: item[labelKey]?.trim() || "N/A",
        count: item.FailureCount || 0,
      };
    });
  }, [apiData]);

  // 7️⃣ Domestic vs Export Distribution
  const domesticExportData = useMemo(() => {
    if (!apiData?.DomesticExportDistribution) return [];

    return apiData.DomesticExportDistribution.map(item => {
      const labelKey = Object.keys(item).find(key => key !== "FailureCount") || "Region";
      return {
        name: item[labelKey]?.trim() || "N/A",
        count: item.FailureCount || 0,
      };
    });
  }, [apiData]);

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
        <Typography variant="h5" fontWeight="bold" sx={{ color: "#3b3b3b" }}>
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
              <Grid item xs={12} md={2}>
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



              <Grid item xs={12} md={2}>
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
                                   <Select
                    multiple
                    value={selectedModels}
                    onChange={(e) => setSelectedModels(e.target.value)}
                    onClose={() => setModelSearch("")}
                    renderValue={(selected) =>
                      selected
                        .map((id) => models.find((m) => m.ModelId === id)?.ModelName)
                        .filter(Boolean)
                        .join(", ")
                    }
                    MenuProps={{
                      autoFocus: false,
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        }
                      }
                    }}
                  >
                    <Box
                      sx={{
                        position: "sticky",
                        top: 0,
                        bgcolor: "background.paper",
                        zIndex: 1,
                        p: 1,
                        borderBottom: "1px solid #e0e0e0"
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <TextField
                        size="small"
                        autoFocus
                        placeholder="Search Model..."
                        fullWidth
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Box>

                    {filteredModels.map((model) => (
                      <MenuItem key={model.ModelId} value={model.ModelId}>
                        <Checkbox checked={selectedModels.includes(model.ModelId)} />
                        <ListItemText primary={model.ModelName} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
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
                    onClose={() => setPartSearch("")}
                    renderValue={(selected) =>
                      selected
                        .map((num) => parts.find((p) => p.PartNumber === num)?.PartNumber)
                        .filter(Boolean)
                        .join(", ")
                    }
                    MenuProps={{
                      autoFocus: false,
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        }
                      }
                    }}
                  >
                    <Box
                      sx={{
                        position: "sticky",
                        top: 0,
                        bgcolor: "background.paper",
                        zIndex: 1,
                        p: 1,
                        borderBottom: "1px solid #e0e0e0"
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <TextField
                        size="small"
                        autoFocus
                        placeholder="Search Part Number..."
                        fullWidth
                        value={partSearch}
                        onChange={(e) => setPartSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Box>

                    {filteredParts.map((part) => (
                      <MenuItem
                        key={part.PartId}
                        value={part.PartNumber}   // ✅ send PartNumber
                      >
                        <Checkbox
                          checked={selectedParts.includes(part.PartNumber)}
                        />
                        <ListItemText
                          primary={part.PartNumber}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
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
                  <InputLabel shrink>Part Name</InputLabel>
                  <Select
                    multiple
                    value={selectedPartNames}
                    onChange={(e) => setSelectedPartNames(e.target.value)}
                    onClose={() => setPartNameSearch("")}
                    renderValue={(selected) => selected.join(", ")}
                    MenuProps={{
                      autoFocus: false,
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        }
                      }
                    }}
                  >
                    <Box
                      sx={{
                        position: "sticky",
                        top: 0,
                        bgcolor: "background.paper",
                        zIndex: 1,
                        p: 1,
                        borderBottom: "1px solid #e0e0e0"
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <TextField
                        size="small"
                        autoFocus
                        placeholder="Search Part Name..."
                        fullWidth
                        value={partNameSearch}
                        onChange={(e) => setPartNameSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Box>

                    {filteredPartNamesList.map((name) => (
                      <MenuItem key={name} value={name}>
                        <Checkbox checked={selectedPartNames.includes(name)} />
                        <ListItemText primary={name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
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
                    renderValue={(selected) => selected.join(", ")}
                  >
                    {["North", "South", "East", "West"].map((region) => (
                      <MenuItem key={region} value={region}>
                        <Checkbox checked={selectedRegions.indexOf(region) > -1} />
                        <ListItemText primary={region} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
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
                  <InputLabel shrink>Month & Year</InputLabel>
                  <Select
                    value={selectedMonthYear}
                    onChange={handleMonthYearChange}
                    label="Month & Year"
                  >
                    <MenuItem value="">
                      <em>All Months</em>
                    </MenuItem>
                    {monthYearOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* ROW 2 - 4 DATE PICKERS */}
              {!hideDatePickers && (
                <>
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
                </>
              )}

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
                  setSelectedPartNames([]);
                  setSelectedRegions([]);
                  setProdDateFrom(lastYearMonthStart);
                  setProdDateTo(today);
                  setRepairFrom(lastYearMonthStart);
                  setRepairTo(today);
                  setUserSelectedProd(false);
                  setUserSelectedRepair(false);
                  setSelectedMonthYear("");
                  setHideDatePickers(false);
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
                      angle={sortedData.length > 15 ? -60 : 0}
                      textAnchor={sortedData.length > 15 ? "end" : "middle"}
                      interval={sortedData.length > 15 ? Math.ceil(sortedData.length / 30) : 0}
                      minTickGap={20}
                      height={sortedData.length > 15 ? 100 : 60}
                      tick={{ fontSize: 15 }}
                    />

                    <YAxis
                      allowDecimals={false}
                      domain={[5, (dataMax) => dataMax + 20]}
                      interval={0}
                      tickMargin={8}
                    />

                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) return null;

                        const matchedBaselines = filteredBaselines?.filter(
                          (b) => b.yearMonth === label
                        );

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

                            {matchedBaselines && matchedBaselines.length > 0 && matchedBaselines.map((baseline, idx) => (
                              <p
                                key={idx}
                                style={{
                                  marginTop: 6,
                                  fontWeight: 600,
                                  color: baselineColors[improvementList.indexOf(baseline) % baselineColors.length] || "#ef4444",
                                }}
                              >
                                {baseline.modelCode} Improvement:{" "}
                                {baseline.description || ""}
                              </p>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Legend />

                    <Bar dataKey="production" fill="#3b82f6" barSize={25}>
                      <LabelList
                        dataKey="production"
                        position="top"
                        fill="#3b82f6"
                        fontSize={12}
                        fontWeight={600}
                        stroke="#ffffff"
                        strokeWidth={3}
                        style={{ paintOrder: "stroke", pointerEvents: "none" }}
                        offset={6}
                      />
                    </Bar>

                    <Line
                      type="monotone"
                      dataKey="repair"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    >
                      <LabelList
                        dataKey="repair"
                        position="right"
                        fill="#ef4444"
                        fontSize={13}
                        fontWeight={800}
                        stroke="#ffffff"
                        strokeWidth={4}
                        style={{ paintOrder: "stroke", pointerEvents: "none" }}
                        offset={6}
                      />
                    </Line>

                    {(() => {
                      const grouped = filteredBaselines?.reduce((acc, b) => {
                        if (!acc[b.yearMonth]) acc[b.yearMonth] = [];
                        acc[b.yearMonth].push(b);
                        return acc;
                      }, {});

                      if (!grouped) return null;

                      return Object.entries(grouped).map(([month, baselines]) => {
                        const isMultiple = baselines.length > 1;
                        // Use a neutral color if multiple, or the first one's color
                        const lineColor = isMultiple ? "#1e3a8a" : baselineColors[improvementList.indexOf(baselines[0]) % baselineColors.length];

                        return (
                          <ReferenceLine
                            key={month}
                            x={month}
                            stroke={lineColor}
                            strokeWidth={isMultiple ? 5 : 4} // Thicker line if multiple
                            strokeDasharray={isMultiple ? "0" : "6 3"} // Solid line if multiple
                            isFront={true}
                            label={({ viewBox }) => {
                              const { x, y } = viewBox;
                              
                              if (downloadingChartId === "prodRepairDiv") {
                                const dataPoint = sortedData.find(d => d.month === month);
                                const boxWidth = 180;
                                const boxHeight = 75 + (baselines.length * 20);
                                const boxX = x > 200 ? x - boxWidth - 10 : x + 10;
                                const boxY = y + 10;

                                return (
                                  <g>
                                    <rect x={boxX} y={boxY} width={boxWidth} height={boxHeight} fill="#fff" stroke="#ddd" rx={6} />
                                    <text x={boxX + 10} y={boxY + 20} fill="#333" fontSize={13} fontWeight="bold">{month}</text>
                                    <text x={boxX + 10} y={boxY + 40} fill="#666" fontSize={13}>production: {dataPoint?.production || 0}</text>
                                    <text x={boxX + 10} y={boxY + 60} fill="#666" fontSize={13}>repair: {dataPoint?.repair || 0}</text>
                                    {baselines.map((baseline, idx) => {
                                      const color = baselineColors[improvementList.indexOf(baseline) % baselineColors.length] || "#ef4444";
                                      return (
                                        <text key={baseline.id} x={boxX + 10} y={boxY + 80 + (idx * 20)} fill={color} fontSize={13} fontWeight="bold">
                                          {baseline.modelCode} Improvement: {baseline.description || ""}
                                        </text>
                                      );
                                    })}
                                  </g>
                                );
                              }

                              return (
                                <g>
                                  {baselines.map((baseline, idx) => {
                                    const color = baselineColors[improvementList.indexOf(baseline) % baselineColors.length];
                                    const yOffset = idx * 22;
                                    return (
                                      <text
                                        key={baseline.id}
                                        x={x}
                                        y={y - 10 - yOffset}
                                        textAnchor="middle"
                                        fill={color}
                                        fontSize={13}
                                        fontWeight={800}
                                        style={{
                                          pointerEvents: "none",
                                          paintOrder: "stroke",
                                          stroke: "#ffffff",
                                          strokeWidth: 4
                                        }}
                                      >
                                        {baseline.modelCode} BASELINE
                                      </text>
                                    );
                                  })}
                                  {isMultiple && (
                                    <text
                                      x={x}
                                      y={y - 12 - (baselines.length * 22)}
                                      textAnchor="middle"
                                      fill="#d32f2f"
                                      fontSize={11}
                                      fontWeight={900}
                                      style={{
                                        pointerEvents: "none",
                                        paintOrder: "stroke",
                                        stroke: "#ffffff",
                                        strokeWidth: 3
                                      }}
                                    >
                                      ({baselines.length} IMPROVEMENTS)
                                    </text>
                                  )}
                                </g>
                              );
                            }}
                          />
                        );
                      });
                    })()}
                    {sortedData.length > 0 && (
                      <Brush
                        dataKey="month"
                        height={26}
                        stroke="#3b82f6"
                        fill="#f8fafc"
                        startIndex={Math.max(0, sortedData.length - 36)}
                        endIndex={sortedData.length - 1}
                      />
                    )}
                  </ComposedChart>


                </ResponsiveContainer>
                {filteredBaselines?.length > 0 && (
                  <Box
                    display="flex"
                    justifyContent="center"
                    gap={3}
                    mt={2}
                    flexWrap="wrap"
                  >
                    {filteredBaselines.map((baseline) => {
                      const color = baselineColors[improvementList.indexOf(baseline) % baselineColors.length];

                      return (
                        <Box
                          key={baseline.id}
                          display="flex"
                          alignItems="center"
                          gap={1}
                        >
                          {/* Colored Line Indicator */}
                          <Box
                            sx={{
                              width: 30,
                              height: 3,
                              backgroundColor: color,
                              borderRadius: 1
                            }}
                          />

                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 600, color }}
                          >
                            {baseline.modelCode} BASELINE
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </CardContent>

            </div>
          </Card>
        </Grid>

         <div
          id="prodRepairDiv_full"
          style={{
            position: "absolute",
            left: "-9999px",
            top: "-9999px",
            width: "1800px",
            background: "#ffffff",
          }}
        >
          <div style={{ padding: "30px" }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: "#3b3b3b", textAlign: "center" }}>
              Production vs Repair (Full 15 Years Trend)
            </Typography>
            <ResponsiveContainer width="100%" height={500}>
              <ComposedChart data={sortedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  angle={-60}
                  textAnchor="end"
                  interval={Math.ceil(sortedData.length / 40)}
                  height={100}
                  tick={{ fontSize: 13 }}
                />
                <YAxis allowDecimals={false} domain={[5, (dataMax) => dataMax + 20]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="production" fill="#3b82f6" barSize={15}>
                  <LabelList
                    dataKey="production"
                    position="top"
                    fill="#3b82f6"
                    fontSize={10}
                    fontWeight={600}
                    stroke="#ffffff"
                    strokeWidth={3}
                    style={{ paintOrder: "stroke", pointerEvents: "none" }}
                    offset={6}
                  />
                </Bar>
                <Line
                  type="monotone"
                  dataKey="repair"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                >
                  <LabelList
                    dataKey="repair"
                    position="right"
                    fill="#ef4444"
                    fontSize={11}
                    fontWeight={800}
                    stroke="#ffffff"
                    strokeWidth={4}
                    style={{ paintOrder: "stroke", pointerEvents: "none" }}
                    offset={6}
                  />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

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
                    <XAxis dataKey="label" interval={1} />
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
                    <XAxis dataKey="label" interval={1} />
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
                    <YAxis dataKey="name" type="category" interval={3} />
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

        {/* ✅ ROW 4 — 50% + 50% */}
        <Grid item xs={12} md={6}>
          <Card>
            <div id="causeCodeDiv">
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight="bold">
                    Cause Code Distribution
                  </Typography>

                  <IconButton
                    size="small"
                    onClick={() => downloadChart("causeCodeDiv", "cause_code_distribution")}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Box>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    layout="vertical"
                    data={causeCodeData}
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
                    <YAxis dataKey="name" type="category" interval={0} width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ec4899" barSize={25}>
                      <LabelList
                        dataKey="count"
                        position="right"
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

        <Grid item xs={12} md={6}>
          <Card>
            <div id="domesticExportDiv">
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight="bold">
                    Domestic / Export Distribution
                  </Typography>

                  <IconButton
                    size="small"
                    onClick={() => downloadChart("domesticExportDiv", "domestic_export_distribution")}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Box>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={domesticExportData}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
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
                    <Bar dataKey="count" fill="#06b6d4" barSize={40}>
                      <LabelList
                        dataKey="count"
                        position="top"
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
