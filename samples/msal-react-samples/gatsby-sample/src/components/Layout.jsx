import React from "react";
import NavBar from "./NavBar";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

const Layout = ({ children }) => {

    return (
        <>
            <NavBar />
            <Typography variant="h5">
                <center>Welcome to the Microsoft Authentication Library For React Quickstart</center>
            </Typography>
            <br/>
            <br/>
            <Grid container justifyContent="center">
                {children}
            </Grid>
        </>
    )
};

export default Layout;