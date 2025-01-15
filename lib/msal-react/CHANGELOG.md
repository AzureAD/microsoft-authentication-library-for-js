# Change Log - @azure/msal-react

<!-- This log was last generated on Wed, 15 Jan 2025 05:05:17 GMT and should not be manually modified. -->

<!-- Start content -->

## 3.0.1

Wed, 15 Jan 2025 05:05:17 GMT

### Breaking Changes

- Update msal-browser peer dependency to include v4 (thomas.norling@microsoft.com)
- Rename `native` to `platformBroker` in public API and docs (sameera.gajjarapu@microsoft.com)
- Bump @azure/msal-browser to v4.0.1

- Please see the msal-browser [migration guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v3-migration.md) for more details on what's changed in v4.

## 2.2.0

Tue, 05 Nov 2024 18:58:46 GMT

### Minor changes

- Bump @azure/msal-browser to v3.27.0
- Bump eslint-config-msal to v0.0.0

## 2.1.1

Thu, 03 Oct 2024 00:40:42 GMT

### Patches

- Bump @azure/msal-browser to v3.25.0
- Bump eslint-config-msal to v0.0.0

## 2.1.0

Thu, 19 Sep 2024 23:48:30 GMT

### Minor changes

- Fix type resolution when using moduleResolution node16 (thomas.norling@microsoft.com)
- Bump @azure/msal-browser to v3.24.0
- Bump eslint-config-msal to v0.0.0

## 2.0.22

Tue, 23 Jul 2024 14:19:34 GMT

### Patches

- Bump @azure/msal-browser to v3.20.0
- Bump eslint-config-msal to v0.0.0

## 2.0.21

Tue, 16 Jul 2024 18:22:27 GMT

### Patches

- Bump @azure/msal-browser to v3.19.1
- Bump eslint-config-msal to v0.0.0

## 2.0.20

Mon, 01 Jul 2024 19:18:29 GMT

### Patches

- Bump @azure/msal-browser to v3.18.0
- Bump eslint-config-msal to v0.0.0

## 2.0.19

Mon, 10 Jun 2024 22:30:36 GMT

### Patches

- Bump @azure/msal-browser to v3.17.0
- Bump eslint-config-msal to v0.0.0

## 2.0.18

Tue, 04 Jun 2024 00:08:57 GMT

### Patches

- Bump @azure/msal-browser to v3.16.0
- Bump eslint-config-msal to v0.0.0

## 2.0.17

Tue, 28 May 2024 21:37:23 GMT

### Patches

- Bump @azure/msal-browser to v3.15.0
- Bump eslint-config-msal to v0.0.0

## 2.0.16

Mon, 06 May 2024 23:48:17 GMT

### Patches

- Fix useIsAuthenticated returning incorrect value during useEffect update #7057 (kade@hatchedlabs.com)
- Bump @azure/msal-browser to v3.14.0
- Bump eslint-config-msal to v0.0.0

## 2.0.15

Thu, 11 Apr 2024 21:46:57 GMT

### Patches

- Bump @azure/msal-browser to v3.13.0
- Bump eslint-config-msal to v0.0.0

## 2.0.14

Wed, 27 Mar 2024 18:41:17 GMT

### Patches

- Bump @azure/msal-browser to v3.11.1
- Bump eslint-config-msal to v0.0.0

## 2.0.13

Fri, 22 Mar 2024 20:32:39 GMT

### Patches

- Bump @azure/msal-browser to v3.11.0
- Bump eslint-config-msal to v0.0.0

## 2.0.12

Sat, 17 Feb 2024 01:49:06 GMT

### Patches

- Bump @azure/msal-browser to v3.10.0
- Bump eslint-config-msal to v0.0.0

## 2.0.11

Wed, 07 Feb 2024 22:00:37 GMT

### Patches

- Bump @azure/msal-browser to v3.9.0
- Bump eslint-config-msal to v0.0.0

## 2.0.10

Tue, 23 Jan 2024 00:06:05 GMT

### Patches

- Bump @azure/msal-browser to v3.7.1

## 2.0.9

Tue, 09 Jan 2024 00:03:25 GMT

### Patches

- Bump @azure/msal-browser to v3.7.0

## 2.0.8

Fri, 01 Dec 2023 18:46:06 GMT

### Patches

- Move build dependencies to devDependencies (thomas.norling@microsoft.com)
- Bump @azure/msal-browser to v3.6.0

## 2.0.7

Tue, 07 Nov 2023 00:01:51 GMT

### Patches

- Bump @azure/msal-browser to v3.5.0

## 2.0.6

Mon, 30 Oct 2023 21:38:25 GMT

### Patches

- Bump @azure/msal-browser to v3.4.0

## 2.0.5

Wed, 18 Oct 2023 17:24:19 GMT

### Patches

- Bump @azure/msal-browser to v3.3.0

## 2.0.4

Thu, 05 Oct 2023 18:06:40 GMT

### Patches

-   Bump @azure/msal-browser to v3.2.0

## 2.0.3

Tue, 05 Sep 2023 22:13:47 GMT

### Patches

-   Add a linter rule to avoid floating promises #6421 (sameera.gajjarapu@microsoft.com)
-   Fix for source-map related errors #6398 (lalimasharda@microsoft.com)
-   Bump @azure/msal-browser to v3.1.0

## 2.0.2

Fri, 18 Aug 2023 18:40:02 GMT

### Patches

-   Bump @azure/msal-browser to v3.0.2

## 2.0.1

Fri, 11 Aug 2023 19:00:45 GMT

### Patches

-   Bump @azure/msal-browser to v3.0.1

## 2.0.0

Mon, 07 Aug 2023 18:15:15 GMT

#### Major changes

-   Rebase dev onto v3 #5843 (kshabelko@microsoft.com)
-   Drop TSDX in favor of using rollup & jest directly #5895 (thomas.norling@microsoft.com)
-   Bump @azure/msal-browser to v3.0.0

### Minor changes

-   Add exports to package.json and update type to module #6194 (thomas.norling@microsoft.com)
-   Fix module field in package.json #6190 (thomas.norling@microsoft.com)
-   Switch from enums to object literals to reduce the bundle size #6068 (kshabelko@microsoft.com)

## 1.5.7

Mon, 01 May 2023 20:47:44 GMT

### Patches

-   Bump @azure/msal-browser to v2.36.0

## 1.5.5

Mon, 03 Apr 2023 21:29:32 GMT

### Patches

-   Bump @azure/msal-browser to v2.35.0

## 1.5.4

Tue, 07 Mar 2023 16:48:52 GMT

### Patches

-   Bump @azure/msal-browser to v2.34.0

## 1.5.3

Mon, 06 Feb 2023 18:51:51 GMT

### Patches

-   Bump @azure/msal-browser to v2.33.0

## 1.5.2

Mon, 09 Jan 2023 22:44:58 GMT

### Patches

-   Bump @azure/msal-browser to v2.32.2

## 1.5.1

Wed, 07 Dec 2022 16:53:07 GMT

### Patches

-   Bump @azure/msal-browser to v2.32.1

## 1.5.0

Mon, 21 Nov 2022 19:14:45 GMT

### Minor changes

-   Bump @azure/msal-browser to v2.32.0

### Patches

-   Fix SSR hydration errors #5399 (thomas.norling@microsoft.com)
-   Fix state update on unmounted component #5396 (thomas.norling@microsoft.com)

## 1.4.10

Mon, 07 Nov 2022 22:46:55 GMT

### Patches

-   Bump @azure/msal-browser to v2.31.0

## 1.4.9

Mon, 10 Oct 2022 22:27:03 GMT

### Patches

-   Bump @azure/msal-browser to v2.30.0

## 1.4.8

Mon, 03 Oct 2022 22:12:27 GMT

### Patches

-   Bump @azure/msal-browser to v2.29.0

## 1.4.7

Mon, 12 Sep 2022 18:19:32 GMT

### Patches

-   Bump @azure/msal-browser to v2.28.3

## 1.4.6

Fri, 02 Sep 2022 18:06:53 GMT

### Patches

-   Bump @azure/msal-browser to v2.28.2

## 1.4.5

Mon, 01 Aug 2022 22:22:36 GMT

### Patches

-   Bump @azure/msal-browser to v2.28.1

## 1.4.4

Mon, 18 Jul 2022 23:26:21 GMT

### Patches

-   Bump @azure/msal-browser to v2.28.0

## 1.4.3

Tue, 05 Jul 2022 22:37:04 GMT

### Patches

-   Bump @azure/msal-browser to v2.27.0

## 1.4.2

Mon, 13 Jun 2022 22:28:09 GMT

### Patches

-   Bump @azure/msal-browser to v2.26.0

## 1.4.1

Mon, 06 Jun 2022 22:13:00 GMT

### Patches

-   Bump @azure/msal-browser to v2.25.0

## 1.4.0

Mon, 02 May 2022 22:23:33 GMT

### Minor changes

-   Add support for acquiring tokens from the native broker #4531 (thomas.norling@microsoft.com)
-   Bump @azure/msal-browser to v2.24.0

### Patches

-   Ensure MsalProvider doesnt rerender if inProgress or accounts do not change #4713 (janutter@microsoft.com)

## 1.3.2

Mon, 04 Apr 2022 21:12:41 GMT

### Patches

-   Use React 17 for dev deps #4570 (janutter@microsoft.com)
-   Bump @azure/msal-browser to v2.23.0

## 1.3.1

Mon, 07 Mar 2022 23:28:43 GMT

### Patches

-   Update MsalProvider state values concurrently #4477 (thomas.norling@microsoft.com)
-   Add react 18 as supported peer dependency #4546 (thomas.norling@microsoft.com)
-   Bump @azure/msal-browser to v2.22.1

## 1.3.0

Tue, 08 Feb 2022 00:41:07 GMT

### Minor changes

-   useMsalAuthentication hook acquires a token if user is already signed in #4280 (thomas.norling@microsoft.com)
-   Bump @azure/msal-browser to v2.22.0

## 1.2.0

Tue, 04 Jan 2022 00:20:29 GMT

### Minor changes

-   Bump @azure/msal-browser to v2.21.0

## 1.1.2

Tue, 07 Dec 2021 00:17:01 GMT

### Patches

-   Fix inProgress stuck in startup state #4302 (thomas.norling@microsoft.com)
-   Bump @azure/msal-browser to v2.20.0

## 1.1.1

Mon, 01 Nov 2021 23:53:22 GMT

### Patches

-   Support React version 16.8.0+ (thomas.norling@microsoft.com)
-   Bump @azure/msal-browser to v2.19.0

## 1.1.0

Mon, 04 Oct 2021 23:12:35 GMT

### Minor changes

-   Update account state when user logs in or out from a different tab or window #3981 (thomas.norling@microsoft.com)
-   Bump @azure/msal-browser to v2.18.0

### Patches

-   Export library version #4124 (thomas.norling@microsoft.com)

## 1.0.2

Tue, 07 Sep 2021 23:22:24 GMT

### Patches

-   Fix inProgress state bug when returning from a redirect #4013 (thomas.norling@microsoft.com)

## 1.0.1

Mon, 28 Jun 2021 23:39:48 GMT

### Patches

-   Change accounts context type to AccountInfo[] #3677 (thomas.norling@microsoft.com)

## 1.0.0

Thu, 13 May 2021 18:34:08 GMT

### Patches

-   Move MSAL Angular v2 and MSAL React to GA (janutter@microsoft.com)

## 1.0.0-beta.3

Wed, 12 May 2021 18:35:03 GMT

### Changes

-   Fix extra state update in useAccount hook #3527 (thomas.norling@microsoft.com)
-   Prevent UnauthenticatedTemplate from rendering children while processing redirect response #3552 (thomas.norling@microsoft.com)

## 1.0.0-beta.2

Thu, 22 Apr 2021 23:26:08 GMT

### Changes

-   Add .browserslistrc #3471 (thomas.norling@microsoft.com)

## 1.0.0-beta.1

Wed, 24 Mar 2021 22:55:46 GMT

### Changes

-   Add support for logoutPopup #3044 (thomas.norling@microsoft.com)

## 1.0.0-beta.0

Wed, 03 Mar 2021 21:47:05 GMT

### Changes

-   Remove InteractionStatus export (#3048) (thomas.norling@microsoft.com)

## 1.0.0-alpha.5

Tue, 09 Feb 2021 01:48:22 GMT

### Changes

-   Check InteractionStatus in Authenticated/UnauthenticatedTemplate (#2996) (thomas.norling@microsoft.com)
-   Fix version.json import errors (#2993) (thomas.norling@microsoft.com)

## 1.0.0-alpha.4

Tue, 02 Feb 2021 01:56:47 GMT

### Changes

-   Get package version from version.json (#2915) (thomas.norling@microsoft.com)
-   Use interactionStatus and inProgress from msal-browser (#2885) (joarroyo@microsoft.com)
-   Pass SKU and version to msal-browser (#2845) (thomas.norling@microsoft.com)

## 1.0.0-alpha.3

Thu, 21 Jan 2021 21:48:01 GMT

### Changes

-   Fix initial state values (#2865) (thomas.norling@microsoft.com)
-   Add missing license files (janutter@microsoft.com)

## 1.0.0-alpha.2

Tue, 12 Jan 2021 00:51:26 GMT

### Changes

-   Add logger (#2727) (thomas.norling@microsoft.com)
-   Fix redirect loop when service returns error (#2762) (thomas.norling@microsoft.com)

## 1.0.0-alpha.1

Mon, 07 Dec 2020 22:19:03 GMT

### Changes

-   Prevent unnecessary context updates (#2671) (thomas.norling@microsoft.com)
-   Updating TestConstants.ts (prkanher@microsoft.com)
-   Readme Updates (thomas.norling@microsoft.com)
-   Fix Server/Client mismatch when using SSR (#2646) (thomas.norling@microsoft.com)
-   useMsalAuthentication consumes response from login callback (#2610) (thomas.norling@microsoft.com)
-   Update msal-react ssoSilent example (janutter@microsoft.com)
-   Readme updates (#2592) (thomas.norling@microsoft.com)
