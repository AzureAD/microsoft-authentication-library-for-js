import React from "react";
import NavBar from "./NavBar";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";

const Layout = ({ children }) => {

    return (
        <>
            <NavBar />
            <Typography variant="h5">
                <center>Welcome to the Microsoft Authentication Library For React Quickstart</center>
            </Typography>
            <br/>
            <br/>
            <Grid container justify="center">
                {children}
            </Grid>
        </>
    )
};

export default Layout;