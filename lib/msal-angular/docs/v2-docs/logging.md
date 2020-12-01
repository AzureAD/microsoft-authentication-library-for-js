# Logging in MSAL Angular v2

The logger definition has the following properties:

1. correlationId
1. logLevel
    * logLevels include: `Error`, `Warning`, `Info`, and `Verbose`
1. piiLoggingEnabled

You can enable logging in your app as shown below:

```js
import { LogLevel } from '@azure/msal-browser';

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
                    logLevel: LogLevel.Info,
                    piiLoggingEnabled: true
                }
            }
        })
    ]
})
```

The `logger` can also be set dynamically by using `MsalService.setLogger()`.

```js
this.authService.setLogger(new Logger((logLevel, message, piiEnabled) => {
        console.log('MSAL Logging: ', message);
    },
    correlationId: CryptoUtils.createNewGuid(),
    piiLoggingEnabled: false
));
```
