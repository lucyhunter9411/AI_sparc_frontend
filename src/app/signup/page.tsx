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
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useRouter } from "next/navigation";
import * as yup from "yup";
import { useFormik } from "formik";

import { UseContext } from "@/state/provider";
import { safeLocalStorage } from "../utils/storage";
import { signUp } from "../auth/auth";

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
            color: "#d32f2f", // Red color for error messages
          },
        },
      },
    },
  },
});

// Validation schema
const validationSchema = yup.object({
  name: yup.string().required("Full name is required"),
  email: yup
    .string()
    .email("Enter a valid email")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least one uppercase, one lowercase, one number and one special character"
    )
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
  acceptTerms: yup
    .boolean()
    .oneOf([true], "You must accept the terms and conditions")
    .required("You must accept the terms and conditions"),
});

const SignUpPage = () => {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { setToken } = UseContext();

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        const response = await signUp({
          email: values.email,
          username: values.name,
          password: values.password,
        });

        console.log("Account created successfully");
        router.push("/login");
      } catch (error: any) {
        console.error(
          "Signup failed:",
          error.response?.data?.detail || "Failed to create account"
        );
        // You can set formik errors here if the API returns validation errors
        // formik.setErrors({ email: "Email already exists" });
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Grid
        container
        sx={{
          minHeight: "100vh",
          flexDirection: { xs: "column", md: "row" },
          overflow: "hidden",
        }}
        suppressHydrationWarning
      >
        {/* Left side with image background - hidden on mobile */}
        {!isMobile && (
          <Grid
            item
            md={6}
            sx={{
              height: "100vh",
              position: "relative",
              overflow: "hidden",
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
              {/* <Box component="ul" sx={{ pl: 3, mb: 4 }}>
                <Typography component="li" variant="body1" gutterBottom>
                  Personalized learning paths for every student
                </Typography>
                <Typography component="li" variant="body1" gutterBottom>
                  Real-time feedback and progress tracking
                </Typography>
                <Typography component="li" variant="body1" gutterBottom>
                  Adaptive content that matches your learning style
                </Typography>
                <Typography component="li" variant="body1">
                  24/7 access to AI-powered teaching assistance
                </Typography>
              </Box> */}
              {/* <Box sx={{ mt: 4 }}>
                <Typography variant="body2">5M+ careers advanced</Typography>
                <Typography variant="body2">
                  1500+ Live classes every month
                </Typography>
                <Typography variant="body2">
                  85% report promotion or a new job
                </Typography>
              </Box> */}
            </Box>
          </Grid>
        )}
        {/* Right side with signup form - full width on mobile */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: "flex",
            flexDirection: "column",
            p: { xs: 2, md: 4 },
            height: { xs: "auto", md: "100vh" }, // Changed from minHeight to height
            overflowY: "auto", // Allow scrolling only for form content
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              width: "100%",
              my: { xs: 2, md: 0 }, // Adjusted margins
              py: 2,
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
              <LockOutlinedIcon />
            </Avatar>

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
              Create your account
            </Typography>
            <Divider sx={{ width: "100%", my: 3 }} />
            <Box
              sx={{
                width: "100%",
                maxWidth: 400,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                px: { xs: 1, md: 2 },
              }}
            >
              <Box
                component="form"
                noValidate
                onSubmit={formik.handleSubmit}
                sx={{ mt: 1, width: "100%" }}
              >
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Full Name"
                  name="name"
                  autoComplete="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                  variant="outlined"
                  InputProps={{
                    style: { color: "#000000" },
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
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
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.password && Boolean(formik.errors.password)
                  }
                  helperText={formik.touched.password && formik.errors.password}
                  variant="outlined"
                  InputProps={{
                    style: { color: "#000000" },
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.confirmPassword &&
                    Boolean(formik.errors.confirmPassword)
                  }
                  helperText={
                    formik.touched.confirmPassword &&
                    formik.errors.confirmPassword
                  }
                  variant="outlined"
                  InputProps={{
                    style: { color: "#000000" },
                  }}
                  sx={{ mt: 2 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formik.values.acceptTerms}
                      onChange={formik.handleChange}
                      name="acceptTerms"
                      color="primary"
                      required
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I accept the{" "}
                      <Link href="#" color="primary">
                        Terms and Conditions
                      </Link>
                    </Typography>
                  }
                  sx={{ mt: 2 }}
                />
                {formik.touched.acceptTerms && formik.errors.acceptTerms && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    {formik.errors.acceptTerms}
                  </Typography>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                  disabled={isLoading || !formik.isValid}
                >
                  {isLoading ? "Creating account..." : "Sign up"}
                </Button>

                <Divider sx={{ width: "100%", my: 2 }} />

                <Grid container justifyContent="center">
                  <Grid item>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      component="span"
                    >
                      Already have an account?{" "}
                    </Typography>
                    <Link
                      href="#"
                      variant="body2"
                      onClick={(e) => {
                        e.preventDefault();
                        router.push("/login");
                      }}
                    >
                      Sign in instead
                    </Link>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
};

export default SignUpPage;
