import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
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
  AccordionDetails, Checkbox
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SaveIcon from "@mui/icons-material/Save";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import { useSelector } from "react-redux";
import CircularProgress from "@mui/material/CircularProgress";
import { submitCustomerComplaint, getCustomerComplaints } from "../api/pageApi";




const ComplaintForm = () => {
  const { parts, models, repairCauses, customers } = useSelector((state) => state.masters);
  const activeCustomers = customers.filter((p) => p.IsActive === true);
  const activeParts = parts.filter((p) => p.IsActive === true);
  const activeModels = models.filter((m) => m.IsActive === true);
  const activeRepairCauses = repairCauses.filter((c) => c.IsActive === true);
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [customerSelected, setCustomerSelected] = useState("");
  const [customerColumns, setCustomerColumns] = useState([]);
  const [mappings, setMappings] = useState({});
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
  
  const sampleAttachmentList = [
    { id: 1, listName: "Counter Measure", isMandatory: true },
    { id: 2, listName: "PAN Copy", isMandatory: true },
    { id: 3, listName: "Address Proof", isMandatory: false },
    { id: 4, listName: "Invoice Copy", isMandatory: false },
    { id: 5, listName: "Photograph", isMandatory: true }
  ];
  const [attachmentRows, setAttachmentRows] = useState(
    sampleAttachmentList.map(item => ({
      ...item,
      checked: item.isMandatory,
      file: null,
      expiryDate: ""
    }))
  );
  const INITIAL_FORM_STATE = {
    complaintId: "",
    customerSelected: "",
    customerEmail: "",
    complaintDate: "",
    modelSelected: "",
    partSelected: "",
    problemStatement: "",
    causeCode: "",
    severityLevel: SEVERITY_LEVELS[0], // default back to Low
    attachments: [],
    status: "",
  };
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : null);
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const data = await getCustomerComplaints(); // 👈 data is already array

      console.log("Fetched complaints:", data);

      const safeData = Array.isArray(data) ? data : [];

      const normalizeStatus = (status) =>
        status?.toString().trim().toUpperCase();

      setComplaints(safeData);
      setDrafts(safeData.filter((i) => normalizeStatus(i.Status) === "DRAFT"));
      setSubmitted(
        safeData.filter((i) => normalizeStatus(i.Status) === "SUBMITTED"),
      );
    } catch (err) {
      console.error(err);
      setComplaints([]);
      setDrafts([]);
      setSubmitted([]);
    }
  };

  const handleDraftClick = (draft) => {
    console.log("Draft clicked:", draft);

    setActiveDraftId(draft.ComplaintId);

    setFormData({
      complaintId: draft.ComplaintId || "",

      customerSelected: draft.CustomerId || "",   // ✅ IMPORTANT
      customerEmail: draft.CustomerEmail || "",

      complaintDate:
        draft.ComplaintDate?.split("T")[0] || "",

      modelSelected: draft.Model || "",           // ✅ must match Select value
      partSelected: draft.Part || "",             // ✅ must match Select value

      problemStatement: draft.ProblemStatement || "",
      causeCode: draft.CauseCode || "",

      severityLevel: draft.Severity || SEVERITY_LEVELS[0],

      attachments: [],
      status: draft.Status || "DRAFT",
    });

    setActiveStep(0);
    setExpandedPanel("drafts");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const isStep2Valid = () => {
    return !attachmentRows.some(
      (row) =>
        row.isMandatory &&
        (!row.file || !row.expiryDate)
    );
  };

  const handleNext = () => {

    /* ================= STEP 0 ================= */
    if (activeStep === 0) {
      if (
        !formData.customerSelected ||
        !formData.customerEmail ||
        !formData.complaintDate ||
        !formData.modelSelected
      ) {
        setMessage("Please fill all required fields in Complaint Header");
        return;
      }
    }

    /* ================= STEP 1 ================= */
    if (activeStep === 1) {
      if (!formData.problemStatement || !formData.causeCode) {
        setMessage("Please fill Problem Statement and Cause Code");
        return;
      }
    }

    /* ================= STEP 2 ================= */
    if (activeStep === 2) {
      const invalidRow = attachmentRows.find(
        (row) =>
          row.isMandatory &&
          (!row.file || !row.expiryDate)
      );

      if (invalidRow) {
        setMessage(
          `Please upload file and select expiry date for "${invalidRow.listName}"`
        );
        return;
      }
    }

    setMessage("");
    setActiveStep((prev) => prev + 1);
  };



  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const buildComplaintFormData = (status) => {
    const fd = new FormData();

    // ✅ IMPORTANT: send complaintId if editing
    if (formData.complaintId) {
      fd.append("complaintId", formData.complaintId);
    }

    fd.append("status", status);
    fd.append("customerId", String(formData.customerSelected));
    fd.append("customerEmail", formData.customerEmail);
    fd.append("complaintDate", formData.complaintDate);
    fd.append("model", formData.modelSelected);
    fd.append("part", formData.partSelected);
    fd.append("problemStatement", formData.problemStatement);
    fd.append("causeCode", formData.causeCode);
    fd.append("severity", formData.severityLevel);

    formData.attachments.forEach((file) => {
      fd.append("files", file);
    });

    return fd;
  };

  const resetForm = () => {
    setFormData({ ...INITIAL_FORM_STATE }); // safe copy
    setActiveStep(0);
    setActiveDraftId(null);
    setMessage("");
  };

  const handleSaveDraft = async () => {
    try {
      setDraftLoading(true);
      const fd = buildComplaintFormData("DRAFT");

      await submitCustomerComplaint(fd);

      if (formData.complaintId) {
        setMessage("✓ Draft updated successfully");
      } else {
        setMessage("✓ Draft saved successfully");
      }

      await fetchComplaints();
      setDraftLoading(false)
      if (!formData.complaintId) {
        resetForm();
      }

    } catch (err) {
      console.error("Draft failed", err.response?.data || err);
      setMessage("Draft save failed");
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitLoading(true);
      const fd = buildComplaintFormData("SUBMITTED");
      await submitCustomerComplaint(fd);
      setMessage("✓ Complaint submitted successfully!");
      await fetchComplaints();
      setSubmitLoading(false)
      resetForm();
      setActiveStep(0);
    } catch (err) {
      console.error("Submit failed", err.response?.data || err);
      setMessage("❌ Complaint submit failed");
    }
  };

  const handleCustomerSelect = (customerId) => {
    setCustomerSelected(customerId);
    setCustomerColumns([]);
    setMappings({});
    // showPopup(`Selected customer ${customerId}. Upload Excel to continue.`);
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
    setAttachmentRows(prev =>
      prev.map(row =>
        row.id === id
          ? { ...row, file }
          : row
      )
    );

    // 🔥 Clear message only if valid now
    setTimeout(() => {
      if (isStep2Valid()) {
        setMessage("");
      }
    }, 0);
  };


  const handleDateChange = (id, date) => {
    setAttachmentRows(prev =>
      prev.map(row =>
        row.id === id
          ? { ...row, expiryDate: date }
          : row
      )
    );

    setTimeout(() => {
      if (isStep2Valid()) {
        setMessage("");
      }
    }, 0);
  };


  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        Customer Complaint Entry
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
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
                <Box sx={{ gap: 2, display: "flex", flexDirection: "column" }}>
                  <FormControl fullWidth>
                    <InputLabel>Select Customer</InputLabel>
                    <Select
                      name="customerSelected"
                      value={formData.customerSelected}
                      label="Select Customer"
                      onChange={handleSelectChange}
                    >

                      {activeCustomers.map((c) => (
                        <MenuItem key={c.CustomerId} value={c.CustomerId}>
                          {c.CustomerName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="Customer Email"
                    fullWidth
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    placeholder="example1@mail.com, example2@mail.com"
                  // helperText="Enter multiple emails separated by comma"
                  />


                  <TextField
                    label="Complaint Date"
                    type="date"
                    fullWidth
                    name="complaintDate"
                    value={formData.complaintDate}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    inputProps={{
                      max: new Date().toISOString().split("T")[0],
                    }}
                  />

                  <FormControl fullWidth required>
                    <InputLabel shrink>Model</InputLabel>
                    <Select
                      name="modelSelected"
                      value={formData.modelSelected}
                      onChange={handleSelectChange}
                      displayEmpty
                      label="Model"
                    >


                      {activeModels.map((m) => (
                        <MenuItem key={m.ModelId} value={m.ModelCode}>
                          {m.ModelCode}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>


                  <FormControl fullWidth>
                    <InputLabel shrink>Part</InputLabel>
                    <Select
                      name="partSelected"
                      value={formData.partSelected}
                      onChange={handleSelectChange}
                      displayEmpty
                      label="Part"
                    >


                      {activeParts.map((p) => (
                        <MenuItem key={p.PartId} value={p.PartNumber}>
                          {p.PartName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>



                </Box>
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
                  />
                  <FormControl fullWidth required>
                    <InputLabel shrink>Cause Code</InputLabel>
                    <Select
                      name="causeCode"
                      value={formData.causeCode}
                      onChange={handleSelectChange}
                      displayEmpty
                      label="Cause Code"
                    >


                      {activeRepairCauses.map((c) => (
                        <MenuItem key={c.RepairCauseCodeId} value={c.Code}>
                          {c.Code} - {c.CodeDescription}
                        </MenuItem>
                      ))}
                    </Select>
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
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Typography variant="h6">
                    Upload Required Documents
                  </Typography>

                  {attachmentRows.map((row) => (
                    <Grid
                      container
                      spacing={2}
                      alignItems="center"
                      key={row.id}
                    >
                      {/* Checkbox */}
                      <Grid item xs={1}>
                        <Checkbox
                          checked={row.checked}
                          disabled={row.isMandatory}
                          onChange={() => handleCheckboxChange(row.id)}
                        />
                      </Grid>

                      {/* List Name */}
                      <Grid item xs={3}>
                        <Typography>
                          {row.listName}
                          {row.isMandatory && (
                            <span style={{ color: "red" }}> *</span>
                          )}
                        </Typography>
                      </Grid>


                      <Grid item xs={4}>
                        <Button
                          component="label"

                          variant="outlined"
                          startIcon={<CloudUploadIcon />}
                          fullWidth
                        >
                          {row.file ? row.file.name : "Upload File"}
                          <input
                            type="file"
                            hidden
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                              handleFileChange(row.id, e.target.files[0])
                            }
                          />
                        </Button>
                      </Grid>

                      {/* Expiry Date */}
                      <Grid item xs={4}>
                        <TextField
                          type="date"
                          fullWidth
                          size="small"          // 👈 same size

                          value={row.expiryDate}
                          onChange={(e) =>
                            handleDateChange(row.id, e.target.value)
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    </Grid>
                  ))}
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
                        <strong>Customer:</strong> {formData.customerName}
                      </Typography>
                      <Typography>
                        <strong>Email:</strong> {formData.customerEmail}
                      </Typography>
                      <Typography>
                        <strong>Date:</strong> {formData.complaintDate}
                      </Typography>
                      <Typography>
                        <strong>Model:</strong> {formData.modelSelected}
                      </Typography>
                      <Typography>
                        <strong>Part:</strong> {formData.partSelected}
                      </Typography>
                      <Typography>
                        <strong>Problem:</strong> {formData.problemStatement}
                      </Typography>
                      <Typography>
                        <strong>Cause Code:</strong> {formData.causeCode}
                      </Typography>
                      <Typography>
                        <strong>Severity:</strong> {formData.severityLevel}
                      </Typography>
                      <Typography>
                        <strong>Attachments:</strong>{" "}
                        {formData.attachments.length} file(s)
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              )}

              {/* Navigation */}
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}
              >
                <Button disabled={activeStep === 0} onClick={handleBack}>
                  Back
                </Button>

                <Box sx={{ gap: 1, display: "flex" }}>
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

        {/* Sidebar */}
        <Grid item xs={12} md={4}>

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

                    <Chip label="Draft" size="small" sx={{ mt: 0.5 }} />
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
                      sx={{ mt: 0.5 }}
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
