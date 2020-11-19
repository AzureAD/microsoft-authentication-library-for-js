import React from "react";
import PropTypes from "prop-types";
import AuthProvider from "./AuthProvider";

import "./App.css";

const Json = ({ data }) => <pre>{JSON.stringify(data, null, 4)}</pre>;

class App extends React.Component {
    static propTypes = {
        account: PropTypes.object,
        emailMessages: PropTypes.object,
        error: PropTypes.string,
        graphProfile: PropTypes.object,
        onSignIn: PropTypes.func.isRequired,
        onSignOut: PropTypes.func.isRequired,
        onRequestEmailToken: PropTypes.func.isRequired
    };

    render() {
        return (
            <div>
                <section>
                    <h1>
                        Welcome to the Microsoft Authentication Library For
                        Javascript - React Quickstart
                    </h1>
                    {!this.props.account ? (
                        <button onClick={this.props.onSignIn}>Sign In</button>
                    ) : (
                        <>
                            <button onClick={this.props.onSignOut}>
                                Sign Out
                            </button>
                            <button onClick={this.props.onRequestEmailToken}>
                                Request Email Permission
                            </button>
                        </>
                    )}
                    {this.props.error && (
                        <p className="error">Error: {this.props.error}</p>
                    )}
                </section>
                <section className="data">
                    {this.props.account && (
                        <div className="data-account">
                            <h2>Session Account Data</h2>
                            <Json data={this.props.account} />
                        </div>
                    )}
                    {this.props.graphProfile && (
                        <div className="data-graph">
                            <h2>Graph Profile Data</h2>
                            <Json data={this.props.graphProfile} />
                        </div>
                    )}
                    {this.props.emailMessages && (
                        <div className="data-graph">
                            <h2>Messages Data</h2>
                            <Json data={this.props.emailMessages} />
                        </div>
                    )}
                </section>
            </div>
        );
    }
}

export default AuthProvider(App);
