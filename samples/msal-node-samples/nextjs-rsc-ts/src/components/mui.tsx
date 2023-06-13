"use client";

// https://nextjs.org/docs/getting-started/react-essentials#third-party-packages
// this file re-exports modules from Material UI explicitly marked as client components
// so that they can be imported and used in server components

import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

export { ButtonGroup, Button, Typography, Link, Toolbar, AppBar, Grid, Paper };
