window.BENCHMARK_DATA = {
  "lastUpdate": 1691518863068,
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
      }
    ]
  }
}