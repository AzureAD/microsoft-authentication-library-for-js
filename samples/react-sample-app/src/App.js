import React from "react";
import PropTypes from "prop-types";
import AuthProvider from "./AuthProvider";

import "./App.css";

const Json = ({ data }) => <pre>{JSON.stringify(data, null, 4)}</pre>;

const App = props => {
  return (
    <div>
      <section>
        <h1>
          Welcome to the Microsoft Authentication Library For Javascript - React
          Quickstart
        </h1>
        {!props.account ? (
          <button onClick={props.onSignIn}>Sign In</button>
        ) : (
          <>
            <button onClick={props.onSignOut}>Sign Out</button>
            <button onClick={props.onRequestEmailToken}>
              * Request Email Permission
            </button>
          </>
        )}
        {props.error && <p className="error">Error: {props.error}</p>}
      </section>
      <section className="data">
        {props.account && (
          <div className="data-account">
            <h2>Session Account Data</h2>
            <Json data={props.account} />
          </div>
        )}
        {props.graphProfile && (
          <div className="data-graph">
            <h2>Graph Profile Data</h2>
            <Json data={props.graphProfile} />
          </div>
        )}
        {props.emailMessages && (
          <div className="data-graph">
            <h2>Messages Data</h2>
            <Json data={props.emailMessages} />
          </div>
        )}
      </section>
    </div>
  );
};

App.propTypes = {
  account: PropTypes.object,
  emailMessages: PropTypes.object,
  error: PropTypes.string,
  graphProfile: PropTypes.object,
  onSignIn: PropTypes.func.isRequired,
  onSignOut: PropTypes.func.isRequired,
  onRequestEmailToken: PropTypes.func.isRequired
};

export default AuthProvider(App);