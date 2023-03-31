import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import Button from "@mui/material/Button";
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import { loginRequest } from "../authConfig";

export const SignInButton = () => {
    const { instance } = useMsal();

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleLogin = (loginType) => {
        setAnchorEl(null);
        const authRequest = {
            ...loginRequest,
        };

        if (process.env.NODE_ENV === "development") {
            authRequest.redirectUri = "/redirect.html";
        }

        if (loginType === "popup") {
            instance.loginPopup(authRequest);
        } else if (loginType === "redirect") {
            instance.loginRedirect(authRequest);
        }
    }

    return (
        <div>
            <Button
                onClick={(event) => setAnchorEl(event.currentTarget)}
                color="inherit"
            >
                Login
            </Button>
            <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
                }}
                open={open}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem onClick={() => handleLogin("popup")} key="loginPopup">Sign in using Popup</MenuItem>
                <MenuItem onClick={() => handleLogin("redirect")} key="loginRedirect">Sign in using Redirect</MenuItem>
            </Menu>
        </div>
    )
};