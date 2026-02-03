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
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SaveIcon from "@mui/icons-material/Save";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import { useSelector } from "react-redux";
import { submitCustomerComplaint, getCustomerComplaints } from "../api/pageApi";

const ComplaintForm = () => {
  const { parts, models, repairCauses } = useSelector((state) => state.masters);
  const activeParts = parts.filter((p) => p.IsActive === true);
  const activeModels = models.filter((m) => m.IsActive === true);
  const activeRepairCauses = repairCauses.filter((c) => c.IsActive === true);

  console.log("Parts from store:", parts);
  console.log("Models from store:", models);
  console.log("Repair Causes from store:", repairCauses);
  const SEVERITY_LEVELS = ["Low", "Medium", "High", "Critical"];

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    complaintId: "",
    customerName: "",
    customerEmail: "",
    complaintDate: "",
    modelSelected: "",
    partSelected: "",
    problemStatement: "",
    causeCode: "",
    severityLevel: SEVERITY_LEVELS[0],
    attachments: [],
    status: "",
  });

  const [message, setMessage] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [submitted, setSubmitted] = useState([]);

  const steps = [
    "Complaint Header",
    "Problem & Cause",
    "Attachments",
    "Review & Submit",
  ];


  const handleAccordionChange = (panel) => (_, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
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
    setActiveDraftId(draft.ComplaintId);

    setFormData({
      complaintId: draft.ComplaintId || "",
      customerName: draft.CustomerName || "",
      customerEmail: draft.CustomerEmail || "",
      complaintDate: draft.ComplaintDate?.split("T")[0] || "",
      modelSelected: draft.Model || "",
      partSelected: draft.Part || "",
      problemStatement: draft.ProblemStatement || "",
      causeCode: draft.CauseCode || "",
      severityLevel: draft.Severity || "Medium",
      attachments: [],
      status: draft.Status || "DRAFT",
    });

    // Optional UX: jump user to first step
    setActiveStep(0);

    // Optional UX: auto-open draft accordion
    setExpanded("drafts");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (
        !formData.customerName ||
        !formData.complaintDate ||
        !formData.modelSelected
      ) {
        setMessage("Please fill all required fields in Complaint Header");
        return;
      }
    }
    if (activeStep === 1) {
      if (!formData.problemStatement || !formData.causeCode) {
        setMessage("Please fill Problem Statement and Cause Code");
        return;
      }
    }
    setActiveStep(activeStep + 1);
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const buildComplaintFormData = (status) => {
    const fd = new FormData();

    fd.append("status", status);
    fd.append("customerId", String(formData.customerId ?? "1"));
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

  const handleSaveDraft = async () => {
    try {
      const fd = buildComplaintFormData("DRAFT");
      for (const [k, v] of fd.entries()) {
        console.log("DRAFT →", k, v);
      }
      console.log("Saving draft with FormData:", fd);
      await submitCustomerComplaint(fd);
      setMessage("✓ Complaint draft saved");
    } catch (err) {
      console.error("Draft failed", err.response?.data || err);
      setMessage("❌ Draft save failed");
    }
  };

  const handleSubmit = async () => {
    try {
      const fd = buildComplaintFormData("SUBMITTED");

      for (const [k, v] of fd.entries()) {
        console.log("SUBMIT →", k, v);
      }

      console.log("Submitting complaint with FormData:", fd);

      await submitCustomerComplaint(fd);

      setMessage("✓ Complaint submitted successfully!");

      setFormData({
        complaintId: "",
        customerId: "",
        customerEmail: "",
        complaintDate: "",
        modelSelected: "",
        partSelected: "",
        problemStatement: "",
        causeCode: "",
        severityLevel: "",
        attachments: [],
        status: "",
      });

      setActiveStep(0);
    } catch (err) {
      console.error("Submit failed", err.response?.data || err);
      setMessage("❌ Complaint submit failed");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
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
                  <TextField
                    label="Customer Name"
                    fullWidth
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    required
                  />
                  <TextField
                    label="Customer Email"
                    fullWidth
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
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
                <Box sx={{ gap: 2, display: "flex", flexDirection: "column" }}>
                  <Typography variant="body1">
                    Upload Attachments (PDF, Images)
                  </Typography>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                  >
                    Select Files
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      hidden
                      onChange={handleFileUpload}
                    />
                  </Button>

                  {formData.attachments?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Attached Files:
                      </Typography>
                      {formData.attachments.map((file, idx) => (
                        <Chip
                          key={idx}
                          label={file.name}
                          variant="outlined"
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </Box>
                  )}
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
                    startIcon={<SaveAltIcon />}
                    onClick={handleSaveDraft}
                  >
                    Save Draft
                  </Button>

                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<SaveIcon />}
                      onClick={handleSubmit}
                    >
                      Submit Complaint
                    </Button>
                  ) : (
                    <Button variant="contained" onClick={handleNext}>
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
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>
                Drafts ({drafts.length})
              </Typography>
            </AccordionSummary>

            <AccordionDetails>
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
                      border: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: '0.2s',
                      '&:hover': {
                        backgroundColor: '#f9fafb',
                        borderColor: '#2563eb',
                      },
                    }}
                    onClick={() => handleDraftClick(draft)}
                  >
                    <Typography fontWeight={600} fontSize={13}>
                      {draft.ComplaintNo || 'Untitled Draft'}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {draft.Model || '—'} • {draft.Part || '—'}
                    </Typography>

                    <Chip
                      label="Draft"
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Paper>
                ))
              )}
            </AccordionDetails>
          </Accordion>

          {/* SUBMITTED */}
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>
                Submitted ({submitted.length})
              </Typography>
            </AccordionSummary>

            <AccordionDetails>
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
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#f0fdf4',
                    }}
                  >
                    <Typography fontWeight={600} fontSize={13}>
                      {complaint.ComplaintNo}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      Submitted • {new Date(complaint.ComplaintDate).toLocaleDateString()}
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
    </Container>
  );
};

export default ComplaintForm;
