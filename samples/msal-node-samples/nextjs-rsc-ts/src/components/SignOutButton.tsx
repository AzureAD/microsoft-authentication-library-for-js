"use client";

import { useState } from "react";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import { logout } from "~/actions/auth";
import Avatar from "@mui/material/Avatar";

export const SignOutButton = () => {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);

  return (
    <div>
      <Avatar
        style={{ cursor: "pointer" }}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        alt="Profile Picture"
        src="profile/picture"
      />
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <form action={logout}>
          <MenuItem component={"button"} type="submit" key="logout">
            Logout
          </MenuItem>
        </form>
      </Menu>
    </div>
  );
};
