import React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

export interface SnackbarAlertProps {
  open: boolean;
  message: string;
  severity?: "success" | "error" | "warning" | "info";
  autoHideDuration?: number;
  onClose: () => void;
}

const SnackbarAlert: React.FC<SnackbarAlertProps> = ({
  open,
  message,
  severity = "success",
  autoHideDuration = 4000,
  onClose,
}) => (
  <Snackbar
    open={open}
    autoHideDuration={autoHideDuration}
    onClose={onClose}
    anchorOrigin={{ vertical: "top", horizontal: "right" }}
  >
  </Snackbar>
);

export default SnackbarAlert;
