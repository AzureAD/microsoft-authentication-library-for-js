window.BENCHMARK_DATA = {
  "lastUpdate": 1691538530594,
  "repoUrl": "https://github.com/AzureAD/microsoft-authentication-library-for-js",
  "entries": {
    "msal-node client-credential Regression Test": [
      {
        "commit": {
          "author": {
            "name": "AzureAD",
            "username": "AzureAD"
          },
          "committer": {
            "name": "AzureAD",
            "username": "AzureAD"
          },
          "id": "4427febf5406ebf42cd52fa26ac9faab3c37ed3e",
          "message": "Added msal-node client-credential regression test",
          "timestamp": "2023-08-08T12:14:05Z",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/pull/6276/commits/4427febf5406ebf42cd52fa26ac9faab3c37ed3e"
        },
        "date": 1691518862345,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 148704,
            "range": "±1.64%",
            "unit": "ops/sec",
            "extra": "230 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 148248,
            "range": "±1.35%",
            "unit": "ops/sec",
            "extra": "235 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "name": "AzureAD",
            "username": "AzureAD"
          },
          "committer": {
            "name": "AzureAD",
            "username": "AzureAD"
          },
          "id": "af3472bc38b5915403350c70e11915fae9a59466",
          "message": "Added msal-node client-credential regression test",
          "timestamp": "2023-08-08T12:14:05Z",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/pull/6276/commits/af3472bc38b5915403350c70e11915fae9a59466"
        },
        "date": 1691526470294,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 570076,
            "range": "±1.68%",
            "unit": "ops/sec",
            "extra": "219 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 445514,
            "range": "±1.00%",
            "unit": "ops/sec",
            "extra": "163 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "name": "AzureAD",
            "username": "AzureAD"
          },
          "committer": {
            "name": "AzureAD",
            "username": "AzureAD"
          },
          "id": "9fdec9a69913f3451f271dfc00aeadf4913ce55f",
          "message": "Added msal-node client-credential regression test",
          "timestamp": "2023-08-08T12:14:05Z",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/pull/6276/commits/9fdec9a69913f3451f271dfc00aeadf4913ce55f"
        },
        "date": 1691538529484,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 139573,
            "range": "±1.53%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 133642,
            "range": "±2.27%",
            "unit": "ops/sec",
            "extra": "213 samples"
          }
        ]
      }
    ]
  }
}