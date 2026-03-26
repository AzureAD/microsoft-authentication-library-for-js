import { Component } from "react";

// Msal imports
import { MsalAuthenticationTemplate, MsalContext } from "@azure/msal-react";
import { InteractionType, EventType, InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest } from "../authConfig";

// Sample app imports
import { ProfileData } from "../ui-components/ProfileData";
import { Loading } from "../ui-components/Loading";
import { ErrorComponent } from "../ui-components/ErrorComponent";
import { callMsGraph } from "../utils/MsGraphApiCall";

// Material-ui imports
import Paper from "@mui/material/Paper";


/**
 * This class is using the raw context directly. The available
 * objects and methods are the same as in "withMsal" HOC usage.
 */
class ProfileContent extends Component {

    static contextType = MsalContext;

    constructor(props) {
        super(props)

        this.state = {
            graphData: null,
        }

        this.callbackId = null;
    }

    fetchGraphData() {
        if (this.state.graphData) {
            return;
        }

        const instance = this.context.instance;
        if (!instance.getActiveAccount()) {
            return;
        }

        callMsGraph().then(response => this.setState({graphData: response})).catch((e) => {
            if (e instanceof InteractionRequiredAuthError) {
                instance.acquireTokenRedirect({
                    ...loginRequest,
                    account: instance.getActiveAccount()
                });
            }
        });
    }

    componentDidMount() {
        // Attempt to fetch profile data immediately
        this.fetchGraphData();

        // Subscribe to active account changes so the Graph call is retried
        // once setActiveAccount has been called.
        this.callbackId = this.context.instance.addEventCallback((event) => {
            if (event.eventType === EventType.ACTIVE_ACCOUNT_CHANGED) {
                this.fetchGraphData();
            }
        });
    }

    componentWillUnmount() {
        if (this.callbackId) {
            this.context.instance.removeEventCallback(this.callbackId);
        }
    }

    render() {
        return (
            <Paper>
                { this.state.graphData ? <ProfileData graphData={this.state.graphData} /> : null }
            </Paper>
        );
    }
}

/**
 * This class is using "withMsal" HOC. It passes down the msalContext
 * as a prop to its children.
 */
class Profile extends Component {

    render() {

        const authRequest = {
            ...loginRequest
        };

        return (
            <MsalAuthenticationTemplate
                interactionType={InteractionType.Popup}
                authenticationRequest={authRequest}
                errorComponent={ErrorComponent}
                loadingComponent={Loading}
            >
                <ProfileContent />
            </MsalAuthenticationTemplate>
        );
    }
}

export const ProfileRawContext = Profile
