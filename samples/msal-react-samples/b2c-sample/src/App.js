import { useEffect } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
// Material-UI imports
import { ThemeProvider } from '@material-ui/core/styles';
import Grid from "@material-ui/core/Grid";
import { theme } from "./styles/theme";

// MSAL imports
import { MsalProvider, useMsal } from "@azure/msal-react";
import { EventType, InteractionType } from "@azure/msal-browser";

// Sample app imports
import { PageLayout } from "./ui-components/PageLayout";
import { Home } from "./pages/Home";
import { Protected } from "./pages/Protected";
import { forgotPasswordRequest } from "./authConfig.js";

function App({ pca }) {

	return (
		<Router>
			<ThemeProvider theme={theme}>
				<MsalProvider instance={pca}>
					<PageLayout>
						<Grid container justify="center">
							<Pages />
						</Grid>
					</PageLayout>
				</MsalProvider>
			</ThemeProvider>
		</Router>
	);
}

function Pages() {
	const { instance } = useMsal();
	useEffect(() => {
		const callbackId = instance.addEventCallback((event) => {
			if (event.eventType === EventType.LOGIN_FAILURE) {
				if (event.error && event.error.errorMessage.indexOf("AADB2C90118") > -1) {
					if (event.interactionType === InteractionType.Redirect) {
						instance.loginRedirect(forgotPasswordRequest);
					} else if (event.interactionType === InteractionType.Popup) {
						instance.loginPopup(forgotPasswordRequest).catch(e => {
							return;
						});
					}
				}
			}
		});

		return () => {
			if (callbackId) {
				instance.removeEventCallback(callbackId);
			}
		};
	}, []);

	return (
		<Switch>
			<Route path="/protected">
				<Protected />
			</Route>
			<Route path="/">
				<Home />
			</Route>
		</Switch>
	)
}

export default App;
