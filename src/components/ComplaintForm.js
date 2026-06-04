import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails, Checkbox, FormHelperText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow, FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tooltip

} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from "@mui/icons-material/Save";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useSelector, useDispatch } from "react-redux";
import { loadMasters } from "../store/masterSlice";
import CircularProgress from "@mui/material/CircularProgress";
import { submitCustomerComplaint, getCustomerComplaints, getAttachmentChecklist, downloadAttachment } from "../api/pageApi";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Email } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";




const ComplaintForm = () => {
  const dispatch = useDispatch();
  const { parts, models, repairCauses, customers, defects } = useSelector((state) => state.masters);
  console.log('Model Form Complaint Form', models);
  const activeCustomers = customers.filter((p) => p.IsActive === true);
  const activeParts = parts.filter((p) => p.IsActive === true);
  const activeModels = models.filter((m) => m.IsActive === true);
  const activeRepairCauses = repairCauses.filter((c) => c.IsActive === true);
  const activeDefects = defects ? defects.filter((d) => d.IsActive === true) : [];
  const fallbackDefects = ["Dent", "Scratch", "Dimension Issue", "Broken", "Leakage", "Others"];
  const displayDefects = activeDefects.length > 0
    ? activeDefects.map((d) => d.Defect)
    : fallbackDefects;
  const [expandedPanel, setExpandedPanel] = useState(null);
  const SEVERITY_LEVELS = ["Low", "Medium", "High", "Critical"];
  const [activeStep, setActiveStep] = useState(0);
  const [message, setMessage] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [submitted, setSubmitted] = useState([]);
  const steps = [
    "Complaint Header",
    "Problem & Cause",
    "Attachments",
    "Review & Submit",
  ];
  const today = new Date().toISOString().split("T")[0];
  const [attachmentList, setAttachmentList] = useState([])
  const [attachmentsLoaded, setAttachmentsLoaded] = useState(false);
  const [attachmentRows, setAttachmentRows] = useState(
    attachmentList.map(item => ({
      ...item,
      checked: item.isMandatory,
      file: null,
      expiryDate: "",
      openDate: ""
    }))
  );

  const INITIAL_FORM_STATE = {
    complaintId: "",
    complaintNo: "",
    customerSelected: "",
    customerEmail: "",
    IsRegistered: true,
    complaintDate: today,
    modelSelected: "",
    partSelected: "",
    problemStatement: "",
    quantity: "",
    severityLevel: SEVERITY_LEVELS[0],
    fourM: "",
    defect: "",
    attachments: [],
    status: "",
  };
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [modelSearch, setModelSearch] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const [originalChecklist, setOriginalChecklist] = useState([]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const res = await getAttachmentChecklist();
        console.log("Fetched attachment checklist:", res);

        const rows = res.map(item => ({
          id: item.Id,
          listName: item.Name,
          isMandatory: item.Ismandatory,
          checked: item.Ismandatory,
          file: null,
          expiryDate: "",
          emails: "",
        }));

        setAttachmentList(rows);
        setAttachmentRows(rows);
        setAttachmentsLoaded(true);
      } catch (err) {
        console.error("Error While Fetch Attachments List", err);
      }
    };

    fetchAttachments();
  }, []);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : null);
  };

  useEffect(() => {
    dispatch(loadMasters());
    fetchComplaints();
  }, [dispatch]);

  const fetchComplaints = async () => {
    try {
      const data = await getCustomerComplaints();

      console.log("Fetched complaints:", data);

      const safeData = Array.isArray(data) ? data : [];

      const normalizeStatus = (status) =>
        status?.toString().trim().toUpperCase();

      // ✅ sort latest first
      const sortedData = [...safeData].sort((a, b) => {
        const dateDiff =
          new Date(b.ComplaintDate) - new Date(a.ComplaintDate);

        // if same date, sort by ComplaintId
        return dateDiff !== 0
          ? dateDiff
          : b.ComplaintId - a.ComplaintId;
      });

      setComplaints(sortedData);

      setDrafts(
        sortedData.filter(
          (i) => normalizeStatus(i.Status) === "DRAFT"
        )
      );

      setSubmitted(
        sortedData.filter(
          (i) => normalizeStatus(i.Status) === "SUBMITTED"
        )
      );

    } catch (err) {
      console.error(err);
      setComplaints([]);
      setDrafts([]);
      setSubmitted([]);
    }
  };

  const handleDraftClick = (draft) => {

    if (!attachmentsLoaded) {
      console.warn("Attachments not loaded yet");
      return;
    }

    setActiveDraftId(draft.ComplaintId);

    // Split API values
    const checklistIds = draft.CheckListIds
      ? draft.CheckListIds.split(",").map(Number)
      : [];

    const attachmentIds = draft.AttachmentIds
      ? draft.AttachmentIds.split(",")
      : [];

    const attachmentNames = draft.AttachmentNames
      ? draft.AttachmentNames.split(",")
      : [];

    const emails = draft.NotificationEmails
      ? draft.NotificationEmails.split(",")
      : [];

    const dueDates = draft.DueDates
      ? draft.DueDates.split(",").map((d) => d.trim())
      : [];

    const openDates = draft.OpenDates
      ? draft.OpenDates.split(",").map((d) => d.trim())
      : [];

    // Convert API date -> YYYY-MM-DD
    const formatDateForInput = (dateStr) => {
      if (!dateStr) return "";

      const cleaned = dateStr.replace(/\s+/g, " ").trim();

      if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
        return cleaned;
      }

      // Treat slash dates from API as dd/mm/yyyy.
      const dmyMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dmyMatch) {
        const day = String(Number(dmyMatch[1])).padStart(2, "0");
        const month = String(Number(dmyMatch[2])).padStart(2, "0");
        const year = dmyMatch[3];
        return `${year}-${month}-${day}`;
      }

      // API sometimes returns "May  3 2026 12:00AM" (no space before AM/PM).
      const normalized = cleaned.replace(/(\d)(AM|PM)$/i, "$1 $2");
      const parsed = new Date(normalized);

      if (Number.isNaN(parsed.getTime())) {
        return "";
      }

      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const day = String(parsed.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    const updatedRows = attachmentRows.map((row) => {

      let fileName = "";
      let email = "";
      let expiryDate = "";
      let openDate = "";
      let attachmentId = "";
      let checked = row.isMandatory; // Ensure mandatory items are always checked

      checklistIds.forEach((id, index) => {

        if (id === row.id) {

          checked = true;

          fileName = attachmentNames[index] || "";
          email = emails[index] || "";
          attachmentId = attachmentIds[index] || "";

          expiryDate = formatDateForInput(dueDates[index]);
          openDate = formatDateForInput(openDates[index]);

        }

      });

      // If a file is attached, ensure it is checked
      if (fileName) {
        checked = true;
      }

      return {
        ...row,
        checked,
        fileName,
        emails: email,
        expiryDate,
        openDate,
        attachmentId
      };

    });

    setAttachmentRows(updatedRows);
    setOriginalChecklist(JSON.parse(JSON.stringify(updatedRows)));
    setFormData({
      complaintId: draft.ComplaintId || "",
      complaintNo: draft.ComplaintNo || "",
      customerSelected: draft.CustomerId || "",
      customerEmail: draft.CustomerEmail || "",
      IsRegistered: draft.IsRegistred ?? true,
      complaintDate: draft.ComplaintDate?.split("T")[0] || "",
      modelSelected: activeModels.find(m => m.ModelName === draft.Model)?.ModelId || draft.Model || "",
      partSelected: activeParts.find(p => p.PartNumber === draft.Part || p.PartName === draft.Part)?.PartId || draft.Part || "",
      problemStatement: draft.ProblemStatement || "",
      quantity: draft.CauseCode || "",
      severityLevel: draft.Severity || SEVERITY_LEVELS[0],
      fourM: draft["4M"] || draft.FourM || draft.fourM || "",
      defect: draft.Defect || draft.defect || "",
      status: draft.Status || "DRAFT",
    });

    setActiveStep(0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "customerEmail") {

      // Allow only valid email characters
      if (!/^[a-zA-Z0-9@._-]*$/.test(value)) {
        return;
      }

      const emailRegex = /^[^\s@]+@iljin\.com$/i;

      if (value && !emailRegex.test(value)) {
        setErrors((prev) => ({
          ...prev,
          customerEmail: "Only @iljin.com emails allowed",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          customerEmail: "",
        }));
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name !== "customerEmail" && value) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 🔥 CLEAR ERROR WHEN VALUE IS SELECTED
    if (value) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const isStep2Valid = () => {
    return !attachmentRows.some(
      (row) =>
        row.checked &&
        (
          !row.expiryDate ||
          !row.emails?.trim() ||
          !!validateEmails(row.emails)
        )
    );
  };

  const validateEmails = (emailString) => {
    if (!emailString) return "Email is required";

    const emails = emailString
      .split(/[,\n]/)
      .map(e => e.trim())
      .filter(e => e !== "");

    const emailRegex = /^[^\s@]+@iljin\.com$/i;

    const invalidEmails = emails.filter(
      email => !emailRegex.test(email)
    );

    if (invalidEmails.length > 0) {
      return `Only @iljin.com emails allowed: ${invalidEmails.join(", ")}`;
    }

    return "";
  };

  const handleNext = () => {
    console.log(">>> handleNext called | Step:", activeStep);
    console.log(">>> formData:", formData);

    let tempErrors = {};

    /* ================= STEP 0 ================= */
    if (activeStep === 0) {
      if (!formData.customerSelected)
        tempErrors.customerSelected = "Required";

      if (!formData.customerEmail)
        tempErrors.customerEmail = "Required";

      if (!formData.complaintDate)
        tempErrors.complaintDate = "Required";

      if (!formData.modelSelected)
        tempErrors.modelSelected = "Required";

      if (!formData.partSelected)
        tempErrors.partSelected = "Required";



      if (Object.keys(tempErrors).length > 0) {
        console.log(">>> Step 0 Errors:", tempErrors);
        setErrors(tempErrors);
        return;
      }
    }

    /* ================= STEP 1 ================= */
    if (activeStep === 1) {
      if (!formData.problemStatement)
        tempErrors.problemStatement = "Required";

      if (!formData.quantity)
        tempErrors.quantity = "Required";

      if (!formData.fourM)
        tempErrors.fourM = "Required";

      if (!formData.defect)
        tempErrors.defect = "Required";

      if (Object.keys(tempErrors).length > 0) {
        console.log(">>> Step 1 Errors:", tempErrors);
        setErrors(tempErrors);
        return;
      }
    }

    /* ================= STEP 2 ================= */
    if (activeStep === 2) {
      const newAttachmentErrors = {};
      console.log(">>> Checking Step 2 Attachments:", attachmentRows);

      attachmentRows.forEach((row) => {
        if (row.isMandatory) {
          // If mandatory, must have a new file OR an existing fileName from draft
          if (!row.file && !row.fileName)
            newAttachmentErrors[`file_${row.id}`] = "Required";

          if (!row.emails?.trim())
            newAttachmentErrors[`email_${row.id}`] = "Required";


          if (!row.expiryDate)
            newAttachmentErrors[`expiry_${row.id}`] =
              "Required";
        }
      });

      if (Object.keys(newAttachmentErrors).length > 0) {
        console.log(">>> Step 2 Errors:", newAttachmentErrors);
        setErrors(newAttachmentErrors);
        return;
      }
    }

    console.log(">>> No errors found, moving to next step");
    setErrors({});
    setMessage("");
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const buildComplaintFormData = (status) => {

    const fd = new FormData();

    fd.append("ComplaintId", formData.complaintId || "");
    fd.append("ComplaintNo", formData.complaintNo || "");
    fd.append("CustomerId", formData.customerSelected || "");
    fd.append("CustomerEmail", formData.customerEmail || "");
    fd.append("ComplaintDate", formData.complaintDate || "");
    fd.append("Model", activeModels.find(m => m.ModelId === formData.modelSelected)?.ModelName || formData.modelSelected || "");
    fd.append("Part", activeParts.find(p => p.PartId === formData.partSelected)?.PartNumber || formData.partSelected || "");
    fd.append("ProblemStatement", formData.problemStatement || "");
    fd.append("CauseCode", formData.quantity || "");
    fd.append("IsRegistred", String(formData.IsRegistered ?? true));
    fd.append("Quantity", formData.quantity || "");
    fd.append("Severity", formData.severityLevel || "");
    fd.append("FourM", formData.fourM || "");
    fd.append("Defect", formData.defect || "");
    fd.append("Status", status);

    const checklist = [];
    const attachmentErrors = {};

    attachmentRows.forEach((row) => {

      const originalRow = originalChecklist.find(o => o.id === row.id) || {
        checked: row.isMandatory,
        emails: "",
        expiryDate: ""
      };

      const hasChanged =
        originalRow.checked !== row.checked ||
        (originalRow.emails || "").trim() !== (row.emails || "").trim() ||
        (originalRow.expiryDate || "") !== (row.expiryDate || "") ||
        !!row.file;

      // 🚀 skip unchanged rows
      if (!hasChanged) return;

      const hasEmail = !!row.emails?.trim();
      const hasExpiryDate = !!row.expiryDate;

      if (row.checked) {
        if (!hasEmail) attachmentErrors[`email_${row.id}`] = "Required";
        if (!hasExpiryDate) attachmentErrors[`expiry_${row.id}`] = "Required";
      }

      if (hasEmail) {
        const emailError = validateEmails(row.emails);
        if (emailError) attachmentErrors[`email_${row.id}`] = emailError;
      }

      const formattedDate = row.expiryDate
        ? row.expiryDate.split("-").reverse().join("-")
        : "";

      checklist.push({
        CheckListId: row.id,
        Name: row.listName,
        IsMandatory: row.isMandatory,
        IsChecked: !!row.checked,
        Duedate: formattedDate,
        OpenDate: row.openDate
          ? row.openDate.split("-").reverse().join("-")
          : "",
        NotificationEmails: (row.emails || "")
          .split(/[,\n]/)
          .map(e => e.trim())
          .filter(e => e !== "")
          .join(",")
      });

      if (row.file) {
        fd.append(`file_${row.id}`, row.file);
      }

    });

    if (Object.keys(attachmentErrors).length > 0) {

      setErrors((prev) => ({
        ...Object.fromEntries(
          Object.entries(prev).filter(
            ([key]) =>
              !key.startsWith("file_") &&
              !key.startsWith("email_") &&
              !key.startsWith("expiry_") &&
              !key.startsWith("open_")
          )
        ),
        ...attachmentErrors
      }));

      setMessage("Please fill required attachment details");
      return null;
    }

    setErrors((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(
          ([key]) =>
            !key.startsWith("file_") &&
            !key.startsWith("email_") &&
            !key.startsWith("expiry_") &&
            !key.startsWith("open_")
        )
      )
    );

    // ✅ Send checklist only if updated
    if (checklist.length > 0) {
      fd.append("checklist", JSON.stringify(checklist));
    }

    return fd;
  };

  const resetForm = () => {
    setFormData({ ...INITIAL_FORM_STATE });
    setOriginalChecklist([]);

    // ✅ Reset attachments properly
    setAttachmentRows(
      attachmentList.map(item => ({
        ...item,
        checked: item.isMandatory,
        emails: "",
        file: null,
        expiryDate: ""
      }))
    );

    setActiveStep(0);
    setActiveDraftId(null);
    setMessage("");
    setErrors({});
  };

  const validateStep0 = () => {
    let tempErrors = {};

    if (!formData.complaintDate)
      tempErrors.complaintDate = "Required";

    if (!formData.customerSelected)
      tempErrors.customerSelected = "Required";



    setErrors(tempErrors);

    return Object.keys(tempErrors).length === 0;
  };

  const handleSaveDraft = async () => {
    const isValid = validateStep0();

    if (!isValid) {
      return;
    }

    try {
      setDraftLoading(true);
      const fd = buildComplaintFormData("DRAFT");
      if (!fd) return;

      console.log("------ FormData Start ------");

      for (const [key, value] of fd.entries()) {

        if (value instanceof File) {
          console.log(`${key}:`, {
            fileName: value.name,
            fileSize: value.size,
            fileType: value.type
          });
        } else {
          console.log(`${key}:`, value);
        }
      }

      console.log("------ FormData End ------");
      await submitCustomerComplaint(fd);

      if (formData.complaintId) {
        setMessage("✓ Draft updated successfully");
      } else {
        setMessage("✓ Draft saved successfully");
      }

      resetForm();
      await fetchComplaints();

      if (!formData.complaintId) {
        resetForm();
      }

    } catch (err) {
      console.error("Draft failed", err.response?.data || err);
    } finally {
      setDraftLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitLoading(true);
      const fd = buildComplaintFormData("SUBMITTED");
      if (!fd) return;

      console.log("------ FormData Start ------");

      for (const [key, value] of fd.entries()) {

        if (value instanceof File) {
          console.log(`${key}:`, {
            fileName: value.name,
            fileSize: value.size,
            fileType: value.type
          });
        } else {
          console.log(`${key}:`, value);
        }

      }

      console.log("------ FormData End ------");
      await submitCustomerComplaint(fd);
      setMessage("✓ Complaint submitted successfully!");
      await fetchComplaints();
      setSubmitLoading(false)
      resetForm();
      setActiveStep(0);
    } catch (err) {
      console.error("Submit failed", err.response?.data || err);
      setMessage("Complaint submit failed");
    }
  };

  const handleCheckboxChange = (id) => {
    setAttachmentRows(prev =>
      prev.map(row =>
        row.id === id
          ? { ...row, checked: !row.checked }
          : row
      )
    );
  };

  const handleFileChange = (id, file) => {
    setAttachmentRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, file, checked: file ? true : row.checked } : row
      )
    );

    // ✅ REMOVE FILE ERROR
    if (file) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`file_${id}`];
        return newErrors;
      });
    }

    // optional message clear
    setTimeout(() => {
      if (isStep2Valid()) {
        setMessage("");
      }
    }, 0);
  };

  const handleViewFile = async (row) => {
    if (row.file) {
      const fileUrl = URL.createObjectURL(row.file);
      window.open(fileUrl, "_blank");
    } else if (row.attachmentId) {
      try {
        const blob = await downloadAttachment(row.attachmentId);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", row.fileName || "attachment");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Error downloading file:", err);
      }
    } else if (row.fileName) {
      const base = process.env.REACT_APP_API_BASE_URL || "";
      const separator = base.endsWith("/") ? "" : "/";
      const fileUrl = `${base}${separator}uploads/${row.fileName}`;
      window.open(fileUrl, "_blank");
    }
  };

  const handleCopyEmails = (emails) => {
    if (emails) {
      const copyText = emails.replace(/\n/g, ", ");
      navigator.clipboard.writeText(copyText);
      setMessage("✓ Emails copied to clipboard");
    }
  };

  const handleDateChange = (id, date) => {
    setAttachmentRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, expiryDate: date } : row
      )
    );

    // ✅ REMOVE DATE ERROR
    if (date) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`expiry_${id}`];
        return newErrors;
      });
    }

    setTimeout(() => {
      if (isStep2Valid()) {
        setMessage("");
      }
    }, 0);
  };

  const handleOpenDateChange = (id, date) => {
    setAttachmentRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, openDate: date } : row
      )
    );

    if (date) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`open_${id}`];
        return newErrors;
      });
    }
  };

  const handleEmailChange = (id, value) => {
    // Replace commas with newlines to show one email per line
    const formattedValue = value.replace(/,/g, "\n");

    setAttachmentRows(prev =>
      prev.map(row =>
        row.id === id ? { ...row, emails: formattedValue } : row
      )
    );
    const errorMessage = validateEmails(formattedValue);

    setErrors(prev => ({
      ...prev,
      [`email_${id}`]: errorMessage,
    }));
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2, color: "#3b3b3b" }}>
        Customer Complaint Entry
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={(activeStep === 2 || activeStep === 3) ? 10 : 8}>
          <Card>
            <CardContent>

              <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {message && (
                <Alert
                  severity={message.includes("✓") ? "success" : "error"}
                  sx={{ mb: 2 }}
                >
                  {message}
                </Alert>
              )}

              {/* Tab 1: Complaint Header */}
              {activeStep === 0 && (
                <Grid container spacing={0.5}>

                  {/* Complaint Number */}
                  <Grid item xs={12}>
                    <TextField
                      label="Complaint Number"
                      fullWidth
                      name="complaintNo"
                      value={formData.complaintNo || ""}
                      onChange={handleInputChange}
                      required
                      error={!!errors.complaintNo}
                      helperText={errors.complaintNo || " "}
                    />
                  </Grid>


                  {/* Customer */}
                  <Grid item xs={12} sx>
                    <FormControl fullWidth error={!!errors.customerSelected}>


                      <InputLabel>Select Customer</InputLabel>
                      <Select
                        name="customerSelected"
                        value={formData.customerSelected || ""}
                        label="Select Customer"
                        onChange={handleSelectChange}
                      >
                        {activeCustomers.map((c) => (
                          <MenuItem key={c.CustomerId} value={c.CustomerId}>
                            {c.CustomerName}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {errors.customerSelected || " "}
                      </FormHelperText>
                    </FormControl>
                  </Grid>

                  {/* Customer Email */}
                  <Grid item xs={12}>
                    <TextField
                      label="Internal Staff Email"
                      fullWidth
                      name="customerEmail"
                      value={formData.customerEmail || ""}
                      onChange={handleInputChange}
                      error={!!errors.customerEmail}
                      helperText={errors.customerEmail || " "}
                    />
                  </Grid>

                  <Grid item xs={12} mb={3}>
                    <Box
                      sx={{
                        border: "1px solid #c4c4c4",
                        borderRadius: 1,
                        px: 2,
                        py: 1,
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        gap: 2
                      }}
                    >
                      {/* Floating Label */}
                      <Typography
                        sx={{
                          position: "absolute",
                          top: -9,
                          left: 12,
                          fontSize: 12,
                          background: "#fff",
                          px: 0.5,
                          color: "#1976d2",
                          fontWeight: 500
                        }}
                      >
                        Customer Type
                      </Typography>

                      <RadioGroup
                        row
                        name="IsRegistered"
                        value={String(formData.IsRegistered ?? "true")}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            IsRegistered: e.target.value === "true"
                          })
                        }
                      >
                        <FormControlLabel
                          value="true"
                          control={<Radio size="small" />}
                          label="Registered"
                        />

                        <FormControlLabel
                          value="false"
                          control={<Radio size="small" />}
                          label="Unregistered"
                        />
                      </RadioGroup>
                    </Box>
                  </Grid>

                  {/* Complaint Date */}
                  <Grid item xs={12}>
                    <TextField
                      label="Complaint Date"
                      type="date"
                      fullWidth
                      name="complaintDate"
                      value={formData.complaintDate || ""}
                      onChange={handleInputChange}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ max: today }}
                      error={!!errors.complaintDate}
                      helperText={errors.complaintDate || " "}
                    />
                  </Grid>

                  {/* Model */}
                  <Grid item xs={12}>
                    <FormControl fullWidth error={!!errors.modelSelected}>
                      <InputLabel>Model</InputLabel>
                      <Select
                        name="modelSelected"
                        value={formData.modelSelected || ""}
                        label="Model"
                        onChange={handleSelectChange}
                        onClose={() => setModelSearch("")}
                        renderValue={(selected) => {
                          const m = activeModels.find(x => x.ModelId === selected);
                          return m ? m.ModelName : (selected || "");
                        }}
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
                        {activeModels
                          .filter((m) =>
                            m.ModelName.toLowerCase().includes(modelSearch.toLowerCase())
                          )
                          .map((m) => (
                            <MenuItem key={m.ModelId} value={m.ModelId}>
                              {m.ModelName}
                            </MenuItem>
                          ))
                        }
                      </Select>
                      <FormHelperText>
                        {errors.modelSelected || " "}
                      </FormHelperText>
                    </FormControl>
                  </Grid>

                  {/* Part */}
                  <Grid item xs={12} >
                    <FormControl fullWidth error={!!errors.partSelected}>
                      <InputLabel>Part</InputLabel>
                      <Select
                        name="partSelected"
                        value={formData.partSelected || ""}
                        label="Part"
                        onChange={handleSelectChange}
                        onClose={() => setPartSearch("")}
                        renderValue={(selected) => {
                          const p = activeParts.find(x => x.PartId === selected);
                          return p ? p.PartNumber : (selected || "");
                        }}
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
                        {activeParts
                          .filter((p) =>
                            p.PartNumber.toLowerCase().includes(partSearch.toLowerCase())
                          )
                          .map((p) => (
                            <MenuItem key={p.PartId} value={p.PartId}>
                              {p.PartNumber}
                            </MenuItem>
                          ))
                        }
                      </Select>
                      <FormHelperText>
                        {errors.partSelected || " "}
                      </FormHelperText>
                    </FormControl>
                  </Grid>

                </Grid>
              )}

              {/* Tab 2: Problem & Cause */}
              {activeStep === 1 && (
                <Box sx={{ gap: 2, display: "flex", flexDirection: "column" }}>
                  <TextField
                    label="Problem Statement"
                    fullWidth
                    multiline
                    rows={4}
                    name="problemStatement"
                    value={formData.problemStatement}
                    onChange={handleInputChange}
                    required
                    error={!!errors.problemStatement}
                    helperText={errors.problemStatement}
                  />

                  <TextField
                    label="Quantity"
                    fullWidth
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    error={!!errors.quantity}
                    helperText={errors.quantity}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />

                  <FormControl fullWidth error={!!errors.fourM} required>
                    <InputLabel>4M</InputLabel>
                    <Select
                      name="fourM"
                      value={formData.fourM || ""}
                      onChange={handleSelectChange}
                      label="4M"
                    >
                      {["Man", "Machine", "Material", "Method", "Others"].map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.fourM && <FormHelperText>{errors.fourM}</FormHelperText>}
                  </FormControl>

                  <FormControl fullWidth error={!!errors.defect} required>
                    <InputLabel>Defect</InputLabel>
                    <Select
                      name="defect"
                      value={formData.defect || ""}
                      onChange={handleSelectChange}
                      label="Defect"
                    >
                      {displayDefects.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.defect && <FormHelperText>{errors.defect}</FormHelperText>}
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Severity Level</InputLabel>
                    <Select
                      name="severityLevel"
                      value={formData.severityLevel}
                      onChange={handleSelectChange}
                      label="Severity Level"
                    >
                      {SEVERITY_LEVELS.map((level) => (
                        <MenuItem key={level} value={level}>
                          {level}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Tab 3: Attachments */}
              {activeStep === 2 && (
                <Box>
                  <Typography variant="h6" mb={2}>
                    Upload Required Documents
                  </Typography>

                  <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: "hidden", }}>
                    <Table
                      size="small"
                      sx={{
                        tableLayout: "fixed",
                        width: "100%",
                        "& .MuiTableCell-root": {
                          verticalAlign: "middle",
                          py: 1.5,   // controls row height cleanly
                        },
                      }}
                    >
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                          <TableCell width={60}></TableCell>
                          <TableCell><strong>Document</strong></TableCell>
                          <TableCell><strong>Upload</strong></TableCell>
                          <TableCell><strong>Email  </strong></TableCell>
                          {/* <TableCell><strong>Open Date</strong></TableCell> */}
                          <TableCell><strong>Last Date</strong></TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {attachmentRows.map((row) => (
                          <TableRow key={row.id} hover>

                            {/* Checkbox */}
                            <TableCell width="5%">
                              <Checkbox
                                checked={row.checked}
                                disabled={row.isMandatory}
                                onChange={() => handleCheckboxChange(row.id)}
                              />
                            </TableCell>

                            {/* Document Name */}
                            <TableCell width="20%">
                              <Typography fontWeight={500}>
                                {row.listName}
                                {row.isMandatory && (
                                  <span style={{ color: "red" }}> *</span>
                                )}
                              </Typography>
                            </TableCell>

                            {/* Upload */}
                            <TableCell
                              width="25%"
                              sx={{ verticalAlign: "middle" }}
                            >
                              <Box display="flex" alignItems="center" gap={1}>
                                <Button
                                  component="label"
                                  variant="outlined"
                                  startIcon={<CloudUploadIcon />}
                                  fullWidth
                                  sx={{
                                    justifyContent: "flex-start",
                                    textTransform: "none",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      width: "100%",
                                      textAlign: "left",
                                    }}
                                  >
                                    {row.file ? row.file.name : row.fileName || "Upload File"}
                                  </Box>

                                  <input
                                    type="file"
                                    hidden
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) =>
                                      handleFileChange(row.id, e.target.files[0])
                                    }
                                  />
                                </Button>

                                {(row.file || row.fileName) && (
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleViewFile(row)}
                                    title="Download File"
                                  >
                                    <DownloadIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                            </TableCell>

                            {/* Email Input */}
                            <TableCell width="25%">
                              <Box display="flex" alignItems="center">
                                <TextField
                                  fullWidth
                                  size="small"
                                  multiline
                                  minRows={1}
                                  placeholder={"user1@iljin.com\nuser2@iljin.com"}
                                  value={row.emails || ""}
                                  onChange={(e) =>
                                    handleEmailChange(row.id, e.target.value)
                                  }
                                  error={!!errors[`email_${row.id}`]}
                                  helperText={errors[`email_${row.id}`]}
                                  InputProps={{
                                    endAdornment: row.emails?.trim() && (
                                      <IconButton
                                        size="small"
                                        onClick={() => handleCopyEmails(row.emails)}
                                        title="Copy Emails"
                                        sx={{ alignSelf: "flex-start", mt: 0.5 }}
                                      >
                                        <ContentCopyIcon fontSize="small" />
                                      </IconButton>
                                    ),
                                  }}
                                />
                              </Box>
                            </TableCell>


                            {/* Open Date */}
                            {/* <TableCell
                              width="25%"
                              sx={{ verticalAlign: "middle" }}
                            >
                              <Box display="flex" alignItems="center">
                                <TextField
                                  type="date"
                                  fullWidth
                                  size="small"
                                  value={row.openDate || ""}
                                  InputLabelProps={{ shrink: true }}
                                  onChange={(e) =>
                                    handleOpenDateChange(row.id, e.target.value)
                                  }
                                  error={!!errors[`open_${row.id}`]}
                                  helperText={errors[`open_${row.id}`]}
                                  sx={{
                                    "& .MuiInputBase-root": {
                                      height: 38,
                                    },
                                  }}
                                />
                              </Box>
                            </TableCell> */}

                            {/* Expiry Date */}
                            <TableCell
                              width="25%"
                              sx={{ verticalAlign: "middle" }}
                            >
                              <Box display="flex" alignItems="center">
                                <TextField
                                  type="date"
                                  fullWidth
                                  size="small"
                                  value={row.expiryDate || ""}
                                  InputLabelProps={{ shrink: true }}
                                  onChange={(e) =>
                                    handleDateChange(row.id, e.target.value)
                                  }
                                  error={!!errors[`expiry_${row.id}`]}
                                  helperText={errors[`expiry_${row.id}`]}
                                  sx={{
                                    "& .MuiInputBase-root": {
                                      height: 38,   // keeps height consistent
                                    },
                                  }}
                                />
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Tab 4: Review & Submit */}
              {activeStep === 3 && (
                <Box sx={{ gap: 2, display: "flex", flexDirection: "column" }}>
                  <Typography variant="h6">Review Complaint Summary</Typography>
                  <Paper sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
                    <Box
                      sx={{ gap: 1, display: "flex", flexDirection: "column" }}
                    >
                      <Typography>
                        <strong>Complaint Number:</strong> {formData.complaintNo || "-"}
                      </Typography>
                      <Typography>
                        <strong>Customer:</strong>{" "}
                        {
                          activeCustomers.find(
                            (c) => c.CustomerId === formData.customerSelected
                          )?.CustomerName || "-"
                        }                      </Typography>
                      <Typography>
                        <strong>Email:</strong> {formData.customerEmail}
                      </Typography>
                      <Typography>
                        <strong>Date:</strong> {formData.complaintDate}
                      </Typography>
                      <Typography>
                        <strong>Model:</strong>{" "}
                        {(() => {
                          const m = activeModels.find(x => x.ModelId === formData.modelSelected);
                          return m ? `${m.ModelCode} - ${m.ModelName}` : (formData.modelSelected || "-");
                        })()}
                      </Typography>
                      <Typography>
                        <strong>Part:</strong>{" "}
                        {(() => {
                          const p = activeParts.find(x => x.PartId === formData.partSelected);
                          return p ? p.PartNumber : (formData.partSelected || "-");
                        })()}
                      </Typography>
                      <Typography><strong>Problem Statement:</strong> {formData.problemStatement}</Typography>
                      <Typography><strong>Quantity:</strong> {formData.quantity}</Typography>
                      <Typography><strong>4M:</strong> {formData.fourM || "-"}</Typography>
                      <Typography><strong>Defect:</strong> {formData.defect || "-"}</Typography>
                      <Typography><strong>Severity:</strong> {formData.severityLevel}</Typography>

                      <Box mt={2}>
                        <Typography variant="subtitle1" fontWeight={600} mb={1}>
                          Attachments
                        </Typography>

                        {attachmentRows.filter(r => r.checked).length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No attachments added
                          </Typography>
                        ) : (
                          <TableContainer
                            component={Paper}
                            sx={{ borderRadius: 2 }}
                          >
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                  <TableCell><strong>Document</strong></TableCell>
                                  <TableCell><strong>File Name</strong></TableCell>
                                  <TableCell><strong>Email</strong></TableCell>
                                  {/* <TableCell><strong>Open Date</strong></TableCell> */}
                                  <TableCell><strong>Last Date</strong></TableCell>
                                </TableRow>
                              </TableHead>

                              <TableBody>
                                {attachmentRows
                                  .filter(row => row.checked)
                                  .map((row) => (
                                    <TableRow key={row.id} hover>
                                      <TableCell>{row.listName}</TableCell>

                                      <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                          {row.file ? row.file.name : row.fileName || "Not Uploaded"}
                                          {(row.file || row.fileName) && (
                                            <IconButton
                                              size="small"
                                              color="primary"
                                              onClick={() => handleViewFile(row)}
                                              title="View File"
                                            >
                                              <DownloadIcon fontSize="small" />
                                            </IconButton>
                                          )}
                                        </Box>
                                      </TableCell>

                                      <TableCell sx={{ whiteSpace: "pre-line" }}>
                                        <Box display="flex" alignItems="flex-start" gap={1}>
                                          <Box sx={{ flexGrow: 1 }}>
                                            {row.emails || "-"}
                                          </Box>
                                          {row.emails?.trim() && (
                                            <IconButton
                                              size="small"
                                              onClick={() => handleCopyEmails(row.emails)}
                                              title="Copy Emails"
                                            >
                                              <ContentCopyIcon fontSize="small" />
                                            </IconButton>
                                          )}
                                        </Box>
                                      </TableCell>

                                      <TableCell>
                                        {row.expiryDate || "-"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              )}


              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}
              >
                <Button disabled={activeStep === 0} onClick={handleBack}>
                  Back
                </Button>

                <Box sx={{ gap: 1, display: "flex" }}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<ClearIcon />}
                    onClick={resetForm}
                  >
                    Reset
                  </Button>

                  {/* Save Draft */}
                  <Button
                    variant="outlined"
                    startIcon={
                      draftLoading ? (
                        <CircularProgress size={18} />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    onClick={handleSaveDraft}
                    disabled={draftLoading}
                  >
                    {draftLoading ? "Saving..." : "Save Draft"}
                  </Button>

                  {/* Next / Submit */}
                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleSubmit}
                      disabled={submitLoading}
                      startIcon={
                        submitLoading ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : null
                      }
                    >
                      {submitLoading ? "Submitting..." : "Submit Complaint"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="contained"
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={(activeStep === 2 || activeStep === 3) ? 2 : 4}>

          {/* DRAFTS */}
          <Accordion
            expanded={expandedPanel === "drafts"}
            onChange={handleAccordionChange("drafts")}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600} fontSize={14}>
                Drafts ({drafts.length})
              </Typography>
            </AccordionSummary>

            <AccordionDetails
              sx={{
                maxHeight: 360,
                overflowY: "auto",
                pr: 1,
              }}
            >
              {drafts.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  No drafts available
                </Typography>
              ) : (
                drafts.map((draft) => (
                  <Paper
                    key={draft.ComplaintId}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      borderRadius: 2,
                      border: "1px solid #e5e7eb",
                      cursor: "pointer",
                      transition: "0.2s",
                      "&:hover": {
                        backgroundColor: "#f9fafb",
                        borderColor: "#2563eb",
                      },
                    }}
                    onClick={() => handleDraftClick(draft)}
                  >
                    <Typography fontWeight={600} fontSize={13}>
                      {draft.ComplaintNo || "Untitled Draft"}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {draft.Model || "—"} • {draft.Part || "—"}
                    </Typography>

                    <Chip label="Draft" size="small" sx={{ marginLeft: 2 }} />
                  </Paper>
                ))
              )}
            </AccordionDetails>
          </Accordion>


          {/* SUBMITTED */}
          <Accordion
            sx={{ mt: 2 }}
            expanded={expandedPanel === "submitted"}
            onChange={handleAccordionChange("submitted")}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600} fontSize={14}>
                Submitted ({submitted.length})
              </Typography>
            </AccordionSummary>

            <AccordionDetails
              sx={{
                maxHeight: 360,
                overflowY: "auto",
                pr: 1,
              }}
            >
              {submitted.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  No submitted complaints
                </Typography>
              ) : (
                submitted.map((complaint) => (
                  <Paper
                    key={complaint.ComplaintId}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      borderRadius: 2,
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#f0fdf4",
                    }}
                  >
                    <Typography fontWeight={600} fontSize={13}>
                      {complaint.ComplaintNo}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      Submitted •{" "}
                      {new Date(complaint.ComplaintDate).toLocaleDateString()}
                    </Typography>

                    <Chip
                      label="Submitted"
                      color="success"
                      size="small"
                      sx={{ marginLeft: 2 }}
                    />
                  </Paper>
                ))
              )}
            </AccordionDetails>
          </Accordion>

        </Grid>

      </Grid>
    </Box>
  );
};

export default ComplaintForm;
