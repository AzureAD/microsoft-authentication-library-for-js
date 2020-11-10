# Logging in MSAL Angular v1

The logger definition has the following properties. Please see the config section for more details on their use:

1. correlationId
2. level
3. piiLoggingEnabled

You can enable logging in your app as shown below:

```js
export function loggerCallback(logLevel, message, piiEnabled) {
    console.log(message);
}

@NgModule({
    imports: [ MsalModule.forRoot({
        auth: {
            clientId: 'Your client ID',
        },
        system: {
            logger: new Logger(loggerCallback, {
                correlationId: '1234',
                level: LogLevel.Verbose,
                piiLoggingEnabled: true,
            }),
        }
    })]
})
```
