window.BENCHMARK_DATA = {
  "lastUpdate": 1694552809578,
  "repoUrl": "https://github.com/AzureAD/microsoft-authentication-library-for-js",
  "entries": {
    "msal-node client-credential Regression Test": [
      {
        "commit": {
          "author": {
            "email": "87724641+Robbie-Microsoft@users.noreply.github.com",
            "name": "Robbie-Microsoft",
            "username": "Robbie-Microsoft"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "a82c117f78db078b733d173688b675991a3a57c7",
          "message": "Added msal-node client-credential regression test (#6276)\n\nThis PR introduces the beginnings of regression testing for msal-node\r\nconfidential client flows; In this specific case, the client credential\r\nflow. [BenchmarkJS](https://benchmarkjs.com/) is used to measure\r\nperformance of msal-node.\r\n\r\nSample output of BenchmarkJS looks like:\r\n<img width=\"1438\" alt=\"Screenshot 2023-07-31 at 1 29 10 PM\"\r\nsrc=\"https://github.com/AzureAD/microsoft-authentication-library-for-js/assets/87724641/f9dc302e-84b5-4ca8-820b-106502ab8684\">\r\n\r\nIf a regression of >10% is detected, github actions will leave a commit\r\ncomment:\r\n<img width=\"1882\" alt=\"Screenshot 2023-07-31 at 1 28 40 PM\"\r\nsrc=\"https://github.com/AzureAD/microsoft-authentication-library-for-js/assets/87724641/9e0a6252-baab-4c53-abee-69068bed3ed3\">\r\n[Example of commit comment when a fake regression was introduced to this\r\nPR.](https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/917e9c42e33b4eca9623242fa338d0a5fff48d15#commitcomment-123212353)\r\n\r\nEvery time a PR is merged into dev, the latest output from\r\n\"regression-tests/msal-node/client-credential/output.txt\" (if available,\r\nif the client-credential test was run on the PR) will be saved to the\r\nbranch \"gh-pages\", and will be available to visually see at:\r\n[https://azuread.github.io/microsoft-authentication-library-for-js/dev/bench/](https://azuread.github.io/microsoft-authentication-library-for-js/dev/bench/).",
          "timestamp": "2023-09-12T11:18:36-04:00",
          "tree_id": "f9d2a891452202e628fa9ac5b3229c1503cc704c",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/a82c117f78db078b733d173688b675991a3a57c7"
        },
        "date": 1694532223514,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 139132,
            "range": "±1.72%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 136047,
            "range": "±1.99%",
            "unit": "ops/sec",
            "extra": "205 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "kshabelko@microsoft.com",
            "name": "Konstantin",
            "username": "konstantin-msft"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "19eed25a69afd6d57caad4230cff9d333f91d309",
          "message": "Do not add v2.0 to authority endpoint if already exists (#6457)\n\n- Do not add v2.0 to authority endpoint if already exists.",
          "timestamp": "2023-09-12T11:52:53-04:00",
          "tree_id": "f4cecf5b5e4dc47538ec42ea074989774accf00f",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/19eed25a69afd6d57caad4230cff9d333f91d309"
        },
        "date": 1694534237118,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 150164,
            "range": "±1.10%",
            "unit": "ops/sec",
            "extra": "233 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 151409,
            "range": "±1.35%",
            "unit": "ops/sec",
            "extra": "227 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "thomas.norling@microsoft.com",
            "name": "Thomas Norling",
            "username": "tnorling"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "4d75b093973b1c0b01feb4601f07d10390d44dd2",
          "message": "Refactor ClientAuthError for reduced size (#6433)\n\nSame changes as #6414 but for ClientAuthError",
          "timestamp": "2023-09-12T14:02:18-07:00",
          "tree_id": "090c807cce634f54c37d5d066e2a3ee1d582edff",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/4d75b093973b1c0b01feb4601f07d10390d44dd2"
        },
        "date": 1694552807782,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 150888,
            "range": "±1.20%",
            "unit": "ops/sec",
            "extra": "233 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 154378,
            "range": "±1.25%",
            "unit": "ops/sec",
            "extra": "235 samples"
          }
        ]
      }
    ]
  }
}