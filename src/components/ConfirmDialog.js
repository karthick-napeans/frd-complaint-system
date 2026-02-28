import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Box,
  Fade
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

const ConfirmDialog = ({
  open,
  title,
  message,
  successMessage = "Deleted successfully.",
  errorMessage = "Something went wrong.",
  onConfirm,
  onCancel
}) => {
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState(null);
  const [responseMessage, setResponseMessage] = React.useState("");

  const handleConfirmClick = async () => {
    setLoading(true);
    setStatus(null);

    try {
      await onConfirm();

      setStatus("success");
      setResponseMessage(successMessage);

      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (error) {
      setStatus("error");
      setResponseMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStatus(null);
    setResponseMessage("");
    onCancel();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? null : handleClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          padding: 1,
          minWidth: 360
        }
      }}
      TransitionComponent={Fade}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <DeleteOutlineIcon sx={{ color: "#ff6b6b" }} />
        <Typography fontWeight={600}>{title}</Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Status Message */}
        {status && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 2,
              borderRadius: 2,
              backgroundColor:
                status === "success" ? "#eafaf1" : "#fdecec",
              color: status === "success" ? "#2e7d32" : "#c62828",
              mb: 2
            }}
          >
            {status === "success" ? (
              <CheckCircleOutlineIcon />
            ) : (
              <ErrorOutlineIcon />
            )}
            <Typography fontSize={14} fontWeight={500}>
              {responseMessage}
            </Typography>
          </Box>
        )}

        {!status && (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", lineHeight: 1.6 }}
          >
            {message}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{
            textTransform: "none",
            borderRadius: 2
          }}
        >
          Cancel
        </Button>

        {!status && (
          <Button
            onClick={handleConfirmClick}
            disabled={loading}
            variant="contained"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              backgroundColor: "#ff6b6b",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#ff5252",
                boxShadow: "none"
              }
            }}
            startIcon={
              loading ? <CircularProgress size={18} color="inherit" /> : null
            }
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;