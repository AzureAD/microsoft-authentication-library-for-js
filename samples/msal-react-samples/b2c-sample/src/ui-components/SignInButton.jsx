import { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import Button from "@material-ui/core/Button";
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';

import { forgotPasswordRequest, loginRequest } from "../authConfig.js";
import { EventType, InteractionType } from "@azure/msal-browser";

export const SignInButton = () => {
    const { instance } = useMsal();
    useEffect(()=> {
        const callbackId = instance.addEventCallback((event)=> {
            if (event.eventType === EventType.LOGIN_FAILURE) {
                if (event.error && event.error.errorMessage.indexOf("AADB2C90118") > -1) {
                    if (event.interactionType === InteractionType.Redirect) {
                        instance.loginRedirect(forgotPasswordRequest);
                    } else if (event.interactionType === InteractionType.Popup) {
                        instance.loginPopup(forgotPasswordRequest);
                    }
                }
            }
        });

        return () => {
            if (callbackId) {
                instance.removeEventCallback(callbackId);
            }
        };
    }, [instance]);

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleLogin = (loginType) => {
        setAnchorEl(null);

        if (loginType === "popup") {
            instance.loginPopup(loginRequest);
        } else if (loginType === "redirect") {
            instance.loginRedirect(loginRequest);
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