import React from "react";
import Navbar from "react-bootstrap/Navbar";
import Button from "react-bootstrap/Button";
import DropdownButton from "react-bootstrap/DropdownButton";
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import Dropdown from "react-bootstrap/esm/Dropdown";

const SignInSignOutButton = () => {
    const { instance } = useMsal();
    return (
        <>
            <AuthenticatedTemplate>
                <Button variant="secondary" onClick={() => instance.logout()} className="ml-auto">Sign Out</Button>
            </AuthenticatedTemplate>
            <UnauthenticatedTemplate>
                <DropdownButton variant="secondary" className="ml-auto" drop="left" title="Sign In">
                    <Dropdown.Item as="button" onClick={() => instance.loginPopup(loginRequest)}>Sign in using Popup</Dropdown.Item>
                    <Dropdown.Item as="button" onClick={() => instance.loginRedirect(loginRequest)}>Sign in using Redirect</Dropdown.Item>
                </DropdownButton>
            </UnauthenticatedTemplate>
        </>
    );
};

export const PageLayout = (props: any) => {
    return (
        <>
            <Navbar bg="primary" variant="dark">
                <a className="navbar-brand" href="/">MS Identity Platform</a>
                <SignInSignOutButton/>
            </Navbar>
            <h5 className="sample-header">Welcome to the Microsoft Authentication Library For Typescript - React Quickstart</h5>
            <br/>
            <br/>
            {props.children}
        </>
    );
};