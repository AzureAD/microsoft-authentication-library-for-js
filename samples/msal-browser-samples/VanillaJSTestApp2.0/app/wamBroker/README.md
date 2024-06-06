# WAM Broker Sample

This sample can be used to acquire device bound tokens from WAM (Web Account Manager). This feature is currently only available on Windows machines using the [Windows Accounts Chrome extension](https://chrome.google.com/webstore/detail/windows-accounts/ppnbnpeolgkicgegkbkbjmhlideopiji).

This sample must be served over https by running the following command:

```bash
npm run generate:certs
npm start -- --s 'wamBroker' --https
```
