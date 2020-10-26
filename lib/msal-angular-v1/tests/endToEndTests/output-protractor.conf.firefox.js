[13:06:10] I/launcher - Running 1 instances of WebDriver
[13:06:10] I/hosted - Using the selenium server at https://hub-cloud.browserstack.com/wd/hub
[13:06:17] W/runner - Ignoring unknown extra flags: parameters. This will be an error in future versions, please use --disableChecks flag to disable the  Protractor CLI flag checks. 
Started
1:: Should login using redirect flow and logout
1 : Start of Test
2 : Verifying BrowserCache for id_token
3 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
4 : Sign in Success
5 : logout method called
[13:06:39] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
6 : Logout button clicked
7 : Redirecting back to Home page after Logout
8 : Verifying if Msal cache entries are reset
9 : Log out Success
10 : End of Test

[32m.[0m2 :: should login using popup and logout
1 : Start of Test
2 : Verifying BrowserCache for id_token
3 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
4 : Sign in Success
5 : logout method called
[13:07:00] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
6 : Logout button clicked
7 : Redirecting back to Home page after Logout
8 : Verifying if Msal cache entries are reset
9 : Log out Success
10 : End of Test

[32m.[0m3 :: Should login using redirect flow, navigate to Calendar tab (MS Graph API) and check if token is served from the cache
1 : Start of Test
2 : Verifying BrowserCache for id_token
3 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
4 : Sign in Success
5 : Calling MS Graph API
6 : Verifying BrowserCache for access_token
7 : Getting access_token/id_token key for scope: User.Read,Calendars.Read from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: 'Agreement.Read.All Agreement.ReadWrite.All AgreementAcceptance.Read AgreementAcceptance.Read.All AllSites.FullControl AllSites.Manage AllSites.Read AllSites.Write AppCatalog.ReadWrite.All AuditLog.Read.All Bookings.Manage.All Bookings.Read.All Bookings.ReadWrite.All BookingsAppointment.ReadWrite.All Calendars.Read Calendars.Read.All Calendars.Read.Shared Calendars.ReadWrite Calendars.ReadWrite.All Calendars.ReadWrite.Shared Contacts.Read Contacts.Read.All Contacts.Read.Shared Contacts.ReadWrite Contacts.ReadWrite.All Contacts.ReadWrite.Shared Device.Command Device.Read DeviceManagementApps.Read.All DeviceManagementApps.ReadWrite.All DeviceManagementConfiguration.Read.All DeviceManagementConfiguration.ReadWrite.All DeviceManagementManagedDevices.PrivilegedOperations.All DeviceManagementManagedDevices.Read.All DeviceManagementManagedDevices.ReadWrite.All DeviceManagementRBAC.Read.All DeviceManagementRBAC.ReadWrite.All DeviceManagementServiceConfig.Read.All DeviceManagementServiceConfig.ReadWrite.All Directory.AccessAsUser.All Directory.Read.All Directory.ReadWrite.All EAS.AccessAsUser.All EduAdministration.Read EduAdministration.ReadWrite EduAssignments.Read EduAssignments.ReadBasic EduAssignments.ReadWrite EduAssignments.ReadWriteBasic EduRoster.Read EduRoster.ReadBasic EduRoster.ReadWrite Exchange.Manage Files.Read Files.Read.All Files.Read.Selected Files.ReadWrite Files.ReadWrite.All Files.ReadWrite.AppFolder Files.ReadWrite.Selected Financials.ReadWrite.All full_access_as_user Group.Read.All Group.ReadWrite.All IdentityProvider.Read.All IdentityProvider.ReadWrite.All IdentityRiskEvent.Read.All Mail.Read Mail.Read.All Mail.Read.Shared Mail.ReadWrite Mail.ReadWrite.All Mail.ReadWrite.Shared Mail.Send Mail.Send.All Mail.Send.Shared MailboxSettings.Read MailboxSettings.ReadWrite Member.Read.Hidden MyFiles.Read MyFiles.Write Notes.Create Notes.Read Notes.Read.All Notes.ReadWrite Notes.ReadWrite.All Notes.ReadWrite.CreatedByApp People.Read People.Read.All People.ReadWrite PrivilegedAccess.ReadWrite.AzureAD PrivilegedAccess.ReadWrite.AzureResources Reports.Read.All SecurityEvents.Read.All SecurityEvents.ReadWrite.All Sites.FullControl.All Sites.Manage.All Sites.Read.All Sites.ReadWrite.All Sites.Search.All Subscription.Read.All Tasks.Read Tasks.Read.Shared Tasks.ReadWrite Tasks.ReadWrite.Shared TermStore.Read.All TermStore.ReadWrite.All User.Export.All User.Invite.All User.Read User.Read.All User.ReadBasic.All User.ReadWrite User.ReadWrite.All UserActivity.ReadWrite.CreatedByApp UserTimelineActivity.Write.CreatedByApp',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
8 : logout method called
[13:07:31] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
9 : Logout button clicked
10 : Redirecting back to Home page after Logout
11 : Verifying if Msal cache entries are resetted
12 : Log out Success
13 : End of Test

[32m.[0m4 :: should navigate to a protected route(calendar) using redirect flow and check if user gets redirected to the login page. After successful authentication, user should get redirected back to the protected route
1 : Start of Test
2 : Navigating to a protected route without a signed-in user
3 : User gets redirected to the sign-in page
4 : Verifying BrowserCache for id_token
5 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
6 : login start page is saved with the url of the protected route
7 : Verifying BrowserCache for access_token
8 : Getting access_token/id_token key for scope: User.Read,Calendars.Read from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: 'Agreement.Read.All Agreement.ReadWrite.All AgreementAcceptance.Read AgreementAcceptance.Read.All AllSites.FullControl AllSites.Manage AllSites.Read AllSites.Write AppCatalog.ReadWrite.All AuditLog.Read.All Bookings.Manage.All Bookings.Read.All Bookings.ReadWrite.All BookingsAppointment.ReadWrite.All Calendars.Read Calendars.Read.All Calendars.Read.Shared Calendars.ReadWrite Calendars.ReadWrite.All Calendars.ReadWrite.Shared Contacts.Read Contacts.Read.All Contacts.Read.Shared Contacts.ReadWrite Contacts.ReadWrite.All Contacts.ReadWrite.Shared Device.Command Device.Read DeviceManagementApps.Read.All DeviceManagementApps.ReadWrite.All DeviceManagementConfiguration.Read.All DeviceManagementConfiguration.ReadWrite.All DeviceManagementManagedDevices.PrivilegedOperations.All DeviceManagementManagedDevices.Read.All DeviceManagementManagedDevices.ReadWrite.All DeviceManagementRBAC.Read.All DeviceManagementRBAC.ReadWrite.All DeviceManagementServiceConfig.Read.All DeviceManagementServiceConfig.ReadWrite.All Directory.AccessAsUser.All Directory.Read.All Directory.ReadWrite.All EAS.AccessAsUser.All EduAdministration.Read EduAdministration.ReadWrite EduAssignments.Read EduAssignments.ReadBasic EduAssignments.ReadWrite EduAssignments.ReadWriteBasic EduRoster.Read EduRoster.ReadBasic EduRoster.ReadWrite Exchange.Manage Files.Read Files.Read.All Files.Read.Selected Files.ReadWrite Files.ReadWrite.All Files.ReadWrite.AppFolder Files.ReadWrite.Selected Financials.ReadWrite.All full_access_as_user Group.Read.All Group.ReadWrite.All IdentityProvider.Read.All IdentityProvider.ReadWrite.All IdentityRiskEvent.Read.All Mail.Read Mail.Read.All Mail.Read.Shared Mail.ReadWrite Mail.ReadWrite.All Mail.ReadWrite.Shared Mail.Send Mail.Send.All Mail.Send.Shared MailboxSettings.Read MailboxSettings.ReadWrite Member.Read.Hidden MyFiles.Read MyFiles.Write Notes.Create Notes.Read Notes.Read.All Notes.ReadWrite Notes.ReadWrite.All Notes.ReadWrite.CreatedByApp People.Read People.Read.All People.ReadWrite PrivilegedAccess.ReadWrite.AzureAD PrivilegedAccess.ReadWrite.AzureResources Reports.Read.All SecurityEvents.Read.All SecurityEvents.ReadWrite.All Sites.FullControl.All Sites.Manage.All Sites.Read.All Sites.ReadWrite.All Sites.Search.All Subscription.Read.All Tasks.Read Tasks.Read.Shared Tasks.ReadWrite Tasks.ReadWrite.Shared TermStore.Read.All TermStore.ReadWrite.All User.Export.All User.Invite.All User.Read User.Read.All User.ReadBasic.All User.ReadWrite User.ReadWrite.All UserActivity.ReadWrite.CreatedByApp UserTimelineActivity.Write.CreatedByApp',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
9 : logout method called
[13:08:04] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
10 : Logout button clicked
11 : Redirecting back to Home page after Logout
12 : Verifying if Msal cache entries are resetted
13 : Log out Success
14 : End of Test

[32m.[0m5 :: should login using popup flow, navigate to calendar tab and check if token is served from the cache
1 : Start of Test
2 : Verifying BrowserCache for id_token
3 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
4 : Popup window is closed after successful login
5 : Sending request to MS Graph api
6 : Verifying BrowserCache for access_token
7 : Getting access_token/id_token key for scope: User.Read,Calendars.Read from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: 'Agreement.Read.All Agreement.ReadWrite.All AgreementAcceptance.Read AgreementAcceptance.Read.All AllSites.FullControl AllSites.Manage AllSites.Read AllSites.Write AppCatalog.ReadWrite.All AuditLog.Read.All Bookings.Manage.All Bookings.Read.All Bookings.ReadWrite.All BookingsAppointment.ReadWrite.All Calendars.Read Calendars.Read.All Calendars.Read.Shared Calendars.ReadWrite Calendars.ReadWrite.All Calendars.ReadWrite.Shared Contacts.Read Contacts.Read.All Contacts.Read.Shared Contacts.ReadWrite Contacts.ReadWrite.All Contacts.ReadWrite.Shared Device.Command Device.Read DeviceManagementApps.Read.All DeviceManagementApps.ReadWrite.All DeviceManagementConfiguration.Read.All DeviceManagementConfiguration.ReadWrite.All DeviceManagementManagedDevices.PrivilegedOperations.All DeviceManagementManagedDevices.Read.All DeviceManagementManagedDevices.ReadWrite.All DeviceManagementRBAC.Read.All DeviceManagementRBAC.ReadWrite.All DeviceManagementServiceConfig.Read.All DeviceManagementServiceConfig.ReadWrite.All Directory.AccessAsUser.All Directory.Read.All Directory.ReadWrite.All EAS.AccessAsUser.All EduAdministration.Read EduAdministration.ReadWrite EduAssignments.Read EduAssignments.ReadBasic EduAssignments.ReadWrite EduAssignments.ReadWriteBasic EduRoster.Read EduRoster.ReadBasic EduRoster.ReadWrite Exchange.Manage Files.Read Files.Read.All Files.Read.Selected Files.ReadWrite Files.ReadWrite.All Files.ReadWrite.AppFolder Files.ReadWrite.Selected Financials.ReadWrite.All full_access_as_user Group.Read.All Group.ReadWrite.All IdentityProvider.Read.All IdentityProvider.ReadWrite.All IdentityRiskEvent.Read.All Mail.Read Mail.Read.All Mail.Read.Shared Mail.ReadWrite Mail.ReadWrite.All Mail.ReadWrite.Shared Mail.Send Mail.Send.All Mail.Send.Shared MailboxSettings.Read MailboxSettings.ReadWrite Member.Read.Hidden MyFiles.Read MyFiles.Write Notes.Create Notes.Read Notes.Read.All Notes.ReadWrite Notes.ReadWrite.All Notes.ReadWrite.CreatedByApp People.Read People.Read.All People.ReadWrite PrivilegedAccess.ReadWrite.AzureAD PrivilegedAccess.ReadWrite.AzureResources Reports.Read.All SecurityEvents.Read.All SecurityEvents.ReadWrite.All Sites.FullControl.All Sites.Manage.All Sites.Read.All Sites.ReadWrite.All Sites.Search.All Subscription.Read.All Tasks.Read Tasks.Read.Shared Tasks.ReadWrite Tasks.ReadWrite.Shared TermStore.Read.All TermStore.ReadWrite.All User.Export.All User.Invite.All User.Read User.Read.All User.ReadBasic.All User.ReadWrite User.ReadWrite.All UserActivity.ReadWrite.CreatedByApp UserTimelineActivity.Write.CreatedByApp',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
8 : logout method called
[13:08:31] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
9 : Logout button clicked
10 : Redirecting back to Home page after Logout
11 : Verifying if Msal cache entries are resetted
12 : Log out Success
13 : End of Test

[32m.[0m6 :: should navigate to Home page, enter text in a textbox, log in using redirect flow and check if textbox text gets cleared as app gets reloaded
1 : Start of Test
2 : Entering text in a textbox on the home page
3 : Verifying BrowserCache for id_token
4 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
5 : App is reloaded in case of login using a redirect
6 : logout method called
[13:08:59] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
7 : Logout button clicked
8 : Redirecting back to Home page after Logout
9 : Verifying if Msal cache entries are reset
10 : Log out Success
11 : End of Test

[32m.[0m7 :: should navigate to Home page, enter text in a textbox, log in using popUp and check if textbox text is retained as app does not get reloaded
1 : Start of Test
2 : Entering text in a textbox on the home page
3 : Verifying BrowserCache for id_token
4 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
5 : App is not reloaded in case of login using a popUp window
6 : logout method called
[13:09:34] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
7 : Logout button clicked
8 : Redirecting back to Home page after Logout
9 : Verifying if Msal cache entries are reset
10 : Log out Success
11 : End of Test

[32m.[0m8 :: Should login using redirect flow, navigate to external we api and check if token is served from the cache
1 : Start of Test
2 : Verifying BrowserCache for id_token
3 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
4 : Calling external web api
5 : Verifying BrowserCache for access_token
6 : Getting access_token/id_token key for scope: api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: 'api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
7 : logout method called
[13:09:59] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
8 : Logout button clicked
9 : Redirecting back to Home page after Logout
10 : Verifying if Msal cache entries are resetted
11 : Log out Success
12 : End of Test

[32m.[0m9 :: should navigate to a protected route(external web api) using redirect flow and check if user gets redirected to the login page. After successful authentication, user should get redirected back to the protected route
1 : Start of Test
2 : Navigating to a protected route without a signed-in user
3 : User gets redirected to the sign-in page
4 : Verifying BrowserCache for id_token
5 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
6 : login start page is saved with the url of the protected route
7 : Verifying BrowserCache for access_token
8 : Getting access_token/id_token key for scope: api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: 'api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
9 : logout method called
[13:10:25] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
10 : Logout button clicked
11 : Redirecting back to Home page after Logout
12 : Verifying if Msal cache entries are resetted
13 : Log out Success
14 : End of Test

[32m.[0m10 :: Should login using redirect flow and MSA account, navigate to external we api and check if token is served from the cache
1 : Start of Test
2 : Verifying BrowserCache for id_token
3 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'MDAwMDAwMDAtMDAwMC0wMDAwLWIzOTQtZjE3N2NhNGFjNjNl.OTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFk' }
4 : Calling external web api
5 : Verifying BrowserCache for access_token
6 : Getting access_token/id_token key for scope: api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: 'api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user',
  userIdentifier: 'MDAwMDAwMDAtMDAwMC0wMDAwLWIzOTQtZjE3N2NhNGFjNjNl.OTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFk' }
7 : logout method called
[13:10:59] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
8 : End of Test

[32m.[0m11 :: Should login using redirect flow and MSA account, navigate to MS Graph and check if token is served from the cache
1 : Start of Test
2 : Verifying BrowserCache for id_token
3 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'MDAwMDAwMDAtMDAwMC0wMDAwLWIzOTQtZjE3N2NhNGFjNjNl.OTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFk' }
4 : Calling ms graph
5 : Verifying BrowserCache for access_token
6 : Getting access_token/id_token key for scope: User.Read,Calendars.Read from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: 'Agreement.Read.All Agreement.ReadWrite.All AgreementAcceptance.Read AgreementAcceptance.Read.All AllSites.FullControl AllSites.Manage AllSites.Read AllSites.Write AppCatalog.ReadWrite.All AuditLog.Read.All Bookings.Manage.All Bookings.Read.All Bookings.ReadWrite.All BookingsAppointment.ReadWrite.All Calendars.Read Calendars.Read.All Calendars.Read.Shared Calendars.ReadWrite Calendars.ReadWrite.All Calendars.ReadWrite.Shared Contacts.Read Contacts.Read.All Contacts.Read.Shared Contacts.ReadWrite Contacts.ReadWrite.All Contacts.ReadWrite.Shared Device.Command Device.Read DeviceManagementApps.Read.All DeviceManagementApps.ReadWrite.All DeviceManagementConfiguration.Read.All DeviceManagementConfiguration.ReadWrite.All DeviceManagementManagedDevices.PrivilegedOperations.All DeviceManagementManagedDevices.Read.All DeviceManagementManagedDevices.ReadWrite.All DeviceManagementRBAC.Read.All DeviceManagementRBAC.ReadWrite.All DeviceManagementServiceConfig.Read.All DeviceManagementServiceConfig.ReadWrite.All Directory.AccessAsUser.All Directory.Read.All Directory.ReadWrite.All EAS.AccessAsUser.All EduAdministration.Read EduAdministration.ReadWrite EduAssignments.Read EduAssignments.ReadBasic EduAssignments.ReadWrite EduAssignments.ReadWriteBasic EduRoster.Read EduRoster.ReadBasic EduRoster.ReadWrite Exchange.Manage Files.Read Files.Read.All Files.Read.Selected Files.ReadWrite Files.ReadWrite.All Files.ReadWrite.AppFolder Files.ReadWrite.Selected Financials.ReadWrite.All full_access_as_user Group.Read.All Group.ReadWrite.All IdentityProvider.Read.All IdentityProvider.ReadWrite.All IdentityRiskEvent.Read.All Mail.Read Mail.Read.All Mail.Read.Shared Mail.ReadWrite Mail.ReadWrite.All Mail.ReadWrite.Shared Mail.Send Mail.Send.All Mail.Send.Shared MailboxSettings.Read MailboxSettings.ReadWrite Member.Read.Hidden MyFiles.Read MyFiles.Write Notes.Create Notes.Read Notes.Read.All Notes.ReadWrite Notes.ReadWrite.All Notes.ReadWrite.CreatedByApp People.Read People.Read.All People.ReadWrite PrivilegedAccess.ReadWrite.AzureAD PrivilegedAccess.ReadWrite.AzureResources Reports.Read.All SecurityEvents.Read.All SecurityEvents.ReadWrite.All Sites.FullControl.All Sites.Manage.All Sites.Read.All Sites.ReadWrite.All Sites.Search.All Subscription.Read.All Tasks.Read Tasks.Read.Shared Tasks.ReadWrite Tasks.ReadWrite.Shared TermStore.Read.All TermStore.ReadWrite.All User.Export.All User.Invite.All User.Read User.Read.All User.ReadBasic.All User.ReadWrite User.ReadWrite.All UserActivity.ReadWrite.CreatedByApp UserTimelineActivity.Write.CreatedByApp',
  userIdentifier: 'MDAwMDAwMDAtMDAwMC0wMDAwLWIzOTQtZjE3N2NhNGFjNjNl.OTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFk' }
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: 'Agreement.Read.All Agreement.ReadWrite.All AgreementAcceptance.Read AgreementAcceptance.Read.All AllSites.FullControl AllSites.Manage AllSites.Read AllSites.Write AppCatalog.ReadWrite.All AuditLog.Read.All Bookings.Manage.All Bookings.Read.All Bookings.ReadWrite.All BookingsAppointment.ReadWrite.All Calendars.Read Calendars.Read.All Calendars.Read.Shared Calendars.ReadWrite Calendars.ReadWrite.All Calendars.ReadWrite.Shared Contacts.Read Contacts.Read.All Contacts.Read.Shared Contacts.ReadWrite Contacts.ReadWrite.All Contacts.ReadWrite.Shared Device.Command Device.Read DeviceManagementApps.Read.All DeviceManagementApps.ReadWrite.All DeviceManagementConfiguration.Read.All DeviceManagementConfiguration.ReadWrite.All DeviceManagementManagedDevices.PrivilegedOperations.All DeviceManagementManagedDevices.Read.All DeviceManagementManagedDevices.ReadWrite.All DeviceManagementRBAC.Read.All DeviceManagementRBAC.ReadWrite.All DeviceManagementServiceConfig.Read.All DeviceManagementServiceConfig.ReadWrite.All Directory.AccessAsUser.All Directory.Read.All Directory.ReadWrite.All EAS.AccessAsUser.All EduAdministration.Read EduAdministration.ReadWrite EduAssignments.Read EduAssignments.ReadBasic EduAssignments.ReadWrite EduAssignments.ReadWriteBasic EduRoster.Read EduRoster.ReadBasic EduRoster.ReadWrite Exchange.Manage Files.Read Files.Read.All Files.Read.Selected Files.ReadWrite Files.ReadWrite.All Files.ReadWrite.AppFolder Files.ReadWrite.Selected Financials.ReadWrite.All full_access_as_user Group.Read.All Group.ReadWrite.All IdentityProvider.Read.All IdentityProvider.ReadWrite.All IdentityRiskEvent.Read.All Mail.Read Mail.Read.All Mail.Read.Shared Mail.ReadWrite Mail.ReadWrite.All Mail.ReadWrite.Shared Mail.Send Mail.Send.All Mail.Send.Shared MailboxSettings.Read MailboxSettings.ReadWrite Member.Read.Hidden MyFiles.Read MyFiles.Write Notes.Create Notes.Read Notes.Read.All Notes.ReadWrite Notes.ReadWrite.All Notes.ReadWrite.CreatedByApp People.Read People.Read.All People.ReadWrite PrivilegedAccess.ReadWrite.AzureAD PrivilegedAccess.ReadWrite.AzureResources Reports.Read.All SecurityEvents.Read.All SecurityEvents.ReadWrite.All Sites.FullControl.All Sites.Manage.All Sites.Read.All Sites.ReadWrite.All Sites.Search.All Subscription.Read.All Tasks.Read Tasks.Read.Shared Tasks.ReadWrite Tasks.ReadWrite.Shared TermStore.Read.All TermStore.ReadWrite.All User.Export.All User.Invite.All User.Read User.Read.All User.ReadBasic.All User.ReadWrite User.ReadWrite.All UserActivity.ReadWrite.CreatedByApp UserTimelineActivity.Write.CreatedByApp',
  userIdentifier: 'MDAwMDAwMDAtMDAwMC0wMDAwLWIzOTQtZjE3N2NhNGFjNjNl.OTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFk' }
7 : logout method called
[13:11:28] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
8 : End of Test

[32m.[0m12 :: Should login using redirect flow, remove expiration key for todo api access_token to 0, navigate to Todo page and check if token is renewed using iframe
1 : Start of Test
12 :: Should login using redirect flow, remove expiration key for todo api access_token to 0, navigate to Todo page and check if token is renewed using iframe
2 : Start of Test
3 : Calling external web api
4 : Verifying BrowserCache for access_token
5 : Getting access_token/id_token key for scope: api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: 'api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
6 : Removing accessToken key for Todo API
7 : Access token key deleted from cache
8 : Verifying BrowserCache for access_token
9 : Getting access_token/id_token key for scope: api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: 'api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
10 : logout method called
[13:11:54] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
11 : Logout button clicked
12 : Redirecting back to Home page after Logout
13 : Verifying if Msal cache entries are resetted
14 : Log out Success
15 : End of Test

[32m.[0m


12 specs, 0 failures
Finished in 341.31 seconds

[13:11:59] I/launcher - 0 instance(s) of WebDriver still running
[13:11:59] I/launcher - firefox #01 passed
