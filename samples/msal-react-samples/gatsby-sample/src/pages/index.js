import React from "react";
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import Layout from "../components/Layout";
import { Button } from "gatsby-material-ui-components";
import Typography from "@material-ui/core/Typography";

export default function Home() {
  return (
    <Layout>
      <AuthenticatedTemplate>
          <Button variant="contained" color="primary" to="/profile">Request Profile Information</Button>
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <Typography variant="h6">
          <center>Please sign-in to see your profile information.</center>
        </Typography>
      </UnauthenticatedTemplate>
    </Layout>
  );
}
