import React from "react";
import "./App.css";

import AuthProvider from "./AuthProvider";

class App extends React.Component {
    render() {
        return (
            <div>
                <section>
                    <p>
                        Welcome to the Microsoft Authentication Library For
                        Javascript - React Quickstart
                    </p>
                    {!this.props.account ? (
                        <button onClick={this.props.signIn}>Sign In</button>
                    ) : (
                        <>
                            <button onClick={this.props.signOut}>
                                Sign Out
                            </button>
                            <button onClick={this.props.readMail}>
                                Read Email
                            </button>
                        </>
                    )}
                </section>
                <section>
                    {this.props.account && (
                        <pre>{JSON.stringify(this.props.account, null, 4)}</pre>
                    )}
                    {this.props.graphData && (
                        <pre>
                            {JSON.stringify(this.props.graphData, null, 4)}
                        </pre>
                    )}
                </section>
            </div>
        );
    }
}

export default AuthProvider(App);
