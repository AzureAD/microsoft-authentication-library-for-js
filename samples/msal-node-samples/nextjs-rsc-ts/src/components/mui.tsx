"use client";

// https://nextjs.org/docs/getting-started/react-essentials#third-party-packages
// this file re-exports modules from Material UI explicitly marked as client components
// so that they can be imported and used in server components

export {
  ButtonGroup,
  Button,
  Typography,
  Link,
  Toolbar,
  AppBar,
  Grid,
  Paper,
} from "@mui/material";
