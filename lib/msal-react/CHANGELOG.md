# Change Log - @azure/msal-react

This log was last generated on Mon, 28 Jun 2021 23:39:48 GMT and should not be manually modified.

<!-- Start content -->

## 1.0.1

Mon, 28 Jun 2021 23:39:48 GMT

### Patches

- Change accounts context type to AccountInfo[] #3677 (thomas.norling@microsoft.com)

## 1.0.0

Thu, 13 May 2021 18:34:08 GMT

### Patches

- Move MSAL Angular v2 and MSAL React to GA (janutter@microsoft.com)

## 1.0.0-beta.3

Wed, 12 May 2021 18:35:03 GMT

### Changes

- Fix extra state update in useAccount hook #3527 (thomas.norling@microsoft.com)
- Prevent UnauthenticatedTemplate from rendering children while processing redirect response #3552 (thomas.norling@microsoft.com)

## 1.0.0-beta.2

Thu, 22 Apr 2021 23:26:08 GMT

### Changes

- Add .browserslistrc #3471 (thomas.norling@microsoft.com)

## 1.0.0-beta.1

Wed, 24 Mar 2021 22:55:46 GMT

### Changes

- Add support for logoutPopup #3044 (thomas.norling@microsoft.com)

## 1.0.0-beta.0

Wed, 03 Mar 2021 21:47:05 GMT

### Changes

- Remove InteractionStatus export (#3048) (thomas.norling@microsoft.com)

## 1.0.0-alpha.5

Tue, 09 Feb 2021 01:48:22 GMT

### Changes

- Check InteractionStatus in Authenticated/UnauthenticatedTemplate (#2996) (thomas.norling@microsoft.com)
- Fix version.json import errors (#2993) (thomas.norling@microsoft.com)

## 1.0.0-alpha.4

Tue, 02 Feb 2021 01:56:47 GMT

### Changes

- Get package version from version.json (#2915) (thomas.norling@microsoft.com)
- Use interactionStatus and inProgress from msal-browser (#2885) (joarroyo@microsoft.com)
- Pass SKU and version to msal-browser (#2845) (thomas.norling@microsoft.com)

## 1.0.0-alpha.3

Thu, 21 Jan 2021 21:48:01 GMT

### Changes

- Fix initial state values (#2865) (thomas.norling@microsoft.com)
- Add missing license files (janutter@microsoft.com)

## 1.0.0-alpha.2

Tue, 12 Jan 2021 00:51:26 GMT

### Changes

- Add logger (#2727) (thomas.norling@microsoft.com)
- Fix redirect loop when service returns error (#2762) (thomas.norling@microsoft.com)

## 1.0.0-alpha.1

Mon, 07 Dec 2020 22:19:03 GMT

### Changes

- Prevent unnecessary context updates (#2671) (thomas.norling@microsoft.com)
- Updating TestConstants.ts (prkanher@microsoft.com)
- Readme Updates (thomas.norling@microsoft.com)
- Fix Server/Client mismatch when using SSR (#2646) (thomas.norling@microsoft.com)
- useMsalAuthentication consumes response from login callback (#2610) (thomas.norling@microsoft.com)
- Update msal-react ssoSilent example (janutter@microsoft.com)
- Readme updates (#2592) (thomas.norling@microsoft.com)
