// From Material-ui nextjs sample https://github.com/mui-org/material-ui/tree/master/examples/nextjs

import React from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from "@emotion/react";
import createEmotionCache from "../src/styles/createEmotionCache";
import theme from '../src/styles/theme';

import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { msalConfig } from "../src/authConfig";
import { PageLayout } from "../src/ui-components/PageLayout";
import Grid from "@mui/material/Grid";
import { CustomNavigationClient } from "../src/utils/NavigationClient";

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.initialize().then(() => {
  // Account selection logic is app dependent. Adjust as needed for different use cases.
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
      const account = event.payload.account;
      msalInstance.setActiveAccount(account);
    }
  });
});

export default function MyApp({ Component, emotionCache = clientSideEmotionCache, pageProps }) {
  // The next 3 lines are optional. This is how you configure MSAL to take advantage of the router's navigate functions when MSAL redirects between pages in your app
  const router = useRouter();
  const navigationClient = new CustomNavigationClient(router);
  msalInstance.setNavigationClient(navigationClient);

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <title>MSAL-React Next.js Sample</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <MsalProvider instance={msalInstance}>
            <PageLayout>
              <Grid container justifyContent="center">
                <Component {...pageProps} />
              </Grid>
            </PageLayout>
        </MsalProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  emotionCache: PropTypes.object,
  pageProps: PropTypes.object.isRequired,
};
