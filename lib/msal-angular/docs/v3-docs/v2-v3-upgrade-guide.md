# Upgrading from MSAL Angular v2 to v3

MSAL Angular v3 brings our Angular wrapper up-to-date with the latest version of MSAL common, and with out-of-the-box support for Angular 15 and rxjs 7.

This guide will demonstrate changes needed to migrate an existing application from `@azure/msal-angular` v2 to v3.

## Breaking changes in `@azure/msal-browser@3`

- WAM Bridge: config allowNativeBroker
- Calling initialize before `handleRedirectObservable`
- What else?

## Angular 15 and rxjs@7

MSAL Angular now expects that your application is built with `@angular/core@15`, `@angular/common@15`, `rxjs@7`. As with MSAL Angular v2, `rxjs-compat` is not required.

Please follow the [Angular Update Guide](https://update.angular.io/) to update your application to Angular 15.

## Samples

We have put together a sample application for Angular 15. This sample demonstrates basic configuration and usage, and will be improved and added to incrementally. 

A sample for Angular 15 using B2C will be added shortly.

See [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v3-samples/README.md) for a list of the MSAL Angular v3 samples and the features demonstrated.