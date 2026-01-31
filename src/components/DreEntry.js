import React, { useState } from 'react';
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
import { saveDreDraft, saveDreWithFiles } from "../api/pageApi"

const DREEntry = () => {
  const [attachments, setAttachments] = useState([]);
  const [showHeaderError, setShowHeaderError] = useState(false);

  const [editingDraftId, setEditingDraftId] = useState(null);

  const [activeStep, setActiveStep] = useState(0);
  const [drafts, setDrafts] = useState([]);
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState([]);

  const [formData, setFormData] = useState({
    id: '',                // IMPORTANT for draft tracking
    dreId: '',
    dreName: '',
    date: '',
    model: '',
    part: '',
    problem: '',
    attachments: [],
    status: 'Draft',
  });

  const buildDrePayload = (status) => ({
    dreId: formData.dreId || null,
    status, // "DRAFT" or "SUBMITTED"

    basicInfo: {
      dreNumber: formData.dreName,
      date: formData.date,
      model: formData.model,
      part: formData.part,
      problemDescription: formData.problem,
    },

    vehicleDetails: {
      vinNumber: formData.vinNumber,
      vehicleProductionDate: formData.vehicleProductionDate,
      vehicleSalesDate: formData.vehicleSalesDate,
      vehicleRepairDate: formData.vehicleRepairDate,
    },

    analysisDetails: {
      dreEngineerName: formData.dreEngineerName,
      dreAnalysis: formData.dreAnalysis,
      resultConclusion: formData.resultConclusion,
    },
  });

  const buildDreFormData = (drePayload, files = []) => {
    const formData = new FormData();

    // Postman → Text
    formData.append("dreData", JSON.stringify(drePayload));

    // Postman → File (repeated key)
    files.forEach((file) => {
      formData.append("files", file);
    });

    return formData;
  };



  const handleDraftClick = (draft) => {
    setActiveDraftId(draft.id);
    setFormData({ ...draft });
    setActiveStep(0);
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (
        !formData.dreId ||
        !formData.dreName ||
        !formData.date ||
        !formData.model ||
        !formData.part
      ) {
        setMessage('Please fill all required fields in DRE Header');
        return;
      }
    }

    if (activeStep === 1) {
      if (!formData.problem) {
        setMessage('Please fill Problem Description');
        return;
      }
    }

    setMessage('');
    setActiveStep(activeStep + 1);
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleSaveDraft = async () => {
    try {
      const payload = buildDrePayload("DRAFT");

      const res = await saveDreDraft(payload);

      // backend may return dreId
      setFormData((prev) => ({
        ...prev,
        dreId: res.data?.dreId || prev.dreId,
        status: "Draft",
      }));

      setMessage("✓ DRE draft saved.");
    } catch (err) {
      console.error("Draft save failed", err);
      setMessage("❌ Failed to save draft");
    }
  };

  const handleSubmitDRE = async () => {
    try {
      const payload = buildDrePayload("SUBMITTED");

      const fd = buildDreFormData(payload, attachments);

      for (const [k, v] of fd.entries()) {
        console.log("FD →", k, v);
      }

      await saveDreWithFiles(fd);
      setMessage("✓ DRE saved successfully");
    } catch (err) {
      console.error("Submit failed", err.response?.data || err);
      setMessage("❌ DRE save failed");
    }
  };



  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      attachments: Array.from(e.target.files),
    }));
  };


  const steps = [
    'DRE Header',
    'Problem & Analysis',
    'Attachments',
    'Review & Submit',
  ];

  const MODELS = ['FH', 'HQ', 'SV', 'SP'];
  const PARTS = ['WHEEL BEARING', 'BRAKE DISC', 'ENGINE'];

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

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
                      label="DRE ID *"
                      name="dreId"
                      fullWidth
                      value={formData.dreId}
                      onChange={handleChange}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="DRE Engineer Name *"
                      name="dreName"
                      fullWidth
                      value={formData.dreName}
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
                    <FormControl fullWidth>
                      <InputLabel>Model *</InputLabel>
                      <Select
                        name="model"
                        value={formData.model}
                        label="Model *"
                        onChange={handleChange}
                      >
                        {MODELS.map((m) => (
                          <MenuItem key={m} value={m}>
                            {m}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Part *</InputLabel>
                      <Select
                        name="part"
                        value={formData.part}
                        label="Part *"
                        onChange={handleChange}
                      >
                        {PARTS.map((p) => (
                          <MenuItem key={p} value={p}>
                            {p}
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
                          <b>DRE ID:</b> {formData.dreId || '-'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography>
                          <b>DRE Engineer:</b> {formData.dreName || '-'}
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

        {/* RIGHT SIDE PANEL */}
        {/* RIGHT PANEL – DRAFTS & SUBMITTED */}
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
                    key={draft.id}
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
                      {draft.dreId || 'Untitled Draft'}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {draft.model} • {draft.part}
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
                  No submitted entries
                </Typography>
              ) : (
                submitted.map((entry) => (
                  <Paper
                    key={entry.id}
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
                      {entry.dreId}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      Submitted • {entry.submittedDate}
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
