import React, { useMemo } from 'react';
import {
    ApplicationInsights, IExtendedConfiguration, IWebAnalyticsConfiguration
  } from '@ms/1ds-analytics-web-js';



const initializeTelemetry = () => {
    const appInsights = new ApplicationInsights();
    // Configure ApplicationInsights
    var instrumentationKey = "fc2e0ddd37df42e4a0889b5cc81f7f23-b4eb643d-e415-4f38-aa60-16e10044b0bf-7765";
    var webAnalyticsConfig: IWebAnalyticsConfiguration = {
      autoCapture: {
        pageView: true,
        click: true,
        scroll: true,
        onUnload: true
      }
    };
    var config: IExtendedConfiguration = {
      instrumentationKey: instrumentationKey,
      // Extra extensions
      extensions: [],
      webAnalyticsConfiguration: webAnalyticsConfig
    };

    //Initialize SDK
    appInsights.initialize(config, []);

    return appInsights;
}

const AppInsightsContext = React.createContext<ApplicationInsights | null>(null);

interface AppInsightsProviderProps {

}
export const AppInsightsProvider = ({children}: React.PropsWithChildren<AppInsightsProviderProps>) => {
    const appInsights = useMemo(() => initializeTelemetry(), []);

    return <AppInsightsContext.Provider value={appInsights}>
        {children}
    </AppInsightsContext.Provider>;
}

export const useAppInsights = () => React.useContext(AppInsightsContext);
