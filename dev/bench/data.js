window.BENCHMARK_DATA = {
  "lastUpdate": 1693423475960,
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
          "id": "9875ec23c7773b96688999aac5bf020634dad59a",
          "message": "Added msal-node client-credential regression test",
          "timestamp": "2023-08-30T18:29:03Z",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/pull/6276/commits/9875ec23c7773b96688999aac5bf020634dad59a"
        },
        "date": 1693423475014,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 150652,
            "range": "±1.65%",
            "unit": "ops/sec",
            "extra": "231 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 152689,
            "range": "±1.18%",
            "unit": "ops/sec",
            "extra": "232 samples"
          }
        ]
      }
    ]
  }
}