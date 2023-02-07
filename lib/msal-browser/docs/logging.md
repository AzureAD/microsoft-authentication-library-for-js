# MSAL JS logging instructions

These are steps needed to enable MSAL JS logging for your applications:

1. In the MSAL [Configuration](./configuration.md) object, you can enable logging to collect msal js logs. We enable different levels of logging and an appropriate level can be chosen as needed. 

2. The logger options can be set as below, the example chooses `loglevel.trace`

```javascript

    ...
    ...

        system: {
        loggerOptions: {
            logLevel: msal.LogLevel.Trace,
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {	
                    return;	
                }
                switch (level) {	
                    case msal.LogLevel.Error:	
                        console.error(message);	
                        return;	
                    case msal.LogLevel.Info:	
                        console.info(message);	
                        return;	
                    case msal.LogLevel.Verbose:	
                        console.debug(message);	
                        return;	
                    case msal.LogLevel.Warning:	
                        console.warn(message);	
                        return;	
                    default:
                        console.log(message);
                        return;
                }
            }
        }
    }

```

An example usage in a sample can be accessed [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-browser-samples/VanillaJSTestApp2.0/app/default/authConfig.js#:~:text=logLevel%3A%20msal.LogLevel.Trace%2C).


3. Make sure you have the "Verbose" level enabled in your browser console to see these logs



