import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { MsalProvider } from './msal-react';

import { BrowserRouter as Router } from "react-router-dom";

import { Configuration } from "@azure/msal-browser";

const configuration: Configuration = {
    auth: {
        clientId: "05675e30-ff45-4c75-addb-8461cfcf99d2",
        authority: "https://login.microsoftonline.com/common/",
    }
}

// TODO: guidance / mitigations for double renders in React.StrictMode

ReactDOM.render(
  <Router>
      <MsalProvider configuration={configuration}>
        <App />
      </MsalProvider>
  </Router>,
  document.getElementById('root')
);

// const AppProvider = withMsal(configuration)(App);
// ReactDOM.render(<AppProvider />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
