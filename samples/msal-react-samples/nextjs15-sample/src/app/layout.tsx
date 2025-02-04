'use client';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Suspense } from 'react'
import { pca } from '../components/navigation-events'

import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from "@emotion/react";
import createEmotionCache from "../styles/createEmotionCache";
import theme from '../styles/theme';

import { MsalProvider } from "@azure/msal-react";
import { PageLayout } from "../ui-components/PageLayout";
import Grid from "@mui/material/Grid2";

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <CacheProvider value={clientSideEmotionCache}>
            <ThemeProvider theme={theme}>
              {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
              <CssBaseline />
              <MsalProvider instance={pca()}>
                <PageLayout>
                  <Grid container justifyContent="center">
                    {children}
                  </Grid>
                </PageLayout>
              </MsalProvider>
            </ThemeProvider>
          </CacheProvider>
       </Suspense>
      </body>
    </html>
  )
}