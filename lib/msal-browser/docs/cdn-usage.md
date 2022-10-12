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
<script type="text/javascript" src="https://alcdn.msauth.net/browser/2.30.0/js/msal-browser.min.js"></script>
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
    if(typeof msal === 'undefined')document.write(unescape("%3Cscript src='https://alcdn.msftauth.net/browser/2.3.0/js/msal-browser.min.js' type='text/javascript' %3E%3C/script%3E"));
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
2.30.0        | msal-browser.js     | `sha384-o4ufwq3oKqc7IoCcR08YtZXmgOljhTggRwxP2CLbSqeXGtitAxwYaUln/05nJjit`
2.30.0        | msal-browser.min.js | `sha384-HC34/sGr6mESU7p33Bo1s3lWvYOdfDnu05vmaJFpSvHZbTUdKWIOxIn5SuZnqafp`
2.29.0        | msal-browser.js     | `sha384-L8LyrNcolaRZ4U+N06atid1fo+kBo8hdlduw0yx+gXuACcdZjjquuGZTA5uMmUdS`
2.29.0        | msal-browser.min.js | `sha384-CirgUajm2J/qIZ/u+TqkKMfxFdAhX0Q5UDQ0lJR0cMZam8SP6WASMDgG6ZuH9YU2`
2.28.3        | msal-browser.js     | `sha384-OnQxm8gBWqXtcrgb4TGKgQsKvNFDAVRb/LYrQ4SkYg6nYK+vg9oC/OF6+KRmqwGn`
2.28.3        | msal-browser.min.js | `sha384-LTsAmgDln/CC82A+RiT/7SX65gRIMoqFU6jclq+TzHTa3ydfY6ex6J3LO1pyLC1/`
2.28.2        | msal-browser.js     | `sha384-bTszrDBNEw/vuvCJ58o9obswP5dg379zO8MJx53LyZCsKsSnrErje1LM+6Bk8Lkl`
2.28.2        | msal-browser.min.js | `sha384-203jB5A+1LERtg89ajpErgNu5XzbM4Hye182KOJTVuHD19rezlVuwnwQ3WVbhZVF`
2.28.1        | msal-browser.js     | `sha384-M6geA+l92SitR/WGDtbiK0tt/MAv3qimyNK2vaOatn2c+OrHVbwYaG85IIlSq7eY`
2.28.1        | msal-browser.min.js | `sha384-ei8xVSyFPTuRnbO1sdYy5qJT6Kd9neBfVG8AjZySEwdMG1GhCThbceSqxJnx0Ci3`
2.28.0        | msal-browser.js     | `sha384-q8S4bw8Wfzedv3LPXdOP0+IKu+LqXg4l9xZaOwTp3h40FYMw6YeO/6FX+aG6vgXx`
2.28.0        | msal-browser.min.js | `sha384-dKtQ/y8SrxV+8eZsQnb3vQpwWP57fRau9cbe4FbFK6B+VSC5SaWTM9w6lwQdNhKG`
2.27.0        | msal-browser.js     | `sha384-CsXI9QUbEXvbc1SIiLQ1/sUNkZZfkQSamJ2YU4g/yDKQNDyn8D2HTgR1ww7QV5+U`
2.27.0        | msal-browser.min.js | `sha384-IlUQkOwOI6mWk8GNIWu8hpPE1sasxSg3gGjZo0dncq6IhHsTlH51mp5mhFYS5po1`
2.26.0        | msal-browser.js     | `sha384-fitpJWrpyl840mvd9nBFLGulqR4BJzvim0fzrXQKdsVh2AQzE4rTTJ0o5o+x+dRK`
2.26.0        | msal-browser.min.js | `sha384-VdtLJ4gW9+dszXDbJEzdUFYI+xq4hXfOGntgGlDve3qz/5WEzWjLeN1voiro74af`
2.25.0        | msal-browser.js     | `sha384-zezf4cRFK/02dUQFQjo+qA3OjwpHtgizVgd4wMyxG2bWNy2TxzKe1CqIyBYWRJxF`
2.25.0        | msal-browser.min.js | `sha384-dDqLsp/gmQFrDNIjpyKi23AtweUuA2Hn3wnwxOr+IwWGC8Zock5gcEwvLAkvvXh/`
2.24.0        | msal-browser.js     | `sha384-NcVVwcZIMSdYk9wbu0m7mElxxmQMIMRVSXXkF53lT+d41bXftjpIs8neU7xry4ch`
2.24.0        | msal-browser.min.js | `sha384-U+uxTX8q39oAXjbZ8Bp9eTNwAmwyS8Sq7afx4SiEUFTt4LRIEbZDcMmVE0K85Vze`
2.23.0        | msal-browser.js     | `sha384-dvhiAjRHm++5woziYGV/JQSredPVb/p0VCATrsE/Upv4VmhLrKo6MWW218QofKIG`
2.23.0        | msal-browser.min.js | `sha384-QxXqndv+Kkjr1gNW8SQUIE2zG/UT8lHYvf6HYdAAUj56xs9utgJNWyknd0O1CrUl`
2.22.1        | msal-browser.js     | `sha384-cKDVz4ain64nzHeJR0vejySPl0i8A6c7YfJI5ehEDQDoA5SSlb/zoLAFvXTQvTQS`
2.22.1        | msal-browser.min.js | `sha384-nCTmWvEOevLDR1A0WzHvi1PbktdL8pPPACO2UYs9NPp+TCEz0hE0c8JmMxRlNSjh`
2.22.0        | msal-browser.js     | `sha384-B46pTTVe+0LfqOtym4Ys6NnTk47DzGHgn83hf4JBDIUfgiZlYFaywZqzEYQYCg4b`
2.22.0        | msal-browser.min.js | `sha384-JmIjzXWxZ0+8Zd5wAsqkE9EKmxRx1ikmsnABsK9yFAbMmjOv9kSK4j560FLjkCxn`
2.21.0        | msal-browser.js     | `sha384-928QQ3wSVfsx4ZV1MR0896l8lK21YX1xWK3gSl8AW/lMEAZ2GeYqvFkm/VPzgn4y`
2.21.0        | msal-browser.min.js | `sha384-s/NxjjAgw1QgpDhOlVjTceLl4axrp5nqpUbCPOEQy1PqbFit9On6uw2XmEF1eq0s`
2.20.0        | msal-browser.js     | `sha384-Ky1dhcw3VPMuZV6VlVBcQBtWHs5Ry8rkG2LGdxdEOoaApfNShXhD3OQTgN3klUN5`
2.20.0        | msal-browser.min.js | `sha384-WV/465aYIrPn7bcKutSAFz+3JedxtCaRXxYu5EEjgGKPaOz7gjN06C8tBoGEmlZm`
2.19.0        | msal-browser.js     | `sha384-qMZg1SlV+Gm/R5MbEArouisSUHYzmBo05auTya2W3UOOr2Mlr2UvzzP1+nw5zc01`
2.19.0        | msal-browser.min.js | `sha384-VK+6hHt27itNFksZdEeXofJXdAhmlizHbC/a1TUUJm/Yq6gOuAjXKkiiCaGbFsnd`
2.18.0        | msal-browser.js     | `sha384-PERHHiF9DdKG6zSfxaBeyaXmEbHrKvJjvab6BjfKeufVnfveKzZLHGB6m213V4tT`
2.18.0        | msal-browser.min.js | `sha384-h9/gGcqbtmiQLu/34PC5wXvlxf+ugeTXcotRfHcjAIwyIB7UzyxcfNBcz3ONQiTz`
2.17.0        | msal-browser.js     | `sha384-LgNKCUpBSQJW+dWsseosd8ZZ7GNGiO+9SbgDBYyfqFkGJGg29VAzMQDYjK76r7o5`
2.17.0        | msal-browser.min.js | `sha384-nPvMTGGQIdPr+oK09URmAR99LAk9PEVLJE+RJfjIH/QADFbVgGlF9tFdVbgSYC+c`
2.16.1        | msal-browser.js     | `sha384-JNwcxoC2tyQMQnFA7pCGC8h4BSIlWY9ytKZv0tVvvFzlqsCj77gw9sa+0FlM5c0F`
2.16.1        | msal-browser.min.js | `sha384-bPBovDNeUf0pJstTMwF5tqVhjDS5DZPtI1qFzQI9ooDIAnK8ZCYox9HowDsKvz4i`
2.16.0        | msal-browser.js     | `sha384-W29UmqhBlCkSR5sC6sGVNkUpnNBI2hYRwB0/3wiCixcjzpXRLyByZbNOrx+xPiR/`
2.16.0        | msal-browser.min.js | `sha384-h/D+9sV4N/CFwWR6G+dv+dkByf17RfGMJZl5f9noj9QamUJdw6BW3xZPAVSWyG4A`
2.15.0        | msal-browser.js     | `sha384-dFzMiVGB5HpWZ+5w5VSif6jhWfNeplSw9ACYmQKZcY2azuT9kCxVWVI9HyfGdkHV`
2.15.0        | msal-browser.min.js | `sha384-/weuqUPkC0P9JxnstihEV1GHdWrheU9Qo3MbdTuxxKJM8l/cSTE5zGP5VBIM4TZN`
2.14.2        | msal-browser.js     | `sha384-SeRoSpLefUsASd6PTJsFeKDwITzOJ6gxSmsl+Z9Fl/hY2PAn/rKcw3WzoaBGc4my`
2.14.2        | msal-browser.min.js | `sha384-ggh+EF1aSqm+Y4yvv2n17KpurNcZTeYtUZUvhPziElsstmIEubyEB6AIVpKLuZgr`
2.14.1        | msal-browser.js     | `sha384-RRV2T1wXStSmpELGRUont/dBMwIOD45UU7pk2qP7msfNC5dBalYUq+7cO02NPSj1`
2.14.1        | msal-browser.min.js | `sha384-U3GjPGP2DZIb7AJBXk4B2quSe+7i4Dos1SqrcBwXPUkgnEZtnUBobrvAGXxpH6Cj`
2.14.0        | msal-browser.js     | `sha384-BiEwq81GpEOSES/Zj2TjBInBOQjHki/s0Si4VLT6JK2XoFX0cJK6HjII3W3eJ7DS`
2.14.0        | msal-browser.min.js | `sha384-WBY8oVVrEdSaZOKwHzdAhKjmFK8vz2bpQt90XIIBsBFJI8JtGteFQn6ngXmA3n9h`
2.13.1        | msal-browser.js     | `sha384-7hwr87O1w6buPsX92CwuRaz/wQzachgOEq+iLHv0ESavynv6rbYwKImSl7wUW3wV`
2.13.1        | msal-browser.min.js | `sha384-2Vr9MyareT7qv+wLp1zBt78ZWB4aljfCTMUrml3/cxm0W81ahmDOC6uyNmmn0Vrc`
2.13.0        | msal-browser.js     | `sha384-8WE3wV17rmapJTrZubql1Rziv4aZmDrlb7F3iZbiQEuOT7nmK8UH39MN2cEIOWQy`
2.13.0        | msal-browser.min.js | `sha384-vDONqKCGNcmVCJ/YQ6YHzbrhwKdihAE08TkDEHBZjgjqRYz5itQb7Rdst5Oy5GB+`
2.12.1        | msal-browser.js     | `sha384-QMpSjAFJzgh/J1zBL23Xx95KfVI1n9Je9GmB3byJbZ0/hj8o9CJTmxOK/BPZivil`
2.12.1        | msal-browser.min.js | `sha384-cZM20w+KzsO/N+6IGI+U1e2zsBS1ciCc6VdEC5SZ1/pHGyvcpE6D2uk0XcFwgb1q`
2.12.0        | msal-browser.js     | `sha384-WqJE0XrCKXbaCrjTk1+pq6qArRvxmGqf6YUBgoqwCz4WDXJFCW2hZZN0HMLE7/XB`
2.12.0        | msal-browser.min.js | `sha384-eD9W7ukFmFKtgjDgCWa6WpkuqKjQ5Q/EP686z9/t2DK93dQtdIx8LAhMc9Mjy3hA`
2.11.2        | msal-browser.js     | `sha384-Zr4eBs1XVPlVMD5df2RNBeFhTy62Z8nN//v8dOR8pAgf6iI9rBTuvRZJSGjGjOCQ`
2.11.2        | msal-browser.min.js | `sha384-MkT8/EXqCzh7OVmmpVdg5H2Fhpbt9uNrQM7UMbTg+v8fJVcfQ0BWf16siodTYgF6`
2.11.1        | msal-browser.js     | `sha384-LIpmPPrsEE7hCBPf0k4nn8zf9h8Z1i69YnG8TmRLTnaMDI6B2nGzLIh/c51BHgpN`
2.11.1        | msal-browser.min.js | `sha384-wgFLXq8mfWaFslz/C51m2NvUX7aBENCLEqRi9BNL+23HBfWkeFCGfvqaPGmAbrzC`
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
