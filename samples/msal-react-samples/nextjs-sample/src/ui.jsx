import React, {useState} from "react";
import { makeStyles } from '@material-ui/core/styles';
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from "../src/authConfig";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Link from "@material-ui/core/Link";
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

const SignInButton = () => {
    const { instance } = useMsal();

    const [anchorEl, setAnchorEl] = React.useState(null);
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

const SignOutButton = () => {
    const { instance } = useMsal();

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleLogout = (logoutType) => {
        setAnchorEl(null);

        if (logoutType === "popup") {
            instance.logoutPopup();
        } else if (logoutType === "redirect") {
            instance.logoutRedirect();
        }
    }

    return (
        <div>
            <IconButton
                onClick={(event) => setAnchorEl(event.currentTarget)}
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
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem onClick={() => handleLogout("redirect")}>Logout using Redirect</MenuItem>
                <MenuItem onClick={() => handleLogout("popup")}>Logout using Popup</MenuItem>
            </Menu>
        </div>
    )
};

const SignInSignOutButton = () => {
    const { inProgress } = useMsal();
    const isAuthenticated = useIsAuthenticated();

    if (isAuthenticated) {
        return <SignOutButton />;
    } else if (inProgress !== InteractionStatus.Startup && inProgress !== InteractionStatus.HandleRedirect) {
        // inProgress check prevents sign-in button from being displayed briefly after returning from a redirect sign-in. Processing the server response takes a render cycle or two
        return <SignInButton />;
    } else {
        return null;
    }
}

const NavBar = () => {
    const classes = useStyles();

    return (
        <div className={classes.root}>
            <AppBar position="static">
            <Toolbar>
                <Typography className={classes.title}>
                    <Link href="/" color="inherit" variant="h6">MS Identity Platform</Link>
                </Typography>
                <WelcomeName />
                <SignInSignOutButton />
            </Toolbar>
            </AppBar>
        </div>
    );
};

const WelcomeName = () => {
    const { accounts } = useMsal();
    const [name, setName] = useState(null);

    useEffect(() => {
        if (accounts.length > 0) {
            setName(accounts[0].name.split(" ")[0]);
        }
    }, [accounts]);

    if (name) {
        return <Typography variant="h6">Welcome, {name}</Typography>;
    } else {
        return null;
    }
}

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
