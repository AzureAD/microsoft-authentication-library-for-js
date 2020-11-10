import React from "react";

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: ""
        };
    }

    componentDidCatch(e) {
        this.setState({
            hasError: true,
            error: e.errorCode
        });
    }

    render() {
        if (this.hasError) {
            return <h5>This is a protected page and the following error occurred during authentication: <strong>{this.state.error}</strong></h5>;
        }

        return this.props.children;
    }
}