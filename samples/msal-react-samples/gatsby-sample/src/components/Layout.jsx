import React from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "../authConfig";
import NavBar from "./NavBar";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import { ThemeProvider } from '@material-ui/core/styles';
import { theme } from "../styles/theme";

const Layout = ({ children }) => {
    const msalInstance = new PublicClientApplication(msalConfig);

    return (
        <ThemeProvider theme={theme}>
            <MsalProvider instance={msalInstance}>
                <NavBar />
                <Typography variant="h5">
                    <center>Welcome to the Microsoft Authentication Library For React Quickstart</center>
                </Typography>
                <br/>
                <br/>
                <Grid container justify="center">
                    {children}
                </Grid>
            </MsalProvider>
        </ThemeProvider>
    )
};

export default Layout;