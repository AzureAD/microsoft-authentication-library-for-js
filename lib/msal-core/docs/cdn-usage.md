# CDN Usage for MSAL.js

Microsoft offers a CDN-hosted version of MSAL.js as an alternative to npm.

## Latest compiled and minified JavaScript
```html
<script type="text/javascript" src="https://alcdn.msauth.net/lib/1.2.1/js/msal.min.js"></script>
````
```html
<script type="text/javascript" src="https://alcdn.msauth.net/lib/1.2.1/js/msal.js"></script>
```

### Alternate region URLs

To help ensure reliability, Microsoft provides a second CDN. The only difference is the domain, which is `alcdn.msftauth.net` instead of `alcdn.msauth.net`:

```html
<script type="text/javascript" src="https://alcdn.msftauth.net/lib/1.2.1/js/msal.js"></script>
```
```html
<script type="text/javascript" src="https://alcdn.msftauth.net/lib/1.2.1/js/msal.min.js"></script>
```

Below is an example of how to use one CDN as a fallback when the other CDN is not working:

```html
<script type="text/javascript" src="https://alcdn.msauth.net/lib/1.2.1/js/msal.js"></script>
<script type="text/javascript">
    if(typeof Msal === 'undefined')document.write(unescape("%3Cscript src='https://alcdn.msftauth.net/lib/1.2.1/js/msal.js' type='text/javascript' %3E%3C/script%3E"));
</script>
```

**Note:** This method of using `document.write` may be blocked in certain browsers in certain situations. More information can be found [here](https://www.chromestatus.com/feature/5718547946799104).

## Subresource Integrity

We now use Subresource Integrity to provide a better and more secure way of accessing the MSAL JS library. Subresource Integrity (SRI) helps to mitigate the risks of third parties injecting any additional or malicious content into library code.

We recommend including the SRI Hash with all script tags when using `msal.js` or `msal.min.js` (including when using a third-party CDN), but loading your single-page application will succeed even if the SRI information is missing. When providing the SRI Hash, you *must* also provide the `crossorigin="anonymous"` field in the same tag.

## Resources:
- [Subresource Integrity (SRI) on MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [Identity Blog post](https://developer.microsoft.com/identity/blogs/new-cdn-urls-and-subresource-integrity-hash-for-msal-js/)

### Latest version

```html
<script type="text/javascript" src="https://alcdn.msauth.net/lib/1.2.1/js/msal.min.js" integrity="sha384-Z4L5heyGO9VZ/MBCDx9GRtQW50Hrmp32ByIKuqwFesWyB+MDNy9ueVgclolfwj1Q" crossorigin="anonymous"></script>
```

```html
<script type="text/javascript" src="https://alcdn.msauth.net/lib/1.2.1/js/msal.js" integrity="sha384-9TV1245fz+BaI+VvCjMYL0YDMElLBwNS84v3mY57pXNOt6xcUYch2QLImaTahcOP" crossorigin="anonymous"></script>
```

### Past versions

#### Minified
Version | CDN URL | SRI Hash
--------------- | ------- | ---------------------------
1.2.1 | https://alcdn.msftauth.net/lib/1.2.1/js/msal.min.js | `sha384-Z4L5heyGO9VZ/MBCDx9GRtQW50Hrmp32ByIKuqwFesWyB+MDNy9ueVgclolfwj1Q`
1.2.0 | https://alcdn.msftauth.net/lib/1.2.0/js/msal.min.js | `sha384-bUAfT3zjpyf+nuTqeGYWk7ZKN6E89ouvkiXth6G45RG55uQERls6TtStVOBM6v4O`
1.1.3 | https://alcdn.msftauth.net/lib/1.1.3/js/msal.min.js | `sha384-dA0Vw9s8Y8YiIYiE44WOORFrt3cwi0rYXwpetCRnFYziAtXEZ4miG8TMSGo8BIyL`
1.1.2 | https://alcdn.msftauth.net/lib/1.1.2/js/msal.min.js | `sha384-P7DiH/MUUHD1d41S0b9x5aPAVjW9uikNHFkeERTC7JzltKCx0E7VjZeRFiFL/4Wn`
1.1.1 | https://alcdn.msauth.net/lib/1.1.1/js/msal.min.js | `sha384-5uId2MNKlSyxh7xL1+dfiFQhD+sKb2qLVjX4uLrDIgnzbXOZmjO9LRjaAJbzTzKq`
1.1.0 | https://alcdn.msauth.net/lib/1.1.0/js/msal.min.js | `sha384-XDORa6Kv553jB6XjaWfbPOjNVJOxBdB7NfvVtFeUTNfm9LOLYyNqPPr44xxOzyxb`
1.0.2 | https://alcdn.msauth.net/lib/1.0.2/js/msal.min.js | `sha384-qG5KUExZdZCA9qjuYVyoqr7gTT+8MtThFPct1V4bcH9YiN2Z+JNlV0WUhHt3WcHO`
1.0.1 | https://alcdn.msauth.net/lib/1.0.1/js/msal.min.js | `sha384-U8/FAuo2D2BkQz7U9Y6EJwnXm7mk+IVbyIyjBgNQvcXeElulyqy4t+3NcjN5bwWF`
1.0.0 | https://alcdn.msauth.net/lib/1.0.0/js/msal.min.js | `sha384-JrnDP9rGv/2Y3Hr/tAea/SvhMgKvfPHCK7GsjK4xH326K9AdRVUkgqS6cgG9qcLL`
0.2.4 | https://alcdn.msauth.net/lib/0.2.4/js/msal.min.js | `sha384-5PUwk+rp+Yovytrq8poRG4BH3iqRdwgKUKgbnrpPVuLtu51QnrmXPBRITW50QaYK`
0.2.3 | https://alcdn.msauth.net/lib/0.2.3/js/msal.min.js | `sha384-rGkLRqTkhrP/8flhd9MYSHI5+E7Es5QKgUYIdsmhHW4Gjj1duJ41xBj600oBj2fw`
0.2.2 | https://alcdn.msauth.net/lib/0.2.2/js/msal.min.js | `sha384-T4Bau4NWVmN0/P14uu/aqADN3egjj1Pvn3bydxBuYFT09JnhNT5CzTtEULlN+5Zp`
0.2.1 | https://alcdn.msauth.net/lib/0.2.1/js/msal.min.js | `sha384-2Rbtg6QnsSz+tp51dDnhxraEQFlYlYzdSM+j7kMfsQdR5H86QujbMZVwuaiIosjx`
0.2.0 | **https://unpkg.com/msal@0.2.0/dist/msal.min.js | `sha384-n13CoO6Xjx5zg79xLnO5d+lyt2jpNlw3lUzIKLBOkxdK/KH9KzCEsD9RlqU3dLdx`
0.1.9 | **https://unpkg.com/msal@0.1.9/dist/msal.min.js | `sha384-FImOwJKtnTSlcPHnbdOxnqKUrdaaJB+saURHpcRgoki6gLJQtErBLAdn1IaXykZD`
0.1.7 | https://alcdn.msauth.net/lib/0.1.7/js/msal.min.js | `sha384-03REuRoep6LXaceVjSD3J4G8PPG0aq7RltVKBpiOOfboMX4NuoGXhwRTOmaWKGeE`
0.1.6 | https://alcdn.msauth.net/lib/0.1.6/js/msal.min.js | `sha384-xUeuBhJkqQNsSqC/Vp+iBbTmJYPKaQZmHw1FmItaMeO6cPxke0oWF7WKuGGSQXwZ`
0.1.5 | https://alcdn.msauth.net/lib/0.1.5/js/msal.min.js | `sha384-KSEL5Lw2KU3hDQ5shS768AepsDAW0LzJupGsVCcklTE+E83tCE2XXLRNifFil9F/`
0.1.4 | **https://unpkg.com/msal@0.1.4/dist/msal.min.js | `sha384-PjgsBxpE55yEIOc+e3yfov1FbJNrdxkg2QOWb9fUG5o9QEZssu2tz0V4yW6SmXrp`
0.1.3 | https://alcdn.msauth.net/lib/0.1.3/js/msal.min.js | `sha384-PtTU30L4CXXXOrXyjQOLCgYJA7ESNa/YCaFtDzGybniBc1rkOaIFGIZPIA1qH+ap`
0.1.2 | https://alcdn.msauth.net/lib/0.1.2/js/msal.min.js | `sha384-DjA4Q2EsrVJMQYcR0ka2RSCIIPZrkBkAepuyK7+RxnKn6HHiyRtdOg0AsQzz1ApH`
0.1.1 | https://alcdn.msauth.net/lib/0.1.1/js/msal.min.js | `sha384-wdwhRVZfSWHMht/NRBdseg06tAW6HjJ78TEgwV9JsQyeluZED3S7w54gv8wu6Woj`
0.1.0 | https://alcdn.msauth.net/lib/0.1.0/js/msal.min.js | `sha384-ujQ7X/OxofE4MyPDIJJ1xBikz56E3pSqtH9YG3KI4uKM1jnu0ncIzWAlK3jmLfxJ`

### Unminified

Version | CDN URL | SRI Hash
--------------- | ------- | ---------------------------
1.2.1 | https://alcdn.msftauth.net/lib/1.2.1/js/msal.js | `sha384-9TV1245fz+BaI+VvCjMYL0YDMElLBwNS84v3mY57pXNOt6xcUYch2QLImaTahcOP`
1.2.0 | https://alcdn.msftauth.net/lib/1.2.0/js/msal.js | `sha384-LSjD9o5MhT3UejOHZ5BJrlAp3TxNM6z68DPYw3o7Q3ApJviS9kOGP0oQyTaJJd9O`
1.1.3 | https://alcdn.msftauth.net/lib/1.1.3/js/msal.js | `sha384-m/3NDUcz4krpIIiHgpeO0O8uxSghb+lfBTngquAo2Zuy2fEF+YgFeP08PWFo5FiJ`
1.1.2 | https://alcdn.msftauth.net/lib/1.1.2/js/msal.js | `sha384-7Tfmyt6LHvfAaFOyMO+xB2LNlizyoOqOjTpE5TozyuKLeLJCY+aeG8jTPUU/a/eu`
1.1.1 | https://alcdn.msauth.net/lib/1.1.1/js/msal.js | `sha384-lhlN+mWnVW/0gtymN2LvVNcVCqEkUZ7bEGJ6/S310LrK23y+BIC/ZWEv9i3BCfrp`
1.1.0 | https://alcdn.msauth.net/lib/1.1.0/js/msal.js | `sha384-53AIYbe0k1eWy4fjgOhYSb8AlZQXWK1FRnrXsdiH8DG6SDDF/TRQmBh9vx99l+rV`
1.0.2 | https://alcdn.msauth.net/lib/1.0.2/js/msal.js | `sha384-+k01G9iZEvDJV+pT6/HBWt3sPtAzmO2Np96PfJcLalUAuAIDsXAs5BGmtESC+sLL`
1.0.1 | https://alcdn.msauth.net/lib/1.0.1/js/msal.js | `sha384-iKfqIXg4/mwitg1zYpvVnHCce523K9+EI86HrFFLKU+FSbDA7qXQtGIsRoj+0Ymg`
1.0.0 | https://alcdn.msauth.net/lib/1.0.0/js/msal.js | `sha384-2f5zZtNBJYY5SYk6iemfozas1aVScvY8KGBTzm9K3qsUwJ5d0wB8qmXUjWfFuEZt`
0.2.4 | https://alcdn.msauth.net/lib/0.2.4/js/msal.js | `sha384-DbDPH21H9wAvWxiluBCwk+1CNFwul7V0MO6moVjDrt5PFoId2Gm8pYamyK0xZjDU`
0.2.3 | https://alcdn.msauth.net/lib/0.2.3/js/msal.js | `sha384-w+80VVyNNjw0X1E81uQOBlm8/EKE16XFyuZ4gUzevKSpCjl4K2fw57hDiA39azF7`
0.2.2 | https://alcdn.msauth.net/lib/0.2.2/js/msal.js | `sha384-/7xln9Vkx+PpbQYTYkGGG5puwiWvR26PMZxsSQMc2Xmq8F9bgQCec8F8lOo/Uj+7`
0.2.1 | https://alcdn.msauth.net/lib/0.2.1/js/msal.js | `sha384-y9LAto4rX9LoIRNtpHnrNxHnRyUWvrKUWm8XXGUaK78F3+shpFU8RfaHl1RUDXld`
0.2.0 | **https://unpkg.com/msal@0.2.0/dist/msal.js | `sha384-bBwydq6xJWMgLVvNd/Bwzh0R/QZRsvX/arOoUbl+VtwxWVyBhdKUAqP5tymnXiee`
0.1.9 | **https://unpkg.com/msal@0.1.9/dist/msal.js | `sha384-bkbxTzKQkGwQMrzrqPjuj8mTJghd1utNEWkG/DPLgRMSXfMFjo2AEyJML8aQZFqK`
0.1.7 | https://alcdn.msauth.net/lib/0.1.7/js/msal.js | `sha384-V2fjJ4EKwqdRAvTUB54d0jDR07pKdN5XeWiRqjUPC3ek7syTc3cVIorrXAFMElBO`
0.1.6 | https://alcdn.msauth.net/lib/0.1.6/js/msal.js | `sha384-BSOMa8wVfZFZ6ErZw72zgFOoeEgFUlFRkmt4hxHCVZtLTfc+N/e8spXZat+3K86H`
0.1.5 | https://alcdn.msauth.net/lib/0.1.5/js/msal.js | `sha384-fRkpvOupH96TWiZMYDoN6zCqbG01O+LCl2aKfZ1XxyaLSnI903q4xv+P8BjYAiLk`
0.1.4 | **https://unpkg.com/msal@0.1.4/dist/msal.js | `sha384-I+3yWlmqOC5r45O+ed1I5jkjs4xztL7xtBS3qkndksNPezP3DLtcuZNBUfE/VR4r`
0.1.3 | https://alcdn.msauth.net/lib/0.1.3/js/msal.js | `sha384-L893gVjbtwElcL0/wshC+nfZoT6u9mj1rHjRfiJlW4rXWSaXjhObY/0ifLdN8AjJ`
0.1.2 | https://alcdn.msauth.net/lib/0.1.2/js/msal.js | `sha384-WU4HUYQCGQ264Sip5uczU5yCoizGy8F6l20Vw4+k1i+CjPXvPt/7BHsCSywsZmXQ`
0.1.0 | https://alcdn.msauth.net/lib/0.1.0/js/msal.js | `sha384-bzGfjWVfU/wbUCkSOkshyxkxu3T3GgLZ4h6a/BAS5domaRxtf/2PbuiFI48PNjt+`

** **Note**: The MSAL versions at these URLs are only available through NPM, not the Microsoft CDN. Until this can be resolved, developers must use third-party CDNs with the above SRI Hashes to serve them.
