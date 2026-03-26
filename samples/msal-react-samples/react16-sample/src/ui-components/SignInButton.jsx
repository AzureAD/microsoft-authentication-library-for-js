import { useState, useRef, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import Button from "@material-ui/core/Button";
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { loginRequest } from "../authConfig";

export const SignInButton = () => {
    const { instance } = useMsal();

    const [anchorEl, setAnchorEl] = useState(null);
    const [showRetryDialog, setShowRetryDialog] = useState(false);
    const [retryRequested, setRetryRequested] = useState(false);
    const [showPopupWarning, setShowPopupWarning] = useState(false);
    const open = Boolean(anchorEl);

    // Track mounted state to avoid setting state after unmount (React 16 does not batch async state updates)
    const isMountedRef = useRef(true);
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

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

                // Hide warning on success — guard against unmounted component
                if (isMountedRef.current) {
                    setShowPopupWarning(false);
                    setRetryRequested(false);
                }
            } catch (error) {
                // Hide warning on error — guard against unmounted component
                if (isMountedRef.current) {
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
                <div
                    style={{
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                        zIndex: 1300,
                        maxWidth: 400,
                        padding: 16,
                        backgroundColor: '#e3f2fd',
                        border: '1px solid #90caf9',
                        borderRadius: 4
                    }}
                >
                    <strong>Authentication in Progress</strong>
                    <p>Please complete authentication in the popup window. Do not close the popup until authentication is complete.</p>
                </div>
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
                    <DialogContentText component="div">
                        <ul>
                            <li>You closed the popup window before completing authentication</li>
                            <li>The previous authentication attempt is still pending</li>
                        </ul>
                    </DialogContentText>
                    <DialogContentText>
                        Would you like to cancel the pending authentication and try again?
                    </DialogContentText>
                    <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fff3e0', border: '1px solid #ffb74d', borderRadius: 4 }}>
                        <strong>Warning</strong>
                        <p style={{ margin: 0 }}>Retrying will cancel the pending authentication request.</p>
                    </div>
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
