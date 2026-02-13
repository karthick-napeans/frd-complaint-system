import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import { useSelector } from "react-redux";
import { saveDreDraft, saveDreWithFiles, getDreList } from "../api/pageApi"

const DREEntry = () => {
  const { parts, models, repairCauses } = useSelector((state) => state.masters);
  const activeParts = parts.filter((p) => p.IsActive === true);
  const activeModels = models.filter((m) => m.IsActive === true);
  const activeRepairCauses = repairCauses.filter((c) => c.IsActive === true);
  const [attachments, setAttachments] = useState([]);
  const [showHeaderError, setShowHeaderError] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [message, setMessage] = useState('');
  const [dreList, setDreList] = useState([]);
  const drafts = dreList.filter(d => d.Status === "DRAFT");
  const submitted = dreList.filter(d => d.Status === "OPEN");

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : null);
  };

  const loadDreList = async () => {
    try {
      const res = await getDreList();

      console.log("DRE List response:", res);

      // ✅ res itself is the array
      const list = Array.isArray(res) ? res : [];

      setDreList(list);
    } catch (err) {
      console.error("Failed to load DRE list", err);
      setDreList([]); // fail-safe
    }
  };

  useEffect(() => {
    loadDreList();
  }, []);

  const EMPTY_FORM = {
    dreId: '',
    dreNumber: '',
    dreEngineerName: '',
    date: '',
    model: '',
    part: '',
    problem: '',
    status: 'Draft',
  };

  const [formData, setFormData] = useState({
    dreId: '',
    dreNumber: '',          // ✅ DRE Number
    dreEngineerName: '',    // ✅ Engineer name
    date: '',
    model: '',
    part: '',
    problem: '',
    status: 'Draft',
  });

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setAttachments([]);
    setActiveStep(0);
    setShowHeaderError(false);
  };

  const buildDreFormData = (status, attachments = []) => {
    const fd = new FormData();

    fd.append("DreNumber", formData.dreNumber);            // ✅ correct
    fd.append("Date", formData.date);
    fd.append("Model", formData.model);
    fd.append("Part", formData.part);
    fd.append("ProblemDescription", formData.problem);
    fd.append("DreEngineerName", formData.dreEngineerName); // ✅ FIXED
    fd.append("Status", status);

    if (formData.dreId) {
      fd.append("DreId", formData.dreId);
    }

    attachments.forEach((file, index) => {
      fd.append(`file${index + 1}`, file);
    });

    return fd;
  };

  const handleDraftClick = (draft) => {
    setActiveDraftId(draft.DreId);

    setFormData({
      dreId: draft.DreId,
      dreNumber: draft.DreNumber,
      date: draft.DreDate?.split("T")[0], // 🔑 fix date
      model: draft.Model,
      part: draft.Part,
      problem: draft.ProblemDescription || '',
      dreEngineerName: draft.DreEngineerName || '',
      status: draft.Status,
    });

    setAttachments(
      draft.AttachmentNames
        ? draft.AttachmentNames.split(",").map(name => ({ name }))
        : []
    );

    setActiveStep(0);
  };

  const handleNext = () => {
    console.log("Clicked Next");
    console.log("Active Step:", activeStep);
    console.log("Form Data:", formData);

    if (activeStep === 0) {
      console.log(
        formData.dreNumber,
        formData.dreEngineerName,
        formData.date,
        formData.model,
        formData.part
      );
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSaveDraft = async () => {
    try {
      // 👇 build FormData with DRAFT status
      const fd = buildDreFormData("DRAFT", attachments);

      // optional debug
      for (const [k, v] of fd.entries()) {
        console.log("DRAFT FD →", k, v);
      }

      const res = await saveDreWithFiles(fd);

      // 👇 update local state with dreId + status
      setFormData((prev) => ({
        ...prev,
        dreId: res?.data?.dreId || prev.dreId,
        status: "DRAFT",
      }));

      setMessage("✓ DRE draft saved.");
      await loadDreList(); // refresh list to show new draft
      resetForm();
    } catch (err) {
      console.error("Draft save failed", err.response?.data || err);
      setMessage("❌ Failed to save draft");
    }
  };

  const handleSubmitDRE = async () => {
    try {
      const fd = buildDreFormData("OPEN", attachments);
      const res = await saveDreWithFiles(fd);

      setMessage("✓ DRE submitted successfully");

      // 🔄 Update local list
      setDreList(prev =>
        prev.map(d =>
          d.DreId === formData.dreId
            ? { ...d, Status: "OPEN" }
            : d
        )
      );
      await loadDreList();
      resetForm();
    } catch (err) {
      console.error(err);
      setMessage("❌ DRE submit failed");
    }
  };

  const steps = [
    'DRE Header',
    'Problem & Analysis',
    'Attachments',
    'Review & Submit',
  ];

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography fontSize={28} fontWeight={700} sx={{ mb: 3 }}>
        DRE Entry
      </Typography>

      <Grid container spacing={3}>
        {/* LEFT MAIN FORM */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              {/* STEPPER */}
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {activeStep === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="DRE Number *"
                      name="dreNumber"
                      fullWidth
                      value={formData.dreNumber}
                      onChange={handleChange}
                    />

                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="DRE Engineer Name *"
                      name="dreEngineerName"
                      fullWidth
                      value={formData.dreEngineerName}
                      onChange={handleChange}
                    />

                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      type="date"
                      label="DRE Date *"
                      name="date"
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      value={formData.date}
                      onChange={handleChange}
                      inputProps={{
                        max: new Date().toISOString().split('T')[0],
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel shrink>Model</InputLabel>
                      <Select
                        name="model"
                        value={formData.model}
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
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel shrink>Part</InputLabel>
                      <Select
                        name="part"
                        value={formData.part}
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
                  </Grid>
                </Grid>
              )}

              {activeStep === 1 && (
                <TextField
                  label="Problem Description *"
                  multiline
                  rows={6}
                  name="problem"
                  fullWidth
                  value={formData.problem}
                  onChange={handleChange}
                />
              )}

              {activeStep === 2 && (
                <Box>
                  {/* ERROR ALERT */}
                  {showHeaderError && (
                    <Paper
                      sx={{
                        mb: 2,
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor: '#fdecea',
                        color: '#b71c1c',
                        fontSize: 14,
                      }}
                    >
                      ❗ Please fill all required fields in Complaint Header
                    </Paper>
                  )}

                  <Typography fontWeight={600} sx={{ mb: 1 }}>
                    Upload Attachments (PDF, Images)
                  </Typography>

                  {/* UPLOAD BAR */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      borderColor: '#90caf9',
                      backgroundColor: '#e3f2fd',
                      textAlign: 'center',
                    }}
                  >
                    <Button
                      component="label"
                      startIcon={<span>☁️</span>}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        color: '#1565c0',
                      }}
                    >
                      Select Files
                      <input
                        hidden
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.docx"
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          setAttachments((prev) => [...prev, ...files]);
                        }}
                      />
                    </Button>
                  </Paper>

                  {/* ATTACHED FILES */}
                  {attachments.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography fontWeight={600} sx={{ mb: 1 }}>
                        Attached Files:
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {attachments.map((file, index) => (
                          <Chip
                            key={index}
                            label={file.name}
                            onDelete={() =>
                              setAttachments(
                                attachments.filter((_, i) => i !== index)
                              )
                            }
                            sx={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #cfd8dc',
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {activeStep === 3 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Review DRE Summary
                  </Typography>

                  <Paper
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <Grid container spacing={1.5}>
                      <Grid item xs={12}>
                        <Typography>
                          <b>DRE Number:</b> {formData.dreNumber || '-'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography>
                          <b>DRE Engineer:</b> {formData.dreEngineerName || '-'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography>
                          <b>Date:</b> {formData.date || '-'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography>
                          <b>Model:</b> {formData.model || '-'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography>
                          <b>Part:</b> {formData.part || '-'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography>
                          <b>Problem:</b> {formData.problem || '-'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography>
                          <b>Attachments:</b>{' '}
                          {attachments.length > 0
                            ? attachments.map((file) => file.name).join(', ')
                            : 'None'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>
              )}

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 4,
                  pt: 2,
                  borderTop: '1px solid #e5e7eb',
                }}
              >
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                >
                  Back
                </Button>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveDraft}
                  >
                    Save Draft
                  </Button>

                  {activeStep === 3 ? (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleSubmitDRE}
                    >
                      Submit DRE
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

        {/* RIGHT PANEL – DRAFTS & SUBMITTED */}
        <Grid item xs={12} md={4}>

          {/* DRAFTS */}
          <Accordion
            expanded={expandedPanel === "drafts"}
            onChange={handleAccordionChange("drafts")}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>
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
                    key={draft.DreId}
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
                      {draft.DreNumber || "Untitled Draft"}
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
              <Typography fontWeight={600}>
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
                  No submitted entries
                </Typography>
              ) : (
                submitted.map((entry) => (
                  <Paper
                    key={entry.DreId}
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
                      {entry.DreNumber}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      Submitted •{" "}
                      {new Date(entry.DreDate).toLocaleDateString()}
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

export default DREEntry;
