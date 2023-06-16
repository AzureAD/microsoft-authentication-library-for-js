import "./globals.css";
import { PropsWithChildren } from "react";
import NavBar from "~/components/NavBar";
import { Grid, Typography } from "~/components/mui";
import ThemeRegistry from "~/components/theme/ThemeRegistry";

export const metadata = {
  title: "MSAL + Next App Router Quickstart",
  description:
    "Next.js App Router with @azure/msal-node authentication sample.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <NavBar />
          <Typography variant="h5">
            <center>
              Welcome to the Microsoft Authentication Library For NextJS App
              Router Quickstart
            </center>
          </Typography>
          <br />
          <br />
          <Grid container justifyContent="center">
            {children}
          </Grid>
        </ThemeRegistry>
      </body>
    </html>
  );
}
