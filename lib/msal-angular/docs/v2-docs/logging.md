# Logging in MSAL Angular v2

The logger definition has the following properties:

1. correlationId
2. logLevel
3. piiLoggingEnabled

You can enable logging in your app as shown below:

```js
export function loggerCallback(logLevel, message) {
    console.log(message);
}

@NgModule({
    imports: [ 
        MsalModule.forRoot({
            auth: {
                clientId: 'Your client ID',
            },
            system: {
                loggerOptions: {
                    loggerCallback,
                    level: LogLevel.Verbose,
                    piiLoggingEnabled: true
                }
            }
        })
    ]
})
```

The `logger` can also be set dynamically by using `MsalService.setLogger()`.

```js
this.authService.setLogger(
    (logLevel, message, piiEnabled) => {
        console.log('MSAL Logging: ', message);
    },
    correlationId: CryptoUtils.createNewGuid(),
    piiLoggingEnabled: false
);
```
