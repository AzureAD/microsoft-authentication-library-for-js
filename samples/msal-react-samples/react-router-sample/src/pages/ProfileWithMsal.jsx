import { Component } from "react";

// Msal imports
import { MsalAuthenticationTemplate, withMsal } from "@azure/msal-react";
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
 * This class is a child component of "Profile". MsalContext is passed
 * down from the parent and available as a prop here.
 */
class ProfileContent extends Component {

    constructor(props) {
        super(props)

        this.state = {
            graphData: null,
        }
    }

    componentDidMount() {
        if (!this.state.graphData && this.props.msalContext.inProgress === InteractionStatus.None) {
            callMsGraph().then(response => this.setState({graphData: response})).catch((e) => {
                if (e instanceof InteractionRequiredAuthError) {
                    this.props.msalContext.instance.acquireTokenRedirect({
                        ...loginRequest,
                        account: this.props.msalContext.instance.getActiveAccount()
                    });
                }
            });
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
 * This class is using "withMsal" HOC and has access to authentication
 * state. It passes down the msalContext as a prop to its children.
 */
class Profile extends Component {

    render() {
        
        const authRequest = {
            ...loginRequest
        };

        return (
            <MsalAuthenticationTemplate 
                interactionType={InteractionType.Redirect} 
                authenticationRequest={authRequest} 
                errorComponent={ErrorComponent} 
                loadingComponent={Loading}
            >
                <ProfileContent msalContext={this.props.msalContext}/>
            </MsalAuthenticationTemplate>
        );
    }
}

// Wrap your class component to access authentication state as props
export const ProfileWithMsal = withMsal(Profile);