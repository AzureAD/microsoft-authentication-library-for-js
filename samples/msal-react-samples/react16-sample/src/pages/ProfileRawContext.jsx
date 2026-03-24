import { Component } from "react";

// Msal imports
import { MsalAuthenticationTemplate, MsalContext } from "@azure/msal-react";
import { InteractionType, InteractionStatus, InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest } from "../authConfig";

// Sample app imports
import { ProfileData } from "../ui-components/ProfileData";
import { Loading } from "../ui-components/Loading";
import { ErrorComponent } from "../ui-components/ErrorComponent";
import { callMsGraph } from "../utils/MsGraphApiCall";

// Material-ui imports
import Paper from "@material-ui/core/Paper";


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
    }

    setGraphData() {
        if (!this.state.graphData && this.context.inProgress === InteractionStatus.None) {
            callMsGraph().then(response => this.setState({graphData: response})).catch((e) => {
                if (e instanceof InteractionRequiredAuthError) {
                    this.context.instance.acquireTokenRedirect({
                        ...loginRequest,
                        account: this.context.instance.getActiveAccount()
                    });
                }
            });
        }
    }

    componentDidMount() {
        this.setGraphData();
    }

    componentDidUpdate() {
        this.setGraphData();
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
