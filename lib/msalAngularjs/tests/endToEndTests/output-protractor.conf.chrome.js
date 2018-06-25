[12:22:48] I/launcher - Running 1 instances of WebDriver
[12:22:48] I/hosted - Using the selenium server at http://localhost:4444/wd/hub
Started

Should login using redirect flow and logout
1 : Start of Test
2 : Login method called
3 : Verifying BrowserCache for id_token
4 : Getting access_token/id_token key for scope: f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523 from storage
{ authority: 'https://login.microsoftonline.com/common/',
  clientId: 'f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523',
  scopes: 'f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523',
  userIdentifier: 'MDAwMDAwMDAtMDAwMC0wMDAwLTM5NzAtNGJjNzE3MWYwYzk4.OTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFk' }
5 : Sign in Success
6 : Logout method called
7 : Logout button clicked
8 : Redirecting back to Home page after Logout
9 : Verifying if Msal cache entries are resetted
10 : Log out Success
11 : End of Test

[32m.[0m
Should login using Popup and logout
1 : Start of Test
2 : Login method called
3 : Opened popup window for Login
4 : Verifying BrowserCache for id_token
5 : Getting access_token/id_token key for scope: f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523 from storage
{ authority: 'https://login.microsoftonline.com/common/',
  clientId: 'f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523',
  scopes: 'f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523',
  userIdentifier: 'MDAwMDAwMDAtMDAwMC0wMDAwLTM5NzAtNGJjNzE3MWYwYzk4.OTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFk' }
6 : Sign in Success
7 : Logout method called
8 : Logout button clicked
9 : Redirecting back to Home page after Logout
10 : Verifying if Msal cache entries are resetted
11 : Log out Success
12 : End of Test

[32m.[0m
Should login using redirect flow, navigate to Todo page (external API) and check if token is served from the cache
1 : Start of Test
2 : Login method called
3 : Verifying BrowserCache for id_token
4 : Getting access_token/id_token key for scope: f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523 from storage
5 : Navigating to Todo Page
6 : Verifying BrowserCache for access_token
7 : Getting access_token/id_token key for scope: api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user from storage
{ authority: 'https://login.microsoftonline.com/common/',
  clientId: 'f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523',
  scopes: 'api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user',
  userIdentifier: 'MDAwMDAwMDAtMDAwMC0wMDAwLTM5NzAtNGJjNzE3MWYwYzk4.OTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFk' }
8 : Logout method called
9 : Logout button clicked
10 : Redirecting back to Home page after Logout
11 : Verifying if Msal cache entries are resetted
12 : Log out Success
13 : End of Test

[32m.[0m
Should login using redirect flow, navigate to Calendar page (Graph API) and check if token is served from the cache
1 : Start of Test
2 : Login method called
3 : Verifying BrowserCache for id_token
4 : Getting access_token/id_token key for scope: f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523 from storage
{ authority: 'https://login.microsoftonline.com/common/',
  clientId: 'f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523',
  scopes: 'f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523',
  userIdentifier: 'MDAwMDAwMDAtMDAwMC0wMDAwLTM5NzAtNGJjNzE3MWYwYzk4.OTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFk' }
5 : Navigating to Calendar Page
6 : Verifying BrowserCache for access_token
7 : Getting access_token/id_token key for scope: user.read,calendars.read from storage
8 : Logout method called
9 : Logout button clicked
10 : Redirecting back to Home page after Logout
11 : Verifying if Msal cache entries are resetted
12 : Log out Success
13 : End of Test

[32m.[0m
Should login using redirect flow, remove expiration key for todo api access_token to 0, navigate to Todo page and check if token is renewed using iframe
1 : Start of Test
2 : Login method called
3 : Verifying BrowserCache for id_token
4 : Getting access_token/id_token key for scope: f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523 from storage
{ authority: 'https://login.microsoftonline.com/common/',
  clientId: 'f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523',
  scopes: 'f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523',
  userIdentifier: 'MDAwMDAwMDAtMDAwMC0wMDAwLTM5NzAtNGJjNzE3MWYwYzk4.OTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFk' }
5 : Navigating to Todo Page
6 : Verifying BrowserCache for access_token
7 : Getting access_token/id_token key for scope: api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user from storage
{ authority: 'https://login.microsoftonline.com/common/',
  clientId: 'f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523',
  scopes: 'api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user',
  userIdentifier: 'MDAwMDAwMDAtMDAwMC0wMDAwLTM5NzAtNGJjNzE3MWYwYzk4.OTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFk' }
8 : Removing accessToken key for Todo API
9 : Access token key deleted from cache
10 : Navigating to Home Page
11 : Navigating to Todo Page
12 : Verifying BrowserCache for access_token
13 : Getting access_token/id_token key for scope: api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user from storage
{ authority: 'https://login.microsoftonline.com/common/',
  clientId: 'f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523',
  scopes: 'api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user',
  userIdentifier: 'MDAwMDAwMDAtMDAwMC0wMDAwLTM5NzAtNGJjNzE3MWYwYzk4.OTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFk' }
14 : Logout method called
15 : Logout button clicked
16 : Redirecting back to Home page after Logout
17 : Verifying if Msal cache entries are resetted
18 : Log out Success
19 : End of Test

[32m.[0m
Should navigate to TodoPage without signing in and check if user is prompted for login followed by acquire token request to Todo api to retrieve an access_token
1 : Start of Test
2 : Navigating to Todo Page
3 : Verifying BrowserCache for id_token
4 : Getting access_token/id_token key for scope: f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523 from storage
{ authority: 'https://login.microsoftonline.com/common/',
  clientId: 'f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523',
  scopes: 'f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523',
  userIdentifier: 'MDAwMDAwMDAtMDAwMC0wMDAwLTM5NzAtNGJjNzE3MWYwYzk4.OTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFk' }
5 : Verifying BrowserCache for access_token
6 : Getting access_token/id_token key for scope: api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user from storage
7 : Logout method called
8 : Logout button clicked
9 : Redirecting back to Home page after Logout
10 : Verifying if Msal cache entries are resetted
11 : Log out Success
12 : End of Test

[32m.[0m
Should save some state (text) on the main page, login using popup window and check if the main page is not reloaded and state is retained on the main page
1 : Start of Test
2 : Navigating to Home Page
3 : Saving initial state on the Home page
4 : Login method called
5 : Opened popup window for Login
6 : Verifying BrowserCache for id_token
7 : Getting access_token/id_token key for scope: f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523 from storage
{ authority: 'https://login.microsoftonline.com/common/',
  clientId: 'f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523',
  scopes: 'f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523',
  userIdentifier: 'MDAwMDAwMDAtMDAwMC0wMDAwLTM5NzAtNGJjNzE3MWYwYzk4.OTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFk' }
8 : Sign in Success
9 : State saved on the Home page is preserved after login
10 : Logout method called
11 : Logout button clicked
12 : Redirecting back to Home page after Logout
13 : Verifying if Msal cache entries are resetted
14 : Log out Success
15 : End of Test

[32m.[0m


7 specs, 0 failures
Finished in 140.705 seconds

[12:25:11] I/launcher - 0 instance(s) of WebDriver still running
[12:25:11] I/launcher - chrome #01 passed
