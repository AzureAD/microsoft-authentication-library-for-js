# Experimental Configuration Options

The MSAL library exposes a set of experimental APIs that can be used to customize the behavior of your authentication flows. These options can be set in the constructor of the `ExperimentalPublicClientApplication` object. Here we describe the configuration object that can be passed into the `ExperimentalPublicClientApplication` constructor.

## Using the config object

The configuration object has the following structure, and can be passed into the `ExperimentalPublicClientApplication` constructor.

```javascript
export type ExperimentalConfiguration = {
    brokerOptions?: BrokerOptions;
};

/**
 * Broker Options
 */
export type BrokerOptions = {
    actAsBroker?: boolean;
    preferredInteractionType: InteractionType.Popup | InteractionType.Redirect | InteractionType.None | null;
    allowBrokering?: boolean;
    trustedBrokerDomains?: string[];
    brokerRedirectParams?: Pick<RedirectRequest, "redirectStartPage" | "onRedirectNavigate">;
};
```

For more information on the brokering options, see the [broker documentation](./broker.md).
