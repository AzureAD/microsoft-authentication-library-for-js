import Typography from "@mui/material/Typography";
import NavBar from "./NavBar";
import { PropsWithChildren } from "react";

export const PageLayout = ({ children }: PropsWithChildren) => {
  return (
    <>
      <NavBar />
      <Typography variant="h5">
        <center>
          Welcome to the Microsoft Authentication Library For React Quickstart
        </center>
      </Typography>
      <br />
      <br />
      {children}
    </>
  );
};
