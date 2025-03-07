"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import {
    ICustomAuthPublicClientApplication,
    CustomAuthPublicClientApplication,
    AuthFlowStateBase,
} from "@azure/msal-custom-auth";

interface AuthContextType {
    app: ICustomAuthPublicClientApplication | undefined;
    setApp: React.Dispatch<
        React.SetStateAction<ICustomAuthPublicClientApplication | undefined>
    >;
    authState: AuthFlowStateBase | undefined; // Replace 'any' with your stateData type
    setAuthState: React.Dispatch<
        React.SetStateAction<AuthFlowStateBase | undefined>
    >;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [app, setApp] = useState<
        ICustomAuthPublicClientApplication | undefined
    >(undefined);
    const [authState, setAuthState] = useState<AuthFlowStateBase | undefined>(
        undefined
    );

    useEffect(() => {
        const initializeApp = async () => {
            const app = await CustomAuthPublicClientApplication.create({
                customAuth: {
                    challengeTypes: ["password", "oob", "redirect"],
                    authApiProxyUrl:
                        "https://myspafunctiont1.azurewebsites.net/api/ReverseProxy/",
                },
                auth: {
                    clientId: "d5e97fb9-24bb-418d-8e7a-4e1918303c92",
                    authority: "https://spasamples.ciamlogin.com/",
                    redirectUri: "/",
                },
                cache: {
                    cacheLocation: "sessionStorage",
                    storeAuthStateInCookie: false,
                },
            });
            setApp(app);
        };
        initializeApp();
    }, [setApp]);

    return (
        <AuthContext.Provider value={{ app, setApp, authState, setAuthState }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
