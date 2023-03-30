# MSAL.js for Office Addin - Task Pane, Excel, React, TypeScript

## About this sample

This sample was bootstrapped using the yeoman Office addin generator.  For more information checkout the links below:

- https://learn.microsoft.com/en-us/office/dev/add-ins/develop/yeoman-generator-overview
- https://github.com/OfficeDev/generator-office
- Project Template For Yo Office: https://github.com/OfficeDev/Office-Addin-TaskPane-React

> NOTE: These are the templates as of Today March 30 2023 - New Templates, including templates demonstrating the use of MSAL.js in Office Addins are likely to come in the future.

### (Optional) MSAL React and class components

For a demonstration of how to use MSAL React with class components, see: `./src/pages/ProfileWithMsal.jsx` and `./src/pages/ProfileRawContext.jsx`.

*After* you initialize `MsalProvider`, there are 3 approaches you can take to protect your class components with MSAL React:

1. Wrap each component that you want to protect with `withMsal` higher-order component (HOC) (e.g. [Profile](./src/pages/ProfileWithMsal.jsx#Profile)).
1. Consume the raw context directly (e.g. [ProfileContent](./src/pages/ProfileRawContext.jsx#ProfileContent)).
1. Pass context down from a parent component that has access to the `msalContext` via one of the other means above (e.g. [ProfileContent](./src/pages/ProfileWithMsal.jsx#ProfileContent)).

For more information, visit:

- [Docs: Class Components](../../../lib/msal-react/docs/class-components.md)
- [MSAL React FAQ](../../../lib/msal-react/FAQ.md)

## How to run the sample

### Pre-requisites

- Ensure [all pre-requisites](../../../lib/msal-react/README.md#prerequisites) have been completed to run `@azure/msal-react`.
- Install node.js if needed (<https://nodejs.org/en/>).

### Configure the application

- Open `./src/authConfig.js` in an editor.
- Replace client id with the Application (client) ID from the portal registration, or use the currently configured lab registration.
  - Optionally, you may replace any of the other parameters, or you can remove them and use the default values.

#### Install dependencies for sample

##### Installing @azure/msal-react and @azure/msal-browser from released versions available on npm

```bash
# Change directory to sample directory
cd samples/msal-react-samples/office-addin-sample

# Install rest of dependencies
npm install
```

#### Running the sample development server

Running the following command will:

```bash
# Run the Addin
npm run start
```

- Build the addin using webpack
- Prompt to install a certificate to enable HTTPS
- Serve the addin using a local web server 
- Open Excel
- Register the Addin with excel via the included manifest.xml file

### Debugging

Office Addins run as web applications.  Depending on your version of Office you'll either be debugging in the context of Edge Legacy or Edge Chromium.  More information can be found below:

- https://learn.microsoft.com/en-us/office/dev/add-ins/testing/debug-with-vs-extension
- https://learn.microsoft.com/en-us/office/dev/add-ins/testing/debug-desktop-using-edge-chromium

