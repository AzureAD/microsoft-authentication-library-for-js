/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { Component } from "react";

import Navbar from "react-bootstrap/Navbar";
import Button from "react-bootstrap/Button";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/esm/Dropdown";

import { AuthenticatedTemplate, UnauthenticatedTemplate, withMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";

/**
 * This class is a child component of "PageLayout". MsalContext is passed
 * down from the parent and available as a prop here.
 */
class SignInSignOutButton extends Component {
    render() {
        return (
            <>
                <AuthenticatedTemplate>
                    <Button variant="secondary" onClick={() => this.props.msalContext.instance.logout()} className="ml-auto">Sign Out</Button>
                </AuthenticatedTemplate>
                <UnauthenticatedTemplate>
                    <DropdownButton variant="secondary" className="ml-auto" drop="left" title="Sign In">
                        <Dropdown.Item as="button" onClick={() => this.props.msalContext.instance.loginPopup(loginRequest)}>Sign in using Popup</Dropdown.Item>
                        <Dropdown.Item as="button" onClick={() => this.props.msalContext.instance.loginRedirect(loginRequest)}>Sign in using Redirect</Dropdown.Item>
                    </DropdownButton>
                </UnauthenticatedTemplate>
            </>
        );
    }
};

/**
 * This class is using "withMsal" HOC. It passes down the msalContext 
 * as a prop to its children.
 */
class PageLayout extends Component {
    render() {
        return (
            <>
                <Navbar bg="primary" variant="dark">
                    <a className="navbar-brand" href="/">Microsoft Identity Platform</a>
                    <SignInSignOutButton msalContext={this.props.msalContext} />
                </Navbar>
                <h5><center>Welcome to the Microsoft Authentication Library For Javascript - React Quickstart</center></h5>
                <br />
                <br />
                {this.props.children}
            </>
        );
    }
}

// Wrap your class component to access authentication state as props
export default PageLayout = withMsal(PageLayout);
