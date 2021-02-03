/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { Component } from "react";

import Button from "react-bootstrap/Button";
import "./styles/App.css";

import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate, MsalContext } from "@azure/msal-react";
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest } from "./authConfig";
import { ProfileData, callMsGraph } from "./graph.jsx";
import PageLayout from "./ui.jsx";

/**
 * This class is using the raw context directly. The available
 * objects and methods are the same as in "withMsal" HOC usage.
 */
class ProfileContent extends Component {

    static contextType = MsalContext;

    constructor(props) {
        super(props)

        this.state = {
            graphData: null
        }
    }

    RequestProfileData = () => {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        }).then((response) => {
            callMsGraph(response.accessToken).then(response => this.setState({graphData: response}));
        }).catch((error) => console.log(error));
    }

    render() {
        return (
            <>
                <h5 className="card-title">Welcome {this.context.accounts[0].name}</h5>
                {this.state.graphData ? 
                    <ProfileData graphData={this.state.graphData} />
                    :
                    <Button variant="secondary" onClick={this.RequestProfileData}>Request Profile Information</Button>
                }
            </>
        );
    }
}

class MainContent extends Component {
    render() {
        return (
            <div className="App">
                <AuthenticatedTemplate>
                    <ProfileContent />
                </AuthenticatedTemplate>
    
                <UnauthenticatedTemplate>
                    <h5 className="card-title">Please sign-in to see your profile information.</h5>
                </UnauthenticatedTemplate>
            </div>
        );
    }
}

/**
 * You will need an "MsalProvider" component at the top level of the component tree 
 * that requires access to authentication state. "MsalProvider" component must be 
 * rendered at any level above any component that uses context.
 */
export default class App extends Component {
    render() {

        const msalInstance = new PublicClientApplication(msalConfig);

        return (
            <MsalProvider instance={msalInstance}>
                <PageLayout>
                    <MainContent />
                </PageLayout>
            </MsalProvider>
        );
    }
}