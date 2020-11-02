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
            error: e
        });
    }

    render() {
        if (this.hasError) {
            return <h5>Error: {this.error}</h5>
        }

        return this.props.children;
    }
}