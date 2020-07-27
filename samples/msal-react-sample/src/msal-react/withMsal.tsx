import React from "react";
import PropTypes from "prop-types"

import { IMsalProps } from "./MsalContext";
import { useMsal } from "./MsalProvider";

export const IMsalPropType = PropTypes.shape({
    acquireTokenPopup: PropTypes.func.isRequired,
    acquireTokenRedirect: PropTypes.func.isRequired,
    acquireTokenSilent: PropTypes.func.isRequired,
    getAllAccounts: PropTypes.func.isRequired,
    getAccountByUsername: PropTypes.func.isRequired,
    handleRedirectPromise: PropTypes.func.isRequired,
    loginPopup: PropTypes.func.isRequired,
    loginRedirect: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired,
    ssoSilent: PropTypes.func.isRequired,
    isAuthenticated: PropTypes.bool.isRequired,
    accounts: PropTypes.array.isRequired
});

// References for HOC pattern:
//  https://react-typescript-cheatsheet.netlify.app/docs/hoc/intro
//  https://www.pluralsight.com/guides/higher-order-composition-typescript-react
export const withMsal = <P extends IMsalProps = IMsalProps>(Component: React.ComponentType<P>) => {
    const ComponentWithMsal: React.FunctionComponent<P> = (props) => {
        const msal = useMsal();
        return <Component {...props} msal={msal} />;
    };

    const componentName = Component.displayName || Component.name || "Component";
    ComponentWithMsal.displayName = `withMsal(${componentName})`;

    return ComponentWithMsal;
};
