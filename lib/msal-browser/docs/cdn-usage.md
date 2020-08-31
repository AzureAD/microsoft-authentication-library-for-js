# CDN Usage for @azure/msal-browser

The `@azure/msal-browser` package is available through CDN if you do not wish to use the npm released version. Please be aware that our CDN releases are a bit slower than our npm releases and may require a few more days before they are available here.

## Release CDN URLs and SRI Hash

### Compiled

Version | CDN URL | SRI Hash
--------------- | ------- | ---------------------------
2.1.0 | https://alcdn.msauth.net/browser/2.1.0/js/msal-browser.js | sha384-M9bRB06LdiYadS+F9rPQnntFCYR3UJvtb2Vr4Tmhw9WBwWUfxH8VDRAFKNn3VTc/
2.0.2 | https://alcdn.msauth.net/browser/2.0.2/js/msal-browser.js | sha384-rQvomuvjVybeTxLQIpbtb6lqFsDuJparCjjUJZjRZjVDNzGRloXbPj9qbgf9YM/d
2.0.1 | https://alcdn.msauth.net/browser/2.0.1/js/msal-browser.js | sha384-knPh00kvaT+k3+4TCD5S2ORDNVc2I3RVbqI/ksbTlpdSBh8ZnyAPxW2kkTSG0+mT
2.0.0 | https://alcdn.msauth.net/browser/2.0.0/js/msal-browser.js | sha384-BqIcDtzVkr3wRGsSrk+iJJNm9GSdUsP0I2MplbnhPPc+I1l1d+dkKbcnqgNddGWX
2.0.0-beta.4 | https://alcdn.msauth.net/browser/2.0.0-beta.4/js/msal-browser.js | sha384-7sxY2tN3GMVE5jXH2RL9AdbO6s46vUh9lUid4yNCHJMUzDoj+0N4ve6rLOmR88yN
2.0.0-beta.3 | https://alcdn.msauth.net/browser/2.0.0-beta.3/js/msal-browser.js | sha384-iKgpFzdbMAsg695JG+EmHleQe5gRjoAAixuMf0jfM7pCOVuGqhyBuXO1Ai71fixx
2.0.0-beta.2 | https://alcdn.msauth.net/browser/2.0.0-beta.2/js/msal-browser.js | sha384-CEQpk7EG1PVKCHHdoQzDdR5uU7nJ1PLlcdx1s7vi8Ta/Pndhr04imhqCUkZGimOj
2.0.0-beta.0 | https://alcdn.msauth.net/browser/2.0.0-beta.0/js/msal-browser.js | sha384-r7Qxfs6PYHyfoBR6zG62DGzptfLBxnREThAlcJyEfzJ4dq5rqExc1Xj3TPFE/9TH

### Minified

Version | CDN URL | SRI Hash
--------------- | ------- | ---------------------------
2.1.0 | https://alcdn.msauth.net/browser/2.1.0/js/msal-browser.min.js | sha384-EmYPwkfj+VVmL1brMS1h6jUztl4QMS8Qq8xlZNgIT/luzg7MAzDVrRa2JxbNmk/e
2.0.2 | https://alcdn.msauth.net/browser/2.0.2/js/msal-browser.min.js | sha384-zHGbJmHXAWMXaREIK7qFkrJCcU2ktJd8G9DAp49Q+y/+H6ArVhvFUW5IbyTzbNnn
2.0.1 | https://alcdn.msauth.net/browser/2.0.1/js/msal-browser.min.js | sha384-fbyYRj8H9iJU/JyncEbzW6WgVOaR5C+PU1dHsRBg2Ag2Q14F4IB8+T8BdknwjRQ8
2.0.0 | https://alcdn.msauth.net/browser/2.0.0/js/msal-browser.min.js | sha384-n3aacu1eFuIAfS3ZY4WGIZiQG/skqpT+cbeqIwLddpmMWcxWZwYdt+F0PgKyw+m9
2.0.0-beta.4 | https://alcdn.msauth.net/browser/2.0.0-beta.4/js/msal-browser.min.js | sha384-j9+OYwF1QFM1A8/DNvWKqvTw+bc5alOXQ7IA2WvGAcLLLpN/tK9XRTbJtlTiSFJI
2.0.0-beta.3 | https://alcdn.msauth.net/browser/2.0.0-beta.3/js/msal-browser.min.js | sha384-X2nv+6ViZGj+UCfGAbimHAXpBEAi0RA6GWuqCckbMLU5jVr8uDjf6pGUvTkq7wME
2.0.0-beta.2 | https://alcdn.msauth.net/browser/2.0.0-beta.2/js/msal-browser.min.js | sha384-O3n9nwTefR6cSLikBQsCDYke2pWL5YWluwvp0RgGe+VK2eU0+RJC1cmMow5jD1OE
2.0.0-beta.0 | https://alcdn.msauth.net/browser/2.0.0-beta.0/js/msal-browser.min.js | sha384-OV4a42kPPZv7IxRWcyqoLn9Ohs0g1WXejuNceZxAE9usAfLVFBcdre9yqo4I03VN

## Installation Via CDN (with SRI Hash):
MSAL is available in a compiled umd format, and also includes a minified/uglified version. 

You can include the `msal-browser.js` or the `msal-browser.min.js` files by adding the one of following script tags:

### Compiled

```javascript
<script src="https://alcdn.msauth.net/browser/2.0.0/js/msal-browser.js" integrity="sha384-BqIcDtzVkr3wRGsSrk+iJJNm9GSdUsP0I2MplbnhPPc+I1l1d+dkKbcnqgNddGWX" crossorigin="anonymous"></script>
```

### Minified

```javascript
<script src="https://alcdn.msauth.net/browser/2.0.0/js/msal-browser.min.js" integrity="sha384-n3aacu1eFuIAfS3ZY4WGIZiQG/skqpT+cbeqIwLddpmMWcxWZwYdt+F0PgKyw+m9" crossorigin="anonymous"></script>
```

### Notes
- [Subresource Integrity (SRI)](https://developer.mozilla.org/docs/Web/Security/Subresource_Integrity) attributes are optional in the script tag, but we recommend including the SRI Hash with all script tags when using `msal.js` or `msal.min.js` (including when using a third-party CDN). When providing the SRI Hash, you *must* also provide the `crossorigin="anonymous"` field in the same tag.
- All hashes are unique to the version of MSAL. You can find the previous hashes [below]().


### Alternate region URLs

To help ensure reliability, Microsoft provides a second CDN:

```html
<script type="text/javascript" src="https://alcdn.msauth.net/browser/2.0.0/js/msal-browser.js" integrity="sha384-BqIcDtzVkr3wRGsSrk+iJJNm9GSdUsP0I2MplbnhPPc+I1l1d+dkKbcnqgNddGWX" crossorigin="anonymous"></script>
```

```html
<script type="text/javascript" src="https://alcdn.msauth.net/browser/2.0.0/js/msal-browser.min.js" integrity="sha384-n3aacu1eFuIAfS3ZY4WGIZiQG/skqpT+cbeqIwLddpmMWcxWZwYdt+F0PgKyw+m9" crossorigin="anonymous"></script>
```

Below is an example of how to use one CDN as a fallback when the other CDN is not working:

```html
<script type="text/javascript" src="https://alcdn.msauth.net/browser/2.0.0/js/msal-browser.js"></script>
<script type="text/javascript">
    if(typeof Msal === 'undefined')document.write(unescape("%3Cscript src='https://alcdn.msftauth.net/browser/2.0.0/js/msal-browser.js' type='text/javascript' %3E%3C/script%3E"));
</script>
```

**Note:** This method of using `document.write` may be blocked in certain browsers in certain situations. More information can be found [here](https://www.chromestatus.com/feature/5718547946799104).
