# Change Log - @azure/msal-node-extensions

This log was last generated on Tue, 05 Nov 2024 18:58:46 GMT and should not be manually modified.

<!-- Start content -->

## 1.4.0

Tue, 05 Nov 2024 18:58:46 GMT

### Minor changes

- Bump @azure/msal-common to v14.16.0
- Bump eslint-config-msal to v0.0.0
- Bump rollup-msal to v0.0.0

## 1.3.0

Tue, 08 Oct 2024 16:51:05 GMT

### Minor changes

- Fix POP token acquisition via MsalRuntime (thomas.norling@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump rollup-msal to v0.0.0

## 1.2.0

Thu, 19 Sep 2024 23:48:30 GMT

### Minor changes

- Fix type resolution when using moduleResolution node16 (thomas.norling@microsoft.com)
- Bump @azure/msal-common to v14.15.0
- Bump eslint-config-msal to v0.0.0
- Bump rollup-msal to v0.0.0

## 1.1.0

Tue, 23 Jul 2024 14:19:34 GMT

### Minor changes

- Track MSAL node SKU for broker flows #7213 (kshabelko@microsoft.com)
- Bump @azure/msal-common to v14.14.0
- Bump eslint-config-msal to v0.0.0

## 1.0.21

Tue, 16 Jul 2024 18:22:27 GMT

### Patches

- Bump @azure/msal-common to v14.13.1
- Bump eslint-config-msal to v0.0.0

## 1.0.20

Mon, 01 Jul 2024 19:18:29 GMT

### Patches

- Bump @azure/msal-common to v14.13.0
- Bump eslint-config-msal to v0.0.0

## 1.0.19

Mon, 10 Jun 2024 22:30:36 GMT

### Patches

- Bump @azure/msal-common to v14.12.0
- Bump eslint-config-msal to v0.0.0

## 1.0.18

Tue, 04 Jun 2024 00:08:57 GMT

### Patches

- Bump @azure/msal-common to v14.11.0
- Bump eslint-config-msal to v0.0.0

## 1.0.17

Tue, 28 May 2024 21:37:23 GMT

### Patches

- Bump eslint-config-msal to v0.0.0

## 1.0.16

Mon, 06 May 2024 23:48:17 GMT

### Patches

- Bump @azure/msal-common to v14.10.0
- Bump eslint-config-msal to v0.0.0

## 1.0.15

Thu, 11 Apr 2024 21:46:57 GMT

### Patches

- Add install script to workaround regression in npm version 10.4.0 (thomas.norling@microsoft.com)
- Bump @azure/msal-common to v14.9.0
- Bump eslint-config-msal to v0.0.0

## 1.0.14

Wed, 27 Mar 2024 18:41:17 GMT

### Patches

- Bump @azure/msal-common to v14.8.1
- Bump eslint-config-msal to v0.0.0

## 1.0.13

Fri, 22 Mar 2024 20:32:39 GMT

### Patches

- Bump @azure/msal-common to v14.8.0
- Bump eslint-config-msal to v0.0.0

## 1.0.12

Sat, 17 Feb 2024 01:49:06 GMT

### Patches

- Bump @azure/msal-common to v14.7.1
- Bump eslint-config-msal to v0.0.0

## 1.0.11

Wed, 07 Feb 2024 22:00:37 GMT

### Patches

- Bump @azure/msal-common to v14.7.0
- Bump eslint-config-msal to v0.0.0

## 1.0.10

Tue, 23 Jan 2024 00:06:05 GMT

### Patches

- Create require when it is not defined in MJS (altinokd@microsoft.com)
- Bump @azure/msal-common to v14.6.1

## 1.0.9

Tue, 09 Jan 2024 00:03:25 GMT

### Patches

- Set engines field to >=16 (thomas.norling@microsoft.com)
- Bump @azure/msal-common to v14.6.0

## 1.0.8

Fri, 01 Dec 2023 18:46:06 GMT

### Patches

- add Node 16 to engines (thomas.norling@microsoft.com)
- Bump @azure/msal-common to v14.5.0

## 1.0.7

Tue, 07 Nov 2023 00:01:50 GMT

### Patches

- fix: Environment.getUserRootDirectory() only ever executes Windows code path (janusz@corechain.tech)
- Bump @azure/msal-common to v14.4.0

## 1.0.6

Mon, 30 Oct 2023 21:38:25 GMT

### Patches

- Fix downstream ESM imports, fixes #6573 (janusz@corechain.tech)
- Bump @azure/msal-common to v14.3.0

## 1.0.5

Wed, 18 Oct 2023 17:24:19 GMT

### Patches

- Bump @azure/msal-common to v14.2.0

## 1.0.4

Thu, 05 Oct 2023 18:06:40 GMT

### Patches

-   Refactor ClientAuthError for reduced size #6433 (thomas.norling@microsoft.com)
-   Refactor ClientConfigurationError #6471 (thomas.norling@microsoft.com)
-   Bump @azure/msal-common to v14.1.0

## 1.0.3

Tue, 05 Sep 2023 22:13:48 GMT

### Patches

-   Bump @azure/msal-common to v14.0.3

## 1.0.2

Fri, 18 Aug 2023 18:40:02 GMT

### Patches

-   Bump @azure/msal-common to v14.0.2

## 1.0.1

Fri, 11 Aug 2023 19:00:44 GMT

### Patches

-   Update dist settings for packages #6322 (hemoral@microsoft.com)
-   Bump @azure/msal-common to v14.0.1

## 1.0.0

Mon, 07 Aug 2023 18:15:15 GMT

### Patches

-   Bump @azure/msal-common to v14.0.0

### Changes

-   Add exports to package.json and update type to module #6194 (thomas.norling@microsoft.com)

## 1.0.0-beta.1

Thu, 06 Jul 2023 00:01:33 GMT

### Changes

-   Bump @azure/msal-common to v14.0.0-beta.1

## 1.0.0-beta.0

Thu, 15 Jun 2023 22:19:25 GMT

### Changes

-   Include prebuilt binaries (thomas.norling@microsoft.com)
-   Drop TSDX in favor of using rollup & jest directly #5893 (thomas.norling@microsoft.com)
-   enable strict type checking (thomas.norling@microsoft.com)
-   Bump typescript version to 4.9.5 #5750 (kshabelko@microsoft.com)
-   Switch from enums to object literals to reduce the bundle size #6068 (kshabelko@microsoft.com)
-   Fix response expiresOn property (thomas.norling@microsoft.com)
-   Revert to common as a regular dependency #5985 (hemoral@microsoft.com)
-   Bump @azure/msal-common to v14.0.0-beta.0

## 1.0.0-alpha.34

Mon, 01 May 2023 20:47:42 GMT

### Changes

-   Update token expiry (thomas.norling@microsoft.com)
-   Bump @azure/msal-common to v13.0.0

## 1.0.0-alpha.32

Mon, 03 Apr 2023 21:29:32 GMT

### Changes

-   Bump @azure/msal-common to v12.0.0

## 1.0.0-alpha.31

Tue, 07 Mar 2023 16:48:52 GMT

### Changes

-   Expose NativeBrokerPlugin #5485 (thomas.norling@microsoft.com)
-   Bump @azure/msal-common to v11.0.0

## 1.0.0-alpha.30

Mon, 06 Feb 2023 18:51:50 GMT

### Changes

-   Add Logging options to IPersistenceConfiguration #5626 (fredrik.rasch@gmail.com)
-   Include packageMetadata in bundle #5638 (thomas.norling@microsoft.com)
-   Bump @azure/msal-common to v10.0.0

## 1.0.0-alpha.29

Mon, 09 Jan 2023 22:44:58 GMT

### Changes

-   Bump @azure/msal-common to v9.0.2

## 1.0.0-alpha.28

Wed, 07 Dec 2022 16:53:07 GMT

### Changes

-   Bump @azure/msal-common to v9.0.1

## 1.0.0-alpha.27

Mon, 21 Nov 2022 19:14:45 GMT

### Changes

-   Bump @azure/msal-common to v9.0.0

## 1.0.0-alpha.26

Mon, 07 Nov 2022 22:46:55 GMT

### Changes

-   Bump @azure/msal-common to v8.0.0

## 1.0.0-alpha.25

Mon, 10 Oct 2022 22:27:03 GMT

### Changes

-   Migrate from nan to node-api #5280 (thomas.norling@microsoft.com)
-   Bump @azure/msal-common to v7.6.0

## 1.0.0-alpha.24

Mon, 03 Oct 2022 22:12:27 GMT

### Changes

-   Bump @azure/msal-common to v7.5.0

## 1.0.0-alpha.23

Fri, 02 Sep 2022 18:06:53 GMT

### Changes

-   Point to the correct esm file in msal-node-extensions package.json (#5135) (miles@svtrobotics.com)
-   Bump @azure/msal-common to v7.4.0

## 1.0.0-alpha.22

Mon, 01 Aug 2022 22:22:36 GMT

### Changes

-   Bump @azure/msal-common to v7.3.0

## 1.0.0-alpha.21

Mon, 18 Jul 2022 23:26:21 GMT

### Changes

-   Bump @azure/msal-common to v7.2.0

## 1.0.0-alpha.20

Tue, 05 Jul 2022 22:37:04 GMT

### Changes

-   Bump @azure/msal-common to v7.1.0

## 1.0.0-alpha.19

Mon, 13 Jun 2022 22:28:09 GMT

### Changes

-   Bump @azure/msal-common to v7.0.0

## 1.0.0-alpha.18

Mon, 06 Jun 2022 22:13:00 GMT

### Changes

-   Bump @azure/msal-common to v6.4.0

## 1.0.0-alpha.17

Mon, 02 May 2022 22:23:33 GMT

### Changes

-   Bump @azure/msal-common to v6.3.0

## 1.0.0-alpha.16

Mon, 04 Apr 2022 21:12:42 GMT

### Changes

-   Bump @azure/msal-common to v6.2.0

## 1.0.0-alpha.15

Tue, 08 Feb 2022 00:41:06 GMT

### Changes

-   Update keytar dependency to ^7.8.0 #4483 (thomas.norling@microsoft.com)
-   Bump @azure/msal-common to v6.1.0

## 1.0.0-alpha.14

Tue, 04 Jan 2022 00:20:29 GMT

### Changes

-   Bump @azure/msal-common to v6.0.0

## 1.0.0-alpha.13

Tue, 07 Dec 2021 00:17:01 GMT

### Changes

-   Use https to install bindings dependency #4234 (thomas.norling@microsoft.com)
-   Bump @azure/msal-common to v5.2.0

## 1.0.0-alpha.12

Mon, 01 Nov 2021 23:53:22 GMT

### Changes

-   Bump @azure/msal-common to v5.1.0

## 1.0.0-alpha.11

Mon, 04 Oct 2021 23:12:35 GMT

### Changes

-   fix: integrate forked bindings package (kamausamuel11@gmail.com)
-   Bump @azure/msal-common to v5.0.1

## 1.0.0-alpha.10

Thu, 09 Sep 2021 23:58:01 GMT

### Changes

-   Upgrade msal-common to v5 for Node extensions (janutter@microsoft.com)

## 1.0.0-alpha.9

Thu, 22 Jul 2021 22:50:22 GMT

### Changes

-   feat: add the persistence creator (#3859) (samuelkamau@microsoft.com)
-   fix: bump up the msal-common version (samuelkamau@microsoft.com)

## 1.0.0-alpha.8

Tue, 29 Jun 2021 00:28:30 GMT

### Changes

-   verifyPersistence returns the right value on failure(#3787) (sameera.gajjarapu@microsoft.com)

## 1.0.0-alpha.7

Wed, 23 Jun 2021 00:01:49 GMT

### Changes

-   Add logs to test beachball (sameera.gajjarapu@microsoft.com)

## 1.0.0-alpha.6

Fri, 05 Mar 2021 21:26:46 GMT

### Changes

-   Fix lint in extensions to trigger version bump (janutter@microsoft.com)

## 1.0.0-alpha.5

Wed, 03 Mar 2021 22:13:23 GMT

### Changes

-   Fix npm audit warnings (janutter@microsoft.com)

## 1.0.0-alpha.4

Wed, 14 Oct 2020 23:45:07 GMT

### Changes

-   Update PersistenceCachePlugin (#2348) (sameera.gajjarapu@microsoft.com)

## 1.0.0-alpha.3

Wed, 23 Sep 2020 21:13:48 GMT

### Changes

-   Update error message (#2265) (sagonzal@microsoft.com)

# 1.0.0-alpha.2

-   Fix issue where binding.gyp was not being uploaded to npm

# 1.0.0-alpha.1

-   Increment @azure/msal-common version to 1.1.0

# 1.0.0-alpha.0

-   Extensions 1: Sets directory structure, adds Windows DPAPI Node addon (#1830)
-   Extensions 2: Add cross process lock (#1831)
-   Extensions 3: Add cache persistence plugin, persistence on Windows, Linux, and Mac (#1832)
-   Extensions 4: Add sample (#1834)
-   Extensions 5: Add documentation, add logger (#1835)
-   Extensions 6: Add tests (#1849)
