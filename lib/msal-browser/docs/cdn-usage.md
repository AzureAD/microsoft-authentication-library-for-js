# CDN Usage for @azure/msal-browser

In addition to npm, `msal` can be consumed from Microsoft-hosted CDNs.

## Best Practices

* Use the latest version of MSAL.js v2.
* Use the minified build in production, unminified build for development.
* Use the Microsoft CDN instead of third-party CDNs.
* Use the CDN region nearest to your users.
* Use the `async` or `defer` attributes to not block page rendering.
* Use the `integrity` attribute to ensure integrity of CDN builds.
* IE11 support requires a Promise polyfill ([more information](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-browser-samples/VanillaJSTestApp2.0/app/ie11-sample) on IE11 support).

## Basic Usage

<!-- CDN_LATEST -->
```html
<script type="text/javascript" src="https://alcdn.msauth.net/browser/2.11.0/js/msal-browser.min.js"></script>
```

## Unminified builds

In addition to minified builds, unminified builds for each version are also available (as `msal-browser.js` instead of `msal-browser.min.js`)

```html
<!-- Replace <version> with desired version, e.g. 2.3.0 -->
<script type="text/javascript" src="https://alcdn.msauth.net/browser/<version>/js/msal-browser.js"></script>
```

## Alternate region

Microsoft offers CDN builds hosted in two different regions, US West and Europe North.

CDN Domain          | Region       | Example
--------------------| -------------| --------
`alcdn.msauth.net`  | US West      | `https://alcdn.msauth.net/browser/<version>/js/msal-browser.min.js`
`alcdn.msftauth.net`| Europe North | `https://alcdn.msftauth.net/browser/<version>/js/msal-browser.min.js`

### CDN fallback

In the unlikely event that a CDN build is broken or the CDN itself is inaccessible, an application can use the other CDN region as a fallback:

```html
<script type="text/javascript" src="https://alcdn.msauth.net/browser/2.3.0/js/msal-browser.min.js"></script>
<script type="text/javascript">
    if(typeof Msal === 'undefined')document.write(unescape("%3Cscript src='https://alcdn.msftauth.net/browser/2.3.0/js/msal-browser.min.js' type='text/javascript' %3E%3C/script%3E"));
</script>
```

**Note:** This method of using `document.write` may be blocked in certain browsers in certain situations. More information can be found [here](https://www.chromestatus.com/feature/5718547946799104).

## Subresource Integrity

From [MDN](https://developer.mozilla.org/docs/Web/Security/Subresource_Integrity):

> Subresource Integrity (SRI) is a security feature that enables browsers to verify that resources they fetch (for example, from a CDN) are delivered without unexpected manipulation. It works by allowing you to provide a cryptographic hash that a fetched resource must match.

> Using Content Delivery Networks (CDNs) to host files such as scripts and stylesheets that are shared among multiple sites can improve site performance and conserve bandwidth. However, using CDNs also comes with a risk, in that if an attacker gains control of a CDN, the attacker can inject arbitrary malicious content into files on the CDN (or replace the files completely) and thus can also potentially attack all sites that fetch files from that CDN.

> Subresource Integrity enables you to mitigate some risks of attacks such as this, by ensuring that the files your web application or web document fetches (from a CDN or anywhere) have been delivered without a third-party having injected any additional content into those files — and without any other changes of any kind at all having been made to those files.

It is highly recommended to use SRI Hashes with CDN builds of MSAL.js to help secure your application and the authentication artifacts (e.g. access tokens) that MSAL.js stores in the browser.

### MSAL.js SRI Hash Example

```html
<script
    type="text/javascript"
    src="https://alcdn.msauth.net/browser/2.3.0/js/msal-browser.min.js"
    integrity="sha384-o+Sncs5XJ3NEAeriM/FV8YGZrh7mZk4GfNutRTbYjsDNJxb7caCLeqiDabistgwW"
    crossorigin="anonymous"></script>
```

### SRI Hash Notes
- Each hash will be unique to the version of MSAL.js v2, and will not change.
- SRI hash usage is optional for MSAL.js CDN builds.
- If the `integrity` attribute is used for MSAL.js v2 CDN builds, the `crossorigin` attribute must be set to `"anonymous"`. 
- If you believe our CDN builds have been comprimised, please [inform us](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/SECURITY.md#reporting-a-vulnerability) immediately.


### SRI Hash History

<!-- SRI_TABLE_START -->
Version      | Build               | SRI Hash
------------ | ------------------- | ---------------------------
2.11.0        | msal-browser.js     | `sha384-4PutheeyrGgwghN7WV8QaHBshN673W9fDW3PDP0Zw1Wm9CVZIuU2RFSWfcxEWAR0`
2.11.0        | msal-browser.min.js | `sha384-mxc9xXB8zELCYWdhT4JCez24AMsgk+uN7e991ek2TrQy9rBPVlUiuppobVCuja8S`
2.10.0       | msal-browser.js     | `sha384-h4/puysjUElY8ygLCfA1sWMW/y1DsRmX02pAa6Om71bq6qS/w9PzLjby6YTkgH6W`
2.10.0       | msal-browser.min.js | `sha384-UiyYbBRwVt3gTqaQfkEn8ceYV1cB9KAofImJ8nOc/vdqHATCuzgGZhxWgkhPBjNe`
2.9.0        | msal-browser.js     | `sha384-+akJUidBAUlm36Zv/ib9eOD+CZDJ67/yVEPaDV9aNw7164awXZbuEjLnsxDXuQO1`
2.9.0        | msal-browser.min.js | `sha384-MUSnn9XLYFUDadNpWJyizBT8WbNR2FGs9zcvZG1GbEwFSK59dFTUESMnAtN6Edgg`
2.8.0        | msal-browser.js     | `sha384-Mjsbb/z4VVY/1KEUcSY4zG2SObmLbGdEQp1a6qJ8x4Qkd8HqhBmkigPO1LO+ZKC8`
2.8.0        | msal-browser.min.js | `sha384-b/qP1MqDbgDE3TTcBfXi4/r9pcSjPbT1lTVl5Q71LhQMpn95C4bDE8+83ImeSE+l`
2.7.0        | msal-browser.js     | `sha384-5Fqyq1ncNYhL2mXCdWAFXkf2wWtKeA0mXYp++ryAX1lowD0ctAHFdity37L/ULXh`
2.7.0        | msal-browser.min.js | `sha384-isB7RsMD9bXfK4BK9pJHfTyTfQMM/KQ/1a58J/PVsDFbto29TgNxOP3ZyrhRyiTV`
2.6.1        | msal-browser.js     | `sha384-kHVR+hnKKUXpL5UEI3dgmdIKZgopBagC1RdQytFqglEGROvOSAGJRkaFWfu8VsSx`
2.6.1        | msal-browser.min.js | `sha384-ry0iBug2qnSSs0YiS8IfxgvYZvgsCCXiplbiwrf9tQWkpCFMcezBMuLDbVtYrKIl`
2.6.0        | msal-browser.js     | `sha384-MOtTwBzAcbzhOnPuklGgFJINWfT6ekHPIhI0GkJdUihkt/AtO/ttlrT93yen631k`
2.6.0        | msal-browser.min.js | `sha384-sGG/3pGinkV/9X/+VrbuRSSJmOaYKq9Bdyet6ICHajSN8wSG9DpJHda6vls5BkUd`
2.5.2        | msal-browser.js     | `sha384-ZOWQBoErNmfc9sfHh6PXYc9NZ+02cf5d+wdsnvfKHSEyQ2x+YSWaf12KInVhfurI`
2.5.2        | msal-browser.min.js | `sha384-A9ludGsBPhx3Ec8zLyd3vZEqJrRbvD6fJWpasbzAFyaaa/AMR6rtCUtbUmP07rsj`
2.5.1        | msal-browser.js     | `sha384-MFZe/UOLz61FRpO06noy2uBkJEZUaxccyYYwrSrwBOEY59Fi0GxyRzPiiZKLvvkC`
2.5.1        | msal-browser.min.js | `sha384-/cOXpDxWc4bzFZUDf49Sp31Im+bSjki6UxTPadEDitHw0277qGX5teCOdieziPZh`
2.5.0        | msal-browser.js     | `sha384-JtZbGQvK0HbNDG42cgeg3XxEllLbMW8aAiSCXoLdW7iJhkdC7v4Kzqvl4LWOSiFF`
2.5.0        | msal-browser.min.js | `sha384-+sjqS/ee1BeZqojCMFh8gGTbZ0ATgrA/rEIANI0l0Y6QdA+MDwmXLhj3JGvHueL7`
2.4.1        | msal-browser.js     | `sha384-4Equw/X3Wp2XPnMSCbe2OQQRE/8MzlwepR53zKGbAz/6eO//yRXOcn3LKf1MnBWS`
2.4.1        | msal-browser.min.js | `sha384-vazVaX5+cCJf+t0Dzdb8CxX9jLLvWuSZqEI2lBSMeLUBPQovS4IlwFQI6epI2tJD`
2.4.0        | msal-browser.js     | `sha384-Bz0kggjHC0kxcxxtRzWgjaF0JGsmHuO1atz26xKETeu5WgdarvGmr9Pr/f/pKtrq`
2.4.0        | msal-browser.min.js | `sha384-tBRIK0qPn8yxGmyhpgVsVIFaJNa0EDL62hp+zvDu1vtT1bIqWU6HiYexMhtk52bP`
2.3.1        | msal-browser.js     | `sha384-khe4Bq8VcpAsK8zAycaYefEMHsLny9P/kgPF9Jy1afhFNZ4EODmrdq//+LFp1mWV`
2.3.1        | msal-browser.min.js | `sha384-d6fJLwOshjtqjJPGMQ4XgIKOvx46EBeyiPxTBaNJlj0GWqXKCh09qA6SgpAPnqD8`
2.3.0        | msal-browser.js     | `sha384-ILJg8BOvXQwFGYEbkLVLYTYoNpTT7tP905UubLu2AqwksVdddAu5z9k3e6gMhqc5`
2.3.0        | msal-browser.min.js | `sha384-o+Sncs5XJ3NEAeriM/FV8YGZrh7mZk4GfNutRTbYjsDNJxb7caCLeqiDabistgwW`
2.2.1        | msal-browser.js     | `sha384-M6zl9i1upj9LPj3zSUn/IejJwPyUCewu0+RD444XuWQiRomvb2ZUwanqc0c2XfCy`
2.2.1        | msal-browser.min.js | `sha384-8LDT8A5GReznR7uR2KGWc1Ep/kTc0ErU3yVBKJMOmAMoSf+hMonk3y3BceQ1rvF6`
2.2.0        | msal-browser.js     | `sha384-DDogsvdm1j1csBm8TKIenLTaFJA+x0KjwdW0CAx6ZW8+5EOqSIasS3OKZ0aiq3RV`
2.2.0        | msal-browser.min.js | `sha384-ywaKEa0KdH8yiwoKS+2hRMenFDilyhT/K0r3WTXBzUQj+RNlYGnLeecytOEdgHpR`
2.1.0        | msal-browser.js     | `sha384-M9bRB06LdiYadS+F9rPQnntFCYR3UJvtb2Vr4Tmhw9WBwWUfxH8VDRAFKNn3VTc/`
2.1.0        | msal-browser.min.js | `sha384-EmYPwkfj+VVmL1brMS1h6jUztl4QMS8Qq8xlZNgIT/luzg7MAzDVrRa2JxbNmk/e`
2.0.2        | msal-browser.js     | `sha384-rQvomuvjVybeTxLQIpbtb6lqFsDuJparCjjUJZjRZjVDNzGRloXbPj9qbgf9YM/d`
2.0.2        | msal-browser.min.js | `sha384-zHGbJmHXAWMXaREIK7qFkrJCcU2ktJd8G9DAp49Q+y/+H6ArVhvFUW5IbyTzbNnn`
2.0.1        | msal-browser.js     | `sha384-knPh00kvaT+k3+4TCD5S2ORDNVc2I3RVbqI/ksbTlpdSBh8ZnyAPxW2kkTSG0+mT`
2.0.1        | msal-browser.min.js | `sha384-fbyYRj8H9iJU/JyncEbzW6WgVOaR5C+PU1dHsRBg2Ag2Q14F4IB8+T8BdknwjRQ8`
2.0.0        | msal-browser.js     | `sha384-BqIcDtzVkr3wRGsSrk+iJJNm9GSdUsP0I2MplbnhPPc+I1l1d+dkKbcnqgNddGWX`
2.0.0        | msal-browser.min.js | `sha384-n3aacu1eFuIAfS3ZY4WGIZiQG/skqpT+cbeqIwLddpmMWcxWZwYdt+F0PgKyw+m9`
2.0.0-beta.4 | msal-browser.js     | `sha384-7sxY2tN3GMVE5jXH2RL9AdbO6s46vUh9lUid4yNCHJMUzDoj+0N4ve6rLOmR88yN`
2.0.0-beta.4 | msal-browser.min.js | `sha384-j9+OYwF1QFM1A8/DNvWKqvTw+bc5alOXQ7IA2WvGAcLLLpN/tK9XRTbJtlTiSFJI`
2.0.0-beta.3 | msal-browser.js     | `sha384-iKgpFzdbMAsg695JG+EmHleQe5gRjoAAixuMf0jfM7pCOVuGqhyBuXO1Ai71fixx`
2.0.0-beta.3 | msal-browser.min.js | `sha384-X2nv+6ViZGj+UCfGAbimHAXpBEAi0RA6GWuqCckbMLU5jVr8uDjf6pGUvTkq7wME`
2.0.0-beta.2 | msal-browser.js     | `sha384-CEQpk7EG1PVKCHHdoQzDdR5uU7nJ1PLlcdx1s7vi8Ta/Pndhr04imhqCUkZGimOj`
2.0.0-beta.2 | msal-browser.min.js | `sha384-O3n9nwTefR6cSLikBQsCDYke2pWL5YWluwvp0RgGe+VK2eU0+RJC1cmMow5jD1OE`
2.0.0-beta.0 | msal-browser.js     | `sha384-r7Qxfs6PYHyfoBR6zG62DGzptfLBxnREThAlcJyEfzJ4dq5rqExc1Xj3TPFE/9TH`
2.0.0-beta.0 | msal-browser.min.js | `sha384-OV4a42kPPZv7IxRWcyqoLn9Ohs0g1WXejuNceZxAE9usAfLVFBcdre9yqo4I03VN`
