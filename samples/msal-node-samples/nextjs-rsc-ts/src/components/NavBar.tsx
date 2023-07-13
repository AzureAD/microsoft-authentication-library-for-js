import NextLink from "next/link";
import AppBar from "@mui/material/AppBar";
import Link from "@mui/material/Link";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import WelcomeName from "./WelcomeName";
import ProfilePicture from "./ProfilePicture";

export default function NavBar() {
  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography sx={{ flexGrow: 1 }}>
            <Link component={NextLink} href="/" color="inherit" variant="h6">
              MS Identity Platform
            </Link>
          </Typography>
          {/*
            Toolbar expects children to be ReactNode.
            Even though Server Component works, they do not satisfy ReactNode.
            Wrapping in div fixes console error.
          */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <WelcomeName />
            <ProfilePicture />
          </div>
        </Toolbar>
      </AppBar>
    </div>
  );
}
