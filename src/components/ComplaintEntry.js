import React, { useState } from 'react';
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
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import SaveAltIcon from '@mui/icons-material/SaveAlt';

const ComplaintEntry = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    complaintId: '',
    customerName: '',
    modelCode: '',
    complaintDescription: '',
    reportedDate: '',
    severity: 'Medium',
    attachments: [],
    draftSavedTime: null,
  });

  const [complaints, setComplaints] = useState([
    { id: 'COMP001', customerName: 'Customer A', status: 'Draft', savedDate: '2025-11-02' },
    { id: 'COMP002', customerName: 'Customer B', status: 'Submitted', savedDate: '2025-10-28' },
  ]);

  const [drafts, setDrafts] = useState([
    { id: 'DRAFT001', customerName: 'Customer C', lastSaved: '2025-11-01', daysInactive: 2 },
  ]);

  const [message, setMessage] = useState('');

  const steps = ['Complaint Details', 'Attachments', 'Review & Submit'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData({
      ...formData,
      attachments: [...formData.attachments, ...files],
    });
  };

  const handleSaveDraft = () => {
    const draftData = {
      ...formData,
      complaintId: `DRAFT_${Date.now()}`,
      status: 'Draft',
      draftSavedTime: new Date().toLocaleString(),
    };

    setDrafts([...drafts, { ...draftData, lastSaved: new Date().toISOString().split('T')[0] }]);
    setMessage('Draft saved successfully! You will receive an email notification if this remains incomplete for 10 days.');

    setTimeout(() => {
      resetForm();
      setMessage('');
    }, 3000);
  };

  const handleSubmit = () => {
    if (!formData.customerName || !formData.complaintDescription) {
      setMessage('Please fill all required fields');
      return;
    }

    const newComplaint = {
      ...formData,
      complaintId: `COMP_${Date.now()}`,
      status: 'Submitted',
      savedDate: new Date().toISOString().split('T')[0],
    };

    setComplaints([...complaints, newComplaint]);
    setMessage('Complaint submitted successfully!');

    setTimeout(() => {
      resetForm();
      setMessage('');
      setActiveStep(0);
    }, 2000);
  };

  const resetForm = () => {
    setFormData({
      complaintId: '',
      customerName: '',
      modelCode: '',
      complaintDescription: '',
      reportedDate: '',
      severity: 'Medium',
      attachments: [],
      draftSavedTime: null,
    });
  };

  const handleNext = () => {
    if (activeStep === 0 && (!formData.customerName || !formData.complaintDescription)) {
      setMessage('Please fill in Customer Name and Complaint Description');
      return;
    }
    setActiveStep(activeStep + 1);
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Complaint & DRE Entry
      </Typography>

      <Grid container spacing={3}>
        {/* Form Section */}
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
                <Alert severity={message.includes('successfully') ? 'success' : 'error'} sx={{ mb: 2 }}>
                  {message}
                </Alert>
              )}

              {/* Step 1: Complaint Details */}
              {activeStep === 0 && (
                <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
                  <TextField
                    label="Customer Name"
                    fullWidth
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    required
                  />
                  <TextField
                    label="Model Code"
                    fullWidth
                    name="modelCode"
                    value={formData.modelCode}
                    onChange={handleInputChange}
                  />
                  <TextField
                    label="Complaint Description"
                    fullWidth
                    multiline
                    rows={4}
                    name="complaintDescription"
                    value={formData.complaintDescription}
                    onChange={handleInputChange}
                    required
                  />
                  <TextField
                    label="Reported Date"
                    type="date"
                    name="reportedDate"
                    value={formData.reportedDate}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    select
                    label="Severity Level"
                    name="severity"
                    value={formData.severity}
                    onChange={handleInputChange}
                    SelectProps={{ native: true }}
                    fullWidth
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </TextField>
                </Box>
              )}

              {/* Step 2: Attachments */}
              {activeStep === 1 && (
                <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body1">Upload PDF Attachments</Typography>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                  >
                    Select PDF Files
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      hidden
                      onChange={handleFileUpload}
                    />
                  </Button>

                  {formData.attachments.length > 0 && (
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

              {/* Step 3: Review & Submit */}
              {activeStep === 2 && (
                <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6">Review Complaint Summary</Typography>
                  <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                    <Box sx={{ gap: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography><strong>Customer:</strong> {formData.customerName}</Typography>
                      <Typography><strong>Model:</strong> {formData.modelCode}</Typography>
                      <Typography><strong>Description:</strong> {formData.complaintDescription}</Typography>
                      <Typography><strong>Severity:</strong> {formData.severity}</Typography>
                      <Typography><strong>Files:</strong> {formData.attachments.length} file(s) attached</Typography>
                    </Box>
                  </Paper>
                  <Alert severity="info">Please review the details above before submitting.</Alert>
                </Box>
              )}

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                >
                  Back
                </Button>

                <Box sx={{ gap: 1, display: 'flex' }}>
                  <Button
                    variant="outlined"
                    startIcon={<SaveAltIcon />}
                    onClick={handleSaveDraft}
                  >
                    Save as Draft
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

        {/* Sidebar: Recent Drafts & Complaints */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent Drafts
              </Typography>
              {drafts.map((draft) => (
                <Paper key={draft.id} sx={{ p: 2, mb: 1, backgroundColor: '#fff3cd' }}>
                  <Typography variant="body2"><strong>{draft.id}</strong></Typography>
                  <Typography variant="caption">{draft.customerName}</Typography>
                  <Typography variant="caption" display="block">
                    Last saved: {draft.lastSaved}
                  </Typography>
                  {draft.daysInactive >= 10 && (
                    <Chip
                      label="Pending 10+ days"
                      size="small"
                      color="warning"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Paper>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent Submissions
              </Typography>
              {complaints.slice(0, 3).map((complaint) => (
                <Paper key={complaint.id} sx={{ p: 2, mb: 1 }}>
                  <Typography variant="body2"><strong>{complaint.id}</strong></Typography>
                  <Typography variant="caption">{complaint.customerName}</Typography>
                  <Chip
                    label={complaint.status}
                    size="small"
                    color={complaint.status === 'Submitted' ? 'success' : 'warning'}
                    sx={{ ml: 1 }}
                  />
                </Paper>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ComplaintEntry;
