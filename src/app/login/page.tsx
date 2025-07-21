"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Divider,
  Link,
  Grid,
  CssBaseline,
  Avatar,
  ThemeProvider,
  createTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";
import { forgotPassword, signIn } from "../auth/auth";
import { UseContext } from "@/state/provider";
import { safeLocalStorage } from "../utils/storage";
import * as yup from "yup";
import { useFormik } from "formik";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    text: {
      primary: "#000000",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-input": {
            color: "#000000",
          },
          "& .MuiFormHelperText-root": {
            color: "#d32f2f",
          },
        },
      },
    },
  },
});

// Define validation schema for login
const loginValidationSchema = yup.object({
  email: yup
    .string()
    .email("Enter a valid email")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password should be at least 8 characters")
    .required("Password is required"),
});

// Define validation schema for forgot password
const forgotPasswordValidationSchema = yup.object({
  email: yup
    .string()
    .email("Enter a valid email")
    .required("Email is required"),
});

const LoginPage = () => {
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [loginError, setLoginError] = useState("");
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { setToken } = UseContext();

  const loginFormik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginValidationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        const response = await signIn({
          username: values.email,
          password: values.password,
        });

        safeLocalStorage.setItem("token", response.access_token);
        setToken(response.access_token);
        router.push("/");
        setLoginError("");
      } catch (error: any) {
        const errMsg =
          error.response?.data?.detail || error.message || "Failed to sign in";
        setLoginError(errMsg);
        console.error("Login failed:", errMsg);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const forgotPasswordFormik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: forgotPasswordValidationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      setForgotPasswordError("");
      try {
        await forgotPassword(forgotPasswordFormik.values.email);
        setForgotPasswordSuccess(true);
      } catch (error: any) {
        setForgotPasswordError(
          error.response?.data?.detail || "An error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setForgotPasswordSuccess(false);
    setForgotPasswordError("");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Grid container sx={{ height: "100vh" }} suppressHydrationWarning>
        {/* Left side with image background and content */}
        {!isMobile && (
          <Grid
            item
            xs={false}
            md={6}
            sx={{
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.76)",
                zIndex: 1,
              },
              backgroundImage: "url('/img1.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              p: 8,
              color: "white",
            }}
          >
            <Box sx={{ position: "relative", zIndex: 2 }}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                SPARC the AI Teacher
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ mb: 4 }}>
                Get started with your immersive learning experience
              </Typography>
            </Box>
          </Grid>
        )}

        {/* Right side with login form */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            p: 4,
          }}
        >
          {showForgotPassword ? (
            <Box
              sx={{
                width: "100%",
                maxWidth: 400,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {forgotPasswordSuccess ? (
                <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                    }}
                  >
                    <Avatar sx={{ m: 1, bgcolor: "success.main" }}>
                      <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                      Password Reset Email Sent
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      Please check your email for instructions to reset your
                      password.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<ArrowBackIcon />}
                      onClick={handleBackToLogin}
                      sx={{ mt: 2 }}
                    >
                      Return to Sign In
                    </Button>
                  </Box>
                </Paper>
              ) : (
                <>
                  <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                    <LockOutlinedIcon />
                  </Avatar>
                  <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                    Forgot Password
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Enter your email to reset your password
                  </Typography>
                  <Divider sx={{ width: "100%", my: 3 }} />
                  <Box
                    component="form"
                    autoComplete="off"
                    noValidate
                    onSubmit={forgotPasswordFormik.handleSubmit}
                    sx={{ mt: 1, width: "100%" }}
                  >
                    {forgotPasswordError && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {forgotPasswordError}
                      </Alert>
                    )}
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="email"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
                      autoFocus
                      value={forgotPasswordFormik.values.email}
                      onChange={forgotPasswordFormik.handleChange}
                      onBlur={forgotPasswordFormik.handleBlur}
                      error={
                        forgotPasswordFormik.touched.email &&
                        Boolean(forgotPasswordFormik.errors.email)
                      }
                      helperText={
                        forgotPasswordFormik.touched.email &&
                        forgotPasswordFormik.errors.email
                      }
                      variant="outlined"
                      InputProps={{
                        style: { color: "#000000" },
                      }}
                    />
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      sx={{ mt: 3, mb: 2, py: 1.5 }}
                      disabled={isLoading || !forgotPasswordFormik.isValid}
                    >
                      {isLoading ? (
                        <>
                          <CircularProgress size={24} color="inherit" />
                          <Box component="span" sx={{ ml: 1 }}>
                            Sending...
                          </Box>
                        </>
                      ) : (
                        "Reset Password"
                      )}
                    </Button>
                    <Button
                      fullWidth
                      variant="text"
                      startIcon={<ArrowBackIcon />}
                      onClick={handleBackToLogin}
                      sx={{ mt: 1 }}
                    >
                      Back to Sign In
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          ) : (
            <>
              <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                <LockOutlinedIcon />
              </Avatar>
              {/* <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                School Admin Portal
              </Typography> */}
              <Typography
                variant="h4"
                sx={{
                  fontFamily: "monospace",
                  letterSpacing: "0.3rem",
                  textTransform: "uppercase",
                }}
              >
                SPARC
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Sign in to your account
              </Typography>
              <Divider sx={{ width: "100%", my: 3 }} />
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 400,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  px: 2,
                }}
              >
                <Box
                  component="form"
                  autoComplete="off"
                  noValidate
                  onSubmit={loginFormik.handleSubmit}
                  sx={{ mt: 1, width: "100%" }}
                >
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="off"
                    autoFocus
                    value={loginFormik.values.email}
                    onChange={loginFormik.handleChange}
                    onBlur={loginFormik.handleBlur}
                    error={
                      loginFormik.touched.email &&
                      Boolean(loginFormik.errors.email)
                    }
                    helperText={
                      loginFormik.touched.email && loginFormik.errors.email
                    }
                    variant="outlined"
                    InputProps={{
                      style: { color: "#000000" },
                    }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="new-password"
                    value={loginFormik.values.password}
                    onChange={loginFormik.handleChange}
                    onBlur={loginFormik.handleBlur}
                    error={
                      loginFormik.touched.password &&
                      Boolean(loginFormik.errors.password)
                    }
                    helperText={
                      loginFormik.touched.password &&
                      loginFormik.errors.password
                    }
                    variant="outlined"
                    InputProps={{
                      style: { color: "#000000" },
                    }}
                  />
                  {loginError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {loginError}
                    </Alert>
                  )}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Remember me"
                    />
                    <Link
                      href="#"
                      variant="body2"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowForgotPassword(true);
                      }}
                    >
                      Forgot password?
                    </Link>
                  </Box>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2, py: 1.5 }}
                    disabled={isLoading || !loginFormik.isValid}
                  >
                    {isLoading ? (
                      <>
                        <CircularProgress size={24} color="inherit" />
                        <Box component="span" sx={{ ml: 1 }}>
                          Signing in...
                        </Box>
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                  <Grid container justifyContent="center">
                    <Grid item>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        component="span"
                      >
                        Don't have an account?{" "}
                      </Typography>
                      <Link
                        href="#"
                        variant="body2"
                        onClick={(e) => {
                          e.preventDefault();
                          router.push("/signup");
                        }}
                      >
                        Create an account
                      </Link>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </>
          )}
        </Grid>
      </Grid>
    </ThemeProvider>
  );
};

export default LoginPage;
