# Security

Tokens are accessible from JavaScript since MSAL is using HTML5 storage. Default storage option is `sessionStorage`, which keeps the tokens per session. You should ask user to login again for important operations on your app.
You should protect your site for XSS. Please check the article here: [Cross Site Scripting Prevention Cheat Sheet](<https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html>)
