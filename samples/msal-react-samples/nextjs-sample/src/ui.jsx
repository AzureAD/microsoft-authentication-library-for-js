import React, {useState} from "react";
import { makeStyles } from '@material-ui/core/styles';
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { loginRequest } from "../src/authConfig";
import { AppBar, Toolbar, Typography } from "@material-ui/core";
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import IconButton from '@material-ui/core/IconButton';
import AccountCircle from '@material-ui/icons/AccountCircle';
import { useEffect } from "react";

const useStyles = makeStyles((theme) => ({
    root: {
      flexGrow: 1,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    title: {
      flexGrow: 1,
    },
}));

const SignInSignOutButton = () => {
    const { instance } = useMsal();
    const isAuthenticated = useIsAuthenticated();

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogin = (loginType) => {
        handleClose();

        if (loginType === "popup") {
            instance.loginPopup(loginRequest);
        } else if (loginType === "redirect") {
            instance.loginRedirect(loginRequest);
        }
    }

    const handleLogout = () => {
        handleClose();
        instance.logout();
    }

    return (
        <div>
            <IconButton
                onClick={handleMenu}
                color="inherit"
            >
                <AccountCircle />
            </IconButton>
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
                onClose={handleClose}
            >
                {isAuthenticated ?
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                :
                [<MenuItem onClick={() => handleLogin("popup")} key="loginPopup">Sign in using Popup</MenuItem>,
                <MenuItem onClick={() => handleLogin("redirect")} key="loginRedirect">Sign in using Redirect</MenuItem>]
                }
            </Menu>
        </div>
    )
};

const NavBar = () => {
    const classes = useStyles();
    const { accounts } = useMsal();
    const [name, setName] = useState(null);

    useEffect(() => {
        if (accounts.length > 0) {
            setName(accounts[0].name.split(" ")[0]);
        }
    }, [accounts]);

    return (
        <div className={classes.root}>
            <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" className={classes.title}>
                    MS Identity Platform
                </Typography>
                {name ? (<Typography variant="h6">
                    Welcome, {name}
                </Typography> ): null}
                <SignInSignOutButton />
            </Toolbar>
            </AppBar>
        </div>
    );
};

export const PageLayout = (props) => {
    return (
        <>
            <NavBar />
            <Typography variant="h5">
                <center>Welcome to the Microsoft Authentication Library For React - Next.js Quickstart</center>
            </Typography>
            <br/>
            <br/>
            {props.children}
        </>
    );
  };
