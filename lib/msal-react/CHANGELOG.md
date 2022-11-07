# Change Log - @azure/msal-react

This log was last generated on Mon, 07 Nov 2022 22:46:55 GMT and should not be manually modified.

<!-- Start content -->

## 1.4.10

Mon, 07 Nov 2022 22:46:55 GMT

### Patches

- Bump @azure/msal-browser to v2.31.0

## 1.4.9

Mon, 10 Oct 2022 22:27:03 GMT

### Patches

- Bump @azure/msal-browser to v2.30.0

## 1.4.8

Mon, 03 Oct 2022 22:12:27 GMT

### Patches

- Bump @azure/msal-browser to v2.29.0

## 1.4.7

Mon, 12 Sep 2022 18:19:32 GMT

### Patches

- Bump @azure/msal-browser to v2.28.3

## 1.4.6

Fri, 02 Sep 2022 18:06:53 GMT

### Patches

- Bump @azure/msal-browser to v2.28.2

## 1.4.5

Mon, 01 Aug 2022 22:22:36 GMT

### Patches

- Bump @azure/msal-browser to v2.28.1

## 1.4.4

Mon, 18 Jul 2022 23:26:21 GMT

### Patches

- Bump @azure/msal-browser to v2.28.0

## 1.4.3

Tue, 05 Jul 2022 22:37:04 GMT

### Patches

- Bump @azure/msal-browser to v2.27.0

## 1.4.2

Mon, 13 Jun 2022 22:28:09 GMT

### Patches

- Bump @azure/msal-browser to v2.26.0

## 1.4.1

Mon, 06 Jun 2022 22:13:00 GMT

### Patches

- Bump @azure/msal-browser to v2.25.0

## 1.4.0

Mon, 02 May 2022 22:23:33 GMT

### Minor changes

- Add support for acquiring tokens from the native broker #4531 (thomas.norling@microsoft.com)
- Bump @azure/msal-browser to v2.24.0

### Patches

- Ensure MsalProvider doesnt rerender if inProgress or accounts do not change #4713 (janutter@microsoft.com)

## 1.3.2

Mon, 04 Apr 2022 21:12:41 GMT

### Patches

- Use React 17 for dev deps #4570 (janutter@microsoft.com)
- Bump @azure/msal-browser to v2.23.0

## 1.3.1

Mon, 07 Mar 2022 23:28:43 GMT

### Patches

- Update MsalProvider state values concurrently #4477 (thomas.norling@microsoft.com)
- Add react 18 as supported peer dependency #4546 (thomas.norling@microsoft.com)
- Bump @azure/msal-browser to v2.22.1

## 1.3.0

Tue, 08 Feb 2022 00:41:07 GMT

### Minor changes

- useMsalAuthentication hook acquires a token if user is already signed in #4280 (thomas.norling@microsoft.com)
- Bump @azure/msal-browser to v2.22.0

## 1.2.0

Tue, 04 Jan 2022 00:20:29 GMT

### Minor changes

- Bump @azure/msal-browser to v2.21.0

## 1.1.2

Tue, 07 Dec 2021 00:17:01 GMT

### Patches

- Fix inProgress stuck in startup state #4302 (thomas.norling@microsoft.com)
- Bump @azure/msal-browser to v2.20.0

## 1.1.1

Mon, 01 Nov 2021 23:53:22 GMT

### Patches

- Support React version 16.8.0+ (thomas.norling@microsoft.com)
- Bump @azure/msal-browser to v2.19.0

## 1.1.0

Mon, 04 Oct 2021 23:12:35 GMT

### Minor changes

- Update account state when user logs in or out from a different tab or window #3981 (thomas.norling@microsoft.com)
- Bump @azure/msal-browser to v2.18.0

### Patches

- Export library version #4124 (thomas.norling@microsoft.com)

## 1.0.2

Tue, 07 Sep 2021 23:22:24 GMT

### Patches

- Fix inProgress state bug when returning from a redirect #4013 (thomas.norling@microsoft.com)

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
