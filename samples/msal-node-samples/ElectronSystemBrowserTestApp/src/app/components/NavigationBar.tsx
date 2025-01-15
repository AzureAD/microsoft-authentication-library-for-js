import React from "react";
import { AccountInfo } from "@azure/msal-node";
import { Navbar, Button, DropdownButton, Dropdown } from "react-bootstrap";
import { Link } from "react-router-dom";
import { IpcMessages } from "../../Constants";

import "../styles/App.css";

type NavigationBarProps = {
    account: AccountInfo;
};

declare const window: any;

export const NavigationBar = (props: NavigationBarProps) => {
    const login = () => {
        window.api.send(IpcMessages.LOGIN);
    };

    const logout = () => {
        window.api.send(IpcMessages.LOGOUT);
    };

    return (
        <>
            <Navbar bg="primary" variant="dark">
                <Link className="navbar-brand" to="/">
                    Microsoft identity platform
                </Link>
                {props.account ? (
                    <>
                        <Link className="nav-link nav-link" to="/profile">
                            Profile
                        </Link>
                        <div className="collapse navbar-collapse justify-content-end">
                            <DropdownButton
                                variant="warning"
                                drop="start"
                                title={
                                    props.account
                                        ? props.account?.username
                                        : "Unknown"
                                }
                                id="dropdownButton"
                            >
                                <Dropdown.Item as="button" onClick={logout}>
                                    Sign out
                                </Dropdown.Item>
                            </DropdownButton>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="collapse navbar-collapse justify-content-end">
                            <Button
                                variant="secondary"
                                className="ml-auto"
                                as="button"
                                onClick={login}
                                id="SignIn"
                            >
                                Sign in
                            </Button>
                        </div>
                    </>
                )}
            </Navbar>
        </>
    );
};
