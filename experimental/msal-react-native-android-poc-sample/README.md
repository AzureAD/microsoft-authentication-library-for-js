# MSAL React Native Proof of Concept (Android) Sample App
This sample app demonstrates how access tokens retrieved using our MSAL React Native proof of concept can be used to make calls to Microsoft Graph API.

The user can type in their selected scopes (if no scopes are provided, "User.Read" is the default) and edit the Microsoft Graph URL. Once a user signs in, the user can choose to get graph data interactively or silently. The json results are shown at the bottom of the screen. 

## Instructions
If this is the first time running the app, run `npm install` in this directory.

To launch the app, run `react-native run-android`, which will start up a React Native instance and build the app. 

If React Native doesn't start, open a new console window and run `react-native start` and in the second window, `react-native run-android`.
