# Security

Tokens are accessible from Javascript since MSAL is using HTML5 storage. Default storage option is sessionStorage, which keeps the tokens per session. You should ask user to login again for important operations on your app.
You should protect your site for XSS. Please check the article here: [https://www.owasp.org/index.php/XSS\_(Cross_Site_Scripting)\_Prevention_Cheat_Sheet](<https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet>)