import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import Button from "@mui/material/Button";
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { loginRequest } from "../authConfig";

export const SignInButton = () => {
    const { instance } = useMsal();

    const [anchorEl, setAnchorEl] = useState(null);
    const [showRetryDialog, setShowRetryDialog] = useState(false);
    const [retryRequested, setRetryRequested] = useState(false);
    const [showPopupWarning, setShowPopupWarning] = useState(false);
    const open = Boolean(anchorEl);

    const handleLogin = async (loginType) => {
        setAnchorEl(null);

        if (loginType === "popup") {
            // Show warning when popup is about to open
            setShowPopupWarning(true);

            try {
                await instance.loginPopup({
                    ...loginRequest,
                    // Only override if user explicitly clicked retry
                    overrideInteractionInProgress: retryRequested
                });

                // Hide warning on success
                setShowPopupWarning(false);
                setRetryRequested(false);
            } catch (error) {
                // Hide warning on error
                setShowPopupWarning(false);

                if (error.errorCode === 'interaction_in_progress') {
                    // Show retry dialog - let user decide whether to retry
                    setShowRetryDialog(true);
                } else {
                    // Reset retry flag for other errors
                    setRetryRequested(false);
                    console.error(error);
                }
            }
        } else if (loginType === "redirect") {
            instance.loginRedirect(loginRequest);
        }
    }

    const handleRetry = () => {
        setShowRetryDialog(false);
        setRetryRequested(true); // User explicitly requested retry
        handleLogin("popup");
    }

    const handleCancelRetry = () => {
        setShowRetryDialog(false);
        setRetryRequested(false);
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

            {/* Warning message during popup authentication */}
            {showPopupWarning && (
                <Alert
                    severity="info"
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                        zIndex: 1300,
                        maxWidth: 400
                    }}
                >
                    <AlertTitle>Authentication in Progress</AlertTitle>
                    Please complete authentication in the popup window. Do not close the popup until authentication is complete.
                </Alert>
            )}

            {/* Retry dialog for interaction_in_progress errors */}
            <Dialog
                open={showRetryDialog}
                onClose={handleCancelRetry}
            >
                <DialogTitle>Authentication Already in Progress</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        An authentication request is already in progress. This may happen if:
                    </DialogContentText>
                    <DialogContentText component="div" sx={{ mt: 1 }}>
                        <ul>
                            <li>You closed the popup window before completing authentication</li>
                            <li>The previous authentication attempt is still pending</li>
                        </ul>
                    </DialogContentText>
                    <DialogContentText sx={{ mt: 2 }}>
                        Would you like to cancel the pending authentication and try again?
                    </DialogContentText>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        <AlertTitle>Warning</AlertTitle>
                        Retrying will cancel the pending authentication request.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelRetry} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleRetry} color="primary" variant="contained">
                        Retry Authentication
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
};
