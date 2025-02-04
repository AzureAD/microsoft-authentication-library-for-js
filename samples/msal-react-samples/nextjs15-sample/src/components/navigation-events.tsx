'use client';
import React from "react";
import { useRouter } from 'next/navigation';
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication, EventType, AuthenticationResult } from "@azure/msal-browser";
import { msalConfig } from "../authConfig";
import { CustomNavigationClient } from "../utils/NavigationClient";

export const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.initialize().then(() => {
  // Account selection logic is app dependent. Adjust as needed for different use cases.
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && (event.payload as AuthenticationResult)?.account) {
      const account = (event.payload as AuthenticationResult).account;
      msalInstance.setActiveAccount(account);
    }
  });
});

export function pca() {
  // The next 3 lines are optional. This is how you configure MSAL to take advantage of the router's navigate functions when MSAL redirects between pages in your app
  const router = useRouter();
  const navigationClient = new CustomNavigationClient(router);
  msalInstance.setNavigationClient(navigationClient);
  return msalInstance;
}