import React from "react";
import Navbar from "react-bootstrap/Navbar";
import Button from "react-bootstrap/Button";
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";

const SignInSignOutButton = () => {
    const { instance, state } = useMsal();
    return (
        <>
            <AuthenticatedTemplate>
                <Button variant="secondary" onClick={() => instance.logout()} className="ml-auto">Sign Out</Button>
            </AuthenticatedTemplate>
            <UnauthenticatedTemplate>
                <Button variant="secondary" onClick={() => instance.loginPopup(loginRequest)} className="ml-auto">Sign In</Button>
            </UnauthenticatedTemplate>
        </>
    );
};

export const PageLayout = (props) => {
    return (
        <>
            <Navbar bg="primary" variant="dark">
                <a className="navbar-brand" href="/">MS Identity Platform</a>
                <SignInSignOutButton/>
            </Navbar>
            <h5><center>Welcome to the Microsoft Authentication Library For Javascript - React Quickstart</center></h5>
            <br/>
            <br/>
            {props.children}
        </>
    );
};
