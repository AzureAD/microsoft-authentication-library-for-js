# Roadmap

The MSAL.js team schedules work on a quarterly basis. The roadmap below provides a subset of the team's quarterly commitments for past and upcoming quarters. 

## Glossary

- **CY**: Calendar year, January to December.
  - Example: "CY2021" refers to January 2021 through December 2021.
- **FY**: Microsoft fiscal Year, July to June.
  - Example: "FY2022" refers to July 2021 through June 2022. 
- **Q**: Quarter, three month period.
  - Example: "CY2021Q1" refers to January 2021 through March 2021.
  - Example: "FY2022Q1" refers to July 2021 through September 2021.

## Current Quarter

### CY2022Q1 / FY2022Q3

| Library         | Deliverable                       | Status      | ETA       | Notes                                                        |
| :-------------- | :-------------------------------- | :---------- | :-------- | :----------------------------------------------------------- |
| MSAL Browser    | Telemetry interface               | In Progress | Mar 2022  | To provide support for customers that are interested in library performance |
| MSAL Browser    | Security improvements             | In Progress | July 2022 | Improvements for Chrome and Edge on Windows to leverage existing device accounts |
| MSAL Browser    | Resiliency improvements           | In Progress | Mar 2022  | Improvements around accessing the metadata endpoint to improve library reliability |
| MSAL Node       | Distributed cache support         | In Progress | Mar 2022  | Improvements and samples to better support distributed caches like Redis in MSAL Node |
 

### CY2021Q4 / FY2022Q2

| Library         | Deliverable                       | Status      | ETA       | Notes                                                        |
| :-------------- | :-------------------------------- | :---------- | :-------- | :----------------------------------------------------------- |
| MSAL Browser    | General performance improvements  | In Progress | Dec 2021  | End to end review on token performance and proposals for optimizations. |

## Past Quarters

### CY2021Q3 / FY2022Q1

| Library         | Deliverable                       | Status      | ETA       | Notes                                                        |
| :-------------- | :-------------------------------- | :---------- | :-------- | :----------------------------------------------------------- |
| Multiple        | Various small features and improvements | Completed   | Sept 2021 | Please see our release notes for the full details.     |
| MSAL Browser    | Backup Auth Service Support       | Completed   | Sept 2021 | Improvements to integrate deeper into the [Azure AD Backup Authentication service](https://techcommunity.microsoft.com/t5/azure-active-directory-identity/99-99-uptime-for-azure-active-directory/ba-p/1999628). |


### CY2021Q2 / FY2021Q4

| Library         | Deliverable                       | Status      | ETA       | Notes                                                        |
| :-------------- | :-------------------------------- | :---------- | :-------- | :----------------------------------------------------------- |
| MSAL Angular v2 | General Availability              | Completed   | May 2021  | Stable production release of MSAL Angular wrapper library for MSAL Browser. |
| MSAL React      | General Availability              | Completed   | May 2021  | Stable production release of MSAL React wrapper library for MSAL Browser. |
| MSAL Browser    | Refresh Token Proof-of-possession | In Progress | July 2021 | Cryptographically binds refresh tokens to the browser, helping mitigate replay if tokens are exfiltrated. |


### CY2021Q1 / FY2021Q3

| Library         | **Deliverable**      | **Status** | ETA           | Notes                                                        |
| :-------------- | :------------------- | :--------- | :------------ | :----------------------------------------------------------- |
| MSAL Node       | General Availability | Completed  | February 2021 | Stable production release of MSAL Node client library.       |
| MSAL React      | Public Preview       | Completed  | February 2021 | The public preview milestone will include production level support. |
| MSAL Angular v2 | Public Preview       | Completed  | March 2021    | The public preview milestone will include production level support. |
| MSAL Browser    | Logout Popup         | Completed  | March 2021    | Support logging out via popup, to support scenarios where redirect is not desired or not possible (e.g. nested frame). |

