window.BENCHMARK_DATA = {
  "lastUpdate": 1696362879649,
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
          "id": "32d7a1ac2e0627d41454f9721e329548cf1b5896",
          "message": "Fix telemetry event name for monitorIframeForHash (#6467)\n\nTelemetry is being reported under the wrong event name for this\r\nfunction. PR addresses the miss",
          "timestamp": "2023-09-12T23:34:46Z",
          "tree_id": "f564ad5fbf1624d89b7bb71b3cea5efda5329d95",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/32d7a1ac2e0627d41454f9721e329548cf1b5896"
        },
        "date": 1694561956320,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 141843,
            "range": "±1.28%",
            "unit": "ops/sec",
            "extra": "230 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 147149,
            "range": "±1.45%",
            "unit": "ops/sec",
            "extra": "222 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "hemoral@microsoft.com",
            "name": "Hector Morales",
            "username": "hectormmg"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "a596d3ddd3ad48a58814ba575cd37b14302ed540",
          "message": "Add DSTS not supported disclaimer (#6354)\n\nThis PR adds a warning about DSTS not being officially supported despite\r\nMSAL correctly processing DSTS authorities\r\n\r\nCo-authored-by: Sameera Gajjarapu <sameera.gajjarapu@microsoft.com>",
          "timestamp": "2023-09-13T11:29:14-07:00",
          "tree_id": "b536d0f5f08cfdae9fc8d92e14bb7813467b9bd4",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/a596d3ddd3ad48a58814ba575cd37b14302ed540"
        },
        "date": 1694630016558,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 150233,
            "range": "±1.44%",
            "unit": "ops/sec",
            "extra": "231 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 151186,
            "range": "±1.32%",
            "unit": "ops/sec",
            "extra": "226 samples"
          }
        ]
      },
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
          "id": "3f74c7263ffb405a3183186640945337fbf5cfd4",
          "message": "Modified refreshOn in MSAL Common Silent Flow to return cached token before refreshing in the background (#6397)\n\nrefreshOn functionality already exists in Silent Flow. That is, if a\r\ntoken needs to be refreshed but is not expired, an error was thrown and\r\nthe token was refreshed. This PR contains changes that will now return\r\nthe cached token if it needs to be refreshed and is not expired, while\r\nalso refreshing the token in the background.",
          "timestamp": "2023-09-14T13:23:24-04:00",
          "tree_id": "1da51daea98c5696b90066993e8e144b952d60ce",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/3f74c7263ffb405a3183186640945337fbf5cfd4"
        },
        "date": 1694712532166,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 114667,
            "range": "±1.74%",
            "unit": "ops/sec",
            "extra": "205 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 115664,
            "range": "±1.66%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "ae92c9a9fefcdc98b3bff206d66c9bc4db1db76c",
          "message": "Refactor ClientConfigurationError for reduced size (#6471)\n\nSame changes as #6433 and #6414 but for ClientConfigurationError this\r\ntime",
          "timestamp": "2023-09-14T11:34:42-07:00",
          "tree_id": "287b29977132357bac41115b6404f391ccbeaabe",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/ae92c9a9fefcdc98b3bff206d66c9bc4db1db76c"
        },
        "date": 1694716779361,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 144374,
            "range": "±1.52%",
            "unit": "ops/sec",
            "extra": "231 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 141957,
            "range": "±1.26%",
            "unit": "ops/sec",
            "extra": "231 samples"
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
          "id": "5f19f7f29e8eeac7c53030598c1bf6fc7a96c615",
          "message": "Refactor InteractionRequiredAuthError for reduced size (#6472)\n\nSame changes as #6433 , #6471 , #6414",
          "timestamp": "2023-09-14T11:43:06-07:00",
          "tree_id": "0e1cd44432d0cfa7e0aadbe0a5b5b9a9bd34f3fa",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/5f19f7f29e8eeac7c53030598c1bf6fc7a96c615"
        },
        "date": 1694717351883,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 108637,
            "range": "±1.99%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 109595,
            "range": "±2.03%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "6eaf83f4abff2e6f89bd952c27fea7d6d0d9099a",
          "message": "Refactor BrowserConfigurationAuthError for reduced size (#6473)\n\nSame changes as #6433 , #6471 , #6414, #6472",
          "timestamp": "2023-09-14T12:12:33-07:00",
          "tree_id": "7d27f67f2707d4718f63b664bfc2f4530da9c46f",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/6eaf83f4abff2e6f89bd952c27fea7d6d0d9099a"
        },
        "date": 1694719063482,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 125942,
            "range": "±1.79%",
            "unit": "ops/sec",
            "extra": "215 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 124859,
            "range": "±1.31%",
            "unit": "ops/sec",
            "extra": "225 samples"
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
          "id": "74e928111fbd6954b93fc4d11dfb6d1c44a0a7c5",
          "message": "Fix Node PCA tests (#6482)\n\nNode PCA tests aren't restoring mocks after each test leading to\r\ninconsistent behavior when some tests are run before others. This PR\r\nensures mocks are cleared after each test and fixes the tests affected.",
          "timestamp": "2023-09-15T09:11:41-07:00",
          "tree_id": "bbdd5505668d3497a1657094ed4b56ac1795b8a8",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/74e928111fbd6954b93fc4d11dfb6d1c44a0a7c5"
        },
        "date": 1694794585165,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 149117,
            "range": "±1.76%",
            "unit": "ops/sec",
            "extra": "216 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 151053,
            "range": "±1.39%",
            "unit": "ops/sec",
            "extra": "231 samples"
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
          "id": "764d246483a4ef9712d5d32832cf1ed8ea23cd87",
          "message": "Update measurements to use invoke (#6484)\n\n[msal-browser] Updates remaining measurements to use the invoke\r\nwrappers. This will also result in a few more measurements we're not\r\ncollecting today.\r\n\r\nWill follow up with msal-common changes in a separate PR\r\n\r\n---------\r\n\r\nCo-authored-by: Sameera Gajjarapu <sameera.gajjarapu@microsoft.com>",
          "timestamp": "2023-09-15T13:39:09-07:00",
          "tree_id": "79cc1f430b9a00a2788fa44fcca219c84e0ef812",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/764d246483a4ef9712d5d32832cf1ed8ea23cd87"
        },
        "date": 1694810616026,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 154358,
            "range": "±1.17%",
            "unit": "ops/sec",
            "extra": "232 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 154745,
            "range": "±1.23%",
            "unit": "ops/sec",
            "extra": "227 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "joarroyo@microsoft.com",
            "name": "Jo Arroyo",
            "username": "jo-arroyo"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "706ab3f6aea3313bca93680c5746fbda54634c69",
          "message": "v3 sample updates (#6474)\n\nSmall updates in READMEs for samples.",
          "timestamp": "2023-09-15T21:54:41Z",
          "tree_id": "0c77c9213b1e9406282e1e1076e09d0eb0974a2c",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/706ab3f6aea3313bca93680c5746fbda54634c69"
        },
        "date": 1694815149335,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 152236,
            "range": "±1.36%",
            "unit": "ops/sec",
            "extra": "233 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 152224,
            "range": "±1.36%",
            "unit": "ops/sec",
            "extra": "232 samples"
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
          "id": "a9af309d6ead067c79e221a49eb804758c613655",
          "message": "Add missing queue measurement instrumentation (#6480)\n\n- Add missing queue measurement instrumentation.\r\n- Default queue time to 0 for manually completed queue events.\r\n- Update unit tests.",
          "timestamp": "2023-09-15T22:13:00Z",
          "tree_id": "90475c62923d2cb44c41cc6776e949018da0cd66",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/a9af309d6ead067c79e221a49eb804758c613655"
        },
        "date": 1694816265810,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 144617,
            "range": "±1.06%",
            "unit": "ops/sec",
            "extra": "232 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 143356,
            "range": "±1.10%",
            "unit": "ops/sec",
            "extra": "231 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "hemoral@microsoft.com",
            "name": "Hector Morales",
            "username": "hectormmg"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "3d8e43811c64b5a4383e07b31a5af932c0294aab",
          "message": "Fix dead link in Angular docs (#6479)\n\n- Fixes #6477",
          "timestamp": "2023-09-18T15:43:20-07:00",
          "tree_id": "b07835b2a6fcd7b3e85f0e937296e05590b000fc",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/3d8e43811c64b5a4383e07b31a5af932c0294aab"
        },
        "date": 1695077264436,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 155459,
            "range": "±1.38%",
            "unit": "ops/sec",
            "extra": "230 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 154761,
            "range": "±1.42%",
            "unit": "ops/sec",
            "extra": "234 samples"
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
          "id": "ae39f51c138afa8160f17f9d5e1fc6f3f01afb08",
          "message": "Update msal-common functions to use invoke (#6486)\n\nUpdates msal-common APIs to use the invoke wrappers",
          "timestamp": "2023-09-19T10:23:08-07:00",
          "tree_id": "8d29b5997dfbdddf0f26982a369a2154cac53fb1",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/ae39f51c138afa8160f17f9d5e1fc6f3f01afb08"
        },
        "date": 1695144498954,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 125685,
            "range": "±1.19%",
            "unit": "ops/sec",
            "extra": "224 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 123404,
            "range": "±1.46%",
            "unit": "ops/sec",
            "extra": "224 samples"
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
          "id": "fbbb9060775198412eead3e844ef6f4d1968cea3",
          "message": "Set TypeScript composite: false (#6494)\n\nThe composite and project references settings in TypeScript are used,\r\namong other things, to speed up build times when the project has already\r\nbeen built previously. Unfortunately, the generated tsbuildinfo file is\r\neither incorrect or outdated and causing subsequent builds to fail. The\r\nonly way to get ourselves out of this state is to delete the tsbuildinfo\r\nfile, which defeats the purpose of the composite/project references\r\nsettings.\r\n\r\nThis PR turns off composite and project references to address the local\r\nbuild issues.",
          "timestamp": "2023-09-19T10:46:53-07:00",
          "tree_id": "c9b7c08cb229e933b52de38ad0b347d217461462",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/fbbb9060775198412eead3e844ef6f4d1968cea3"
        },
        "date": 1695145909210,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 152633,
            "range": "±1.13%",
            "unit": "ops/sec",
            "extra": "232 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 150250,
            "range": "±1.24%",
            "unit": "ops/sec",
            "extra": "229 samples"
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
          "id": "0cad734bb8ded0a17c9eeedfd8d25c7717bbf6a7",
          "message": "Refactor remaining errors for reduced size (#6497)\n\nCompletes the error refactor for NativeAuthError, JoseHeaderError and\r\nAuthError classes",
          "timestamp": "2023-09-20T09:11:35-07:00",
          "tree_id": "a99fc3cc1c464f5565e21baf5f052b54c443e791",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/0cad734bb8ded0a17c9eeedfd8d25c7717bbf6a7"
        },
        "date": 1695226580967,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 144495,
            "range": "±1.40%",
            "unit": "ops/sec",
            "extra": "232 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 142655,
            "range": "±1.36%",
            "unit": "ops/sec",
            "extra": "231 samples"
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
          "id": "d3c51eb54e23e325b04a12610f0ee2dcde3f4718",
          "message": "Resolve `e2e-test-utils` package from workspaces (#6496)\n\n- Resolve `e2e-test-utils` package from workspaces.\r\n- Update `e2e-test-utils` imports in samples.\r\n- Remove `msal*` deps in `e2e-test-utils`.\r\n- Prettify updated samples.",
          "timestamp": "2023-09-21T08:44:58-07:00",
          "tree_id": "a578321e6dc8e133d96f18b9a61303fe8f4b3107",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/d3c51eb54e23e325b04a12610f0ee2dcde3f4718"
        },
        "date": 1695311370234,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 153248,
            "range": "±1.75%",
            "unit": "ops/sec",
            "extra": "233 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 155225,
            "range": "±1.28%",
            "unit": "ops/sec",
            "extra": "234 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "49699333+dependabot[bot]@users.noreply.github.com",
            "name": "dependabot[bot]",
            "username": "dependabot[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e177aaee942696c6bb6f50760d498cb8f67e2f11",
          "message": "Bump electron from 22.3.21 to 22.3.24 (#6503)\n\nBumps [electron](https://github.com/electron/electron) from 22.3.21 to\r\n22.3.24.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/electron/electron/releases\">electron's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>electron v22.3.24</h2>\r\n<h1>Release Notes for v22.3.24</h1>\r\n<h2>Other Changes</h2>\r\n<ul>\r\n<li>Security: backported fix for CVE-2023-4572. <a\r\nhref=\"https://redirect.github.com/electron/electron/pull/39689\">#39689</a></li>\r\n<li>Security: backported fix for CVE-2023-4762. <a\r\nhref=\"https://redirect.github.com/electron/electron/pull/39758\">#39758</a></li>\r\n<li>Security: backported fix for CVE-2023-4863. <a\r\nhref=\"https://redirect.github.com/electron/electron/pull/39827\">#39827</a></li>\r\n</ul>\r\n<h2>electron v22.3.23</h2>\r\n<h1>Release Notes for v22.3.23</h1>\r\n<h2>Other Changes</h2>\r\n<ul>\r\n<li>Security: backported fix for CVE-2023-4427.\r\n<ul>\r\n<li>Security: backported fix for CVE-2023-4428. <a\r\nhref=\"https://redirect.github.com/electron/electron/pull/39648\">#39648</a></li>\r\n</ul>\r\n</li>\r\n</ul>\r\n<h2>electron v22.3.22</h2>\r\n<h1>Release Notes for v22.3.22</h1>\r\n<h2>Fixes</h2>\r\n<ul>\r\n<li>Fixed decorations for tiled windows on Wayland. <a\r\nhref=\"https://redirect.github.com/electron/electron/pull/39568\">#39568</a>\r\n<!-- raw HTML omitted -->(Also in <a\r\nhref=\"https://redirect.github.com/electron/electron/pull/39567\">24</a>,\r\n<a\r\nhref=\"https://redirect.github.com/electron/electron/pull/39569\">25</a>,\r\n<a\r\nhref=\"https://redirect.github.com/electron/electron/pull/39571\">26</a>,\r\n<a\r\nhref=\"https://redirect.github.com/electron/electron/pull/39570\">27</a>)<!--\r\nraw HTML omitted --></li>\r\n</ul>\r\n<h2>Other Changes</h2>\r\n<ul>\r\n<li>Security: backported fix for CVE-2023-4355.\r\n<ul>\r\n<li>Security: backported fix for CVE-2023-4354.</li>\r\n<li>Security: backported fix for CVE-2023-4353.</li>\r\n<li>Security: backported fix for CVE-2023-4352.</li>\r\n<li>Security: backported fix for CVE-2023-4351. <a\r\nhref=\"https://redirect.github.com/electron/electron/pull/39559\">#39559</a></li>\r\n</ul>\r\n</li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/056eacf1ce34c27db00df7bc21aa83a779b8a2d9\"><code>056eacf</code></a>\r\nchore: cherry-pick b2eab7500a18 from chromium (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/39827\">#39827</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/5f8ef8127732c181b090d389bead76bae384b761\"><code>5f8ef81</code></a>\r\nfix: ensure app load is limited to real asar files when appropriate (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/39811\">#39811</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/4995c9ee97513f30ada0734454c3c0a2b763f3bc\"><code>4995c9e</code></a>\r\nchore: cherry-pick 1 changes from Release-3-M116 (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/39758\">#39758</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/e29cdacb1309ffe175c13756fdc68e003af2a6b4\"><code>e29cdac</code></a>\r\nbuild: fix depot_tools patch application (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/39751\">#39751</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/b58903d195908d3a7534cbf4fc28771bde582cde\"><code>b58903d</code></a>\r\nchore: cherry-pick 1 changes from Release-2-M116 (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/39689\">#39689</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/33f9dce7c2a77a8b16a6f9f61615d5ee6a63614c\"><code>33f9dce</code></a>\r\nchore: cherry-pick 2 changes from Release-1-M116 (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/39648\">#39648</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/4938ca50f0a376b3d8c4ee07e59465b37fb231f3\"><code>4938ca5</code></a>\r\nci: explicitly use python3 to start goma (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/39652\">#39652</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/e940852250f22c2e5599b37d285e9747113ed836\"><code>e940852</code></a>\r\nfix: use tiled edges to calculate frame inset sizes in Linux (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/39568\">#39568</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/2598dc0ce6a49902f8fa9ab8c6398abb918e37b3\"><code>2598dc0</code></a>\r\nchore: cherry-pick 5 changes from Release-0-M116 (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/39559\">#39559</a>)</li>\r\n<li>See full diff in <a\r\nhref=\"https://github.com/electron/electron/compare/v22.3.21...v22.3.24\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=electron&package-manager=npm_and_yarn&previous-version=22.3.21&new-version=22.3.24)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2023-09-21T09:59:32-07:00",
          "tree_id": "aee0d1fc2bcaf3cb2fc8525be7c103739d235614",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/e177aaee942696c6bb6f50760d498cb8f67e2f11"
        },
        "date": 1695315890417,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 132362,
            "range": "±1.32%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 134512,
            "range": "±1.04%",
            "unit": "ops/sec",
            "extra": "228 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "49699333+dependabot[bot]@users.noreply.github.com",
            "name": "dependabot[bot]",
            "username": "dependabot[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "4392a636c2d340394949b46c866a5b9895fc195e",
          "message": "Bump electron from 22.3.21 to 22.3.24 in /extensions/samples/electron-webpack (#6502)\n\n[//]: # (dependabot-start)\r\n⚠️  **Dependabot is rebasing this PR** ⚠️ \r\n\r\nRebasing might not happen immediately, so don't worry if this takes some\r\ntime.\r\n\r\nNote: if you make any changes to this PR yourself, they will take\r\nprecedence over the rebase.\r\n\r\n---\r\n\r\n[//]: # (dependabot-end)\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=electron&package-manager=npm_and_yarn&previous-version=22.3.21&new-version=22.3.24)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2023-09-21T17:03:48Z",
          "tree_id": "e28b1ea399cfe4e8e3477044249b064b27ae05fd",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/4392a636c2d340394949b46c866a5b9895fc195e"
        },
        "date": 1695316130539,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 147662,
            "range": "±1.29%",
            "unit": "ops/sec",
            "extra": "228 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 146431,
            "range": "±1.16%",
            "unit": "ops/sec",
            "extra": "233 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "hemoral@microsoft.com",
            "name": "Hector Morales",
            "username": "hectormmg"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "48659582a1634c48324194d812177f8a1d8c8b01",
          "message": "Add getAccount and enhance account filtering (#6499)\n\nThis PR:\r\n- Adds and `accountFilter: AccountFilter` param to `getAllAccounts()` in\r\norder to enable the narrowing-down of cached accounts returned\r\n- Adds `getAccountByFilter` API to replace now marked-for-deprecation\r\n`getAccountBy` APIs\r\n- Extends `AccountFilter` class to optionally include all the properties\r\nin `AccountInfo` except `idToken` and `idTokenClaims` so accounts are\r\nfilterable by all of their searchable properties\r\n- Adds new `AccountFilter` properties to the set of matchers in\r\n`CacheManager.getAccountsFilteredBy()` as well as their respective\r\nprivate matching methods\r\n- Adds filtering by `loginHint`\r\n\r\n---------\r\n\r\nCo-authored-by: Sameera Gajjarapu <sameera.gajjarapu@microsoft.com>\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2023-09-26T11:07:43-07:00",
          "tree_id": "d30288052f7521db74bab492c7c72341ea4f7b4f",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/48659582a1634c48324194d812177f8a1d8c8b01"
        },
        "date": 1695751922381,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 151777,
            "range": "±1.28%",
            "unit": "ops/sec",
            "extra": "235 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 148884,
            "range": "±1.48%",
            "unit": "ops/sec",
            "extra": "217 samples"
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
          "id": "781325ba46c8c7eb216b8fff8eebda253aadfea9",
          "message": "Instrument Crypto APIs (#6512)\n\n- Adds instrumentation for Crypto APIs, specifically around PKCE\r\ngeneration\r\n- Also refactors `PkceGenerator` and `BrowserCrypto` classes into pure\r\nfunctions for better minification and simpler usage",
          "timestamp": "2023-09-27T13:05:31-07:00",
          "tree_id": "30a649f89d1a155afc5afcb0da055eab6ef7158b",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/781325ba46c8c7eb216b8fff8eebda253aadfea9"
        },
        "date": 1695845443031,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 142463,
            "range": "±1.71%",
            "unit": "ops/sec",
            "extra": "217 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 141135,
            "range": "±1.65%",
            "unit": "ops/sec",
            "extra": "228 samples"
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
          "id": "b69ed83ede29bd39b04eb71ae7c15f0a983e0442",
          "message": "Fix LoopbackClient issues (#6481)\n\nThis PR fixes 2 bugs in the LoopbackClient:\r\n\r\n1. If the server doesn't spin up immediately, getting the redirectUri\r\nwill fail. Addressed by moving the setInterval out of the\r\n`listenForAuthCode` function and instead wrapping the `getRedirectUri`\r\nwith it\r\n1. If the listener throws before the promise is awaited the rejection\r\nbecomes unhandled. Addressed by attaching the catch handler on promise\r\ncreation and storing the error for later.",
          "timestamp": "2023-09-28T00:10:55Z",
          "tree_id": "802e7f614d89c123380d1b2fa9d602773383bfdf",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/b69ed83ede29bd39b04eb71ae7c15f0a983e0442"
        },
        "date": 1695860151488,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 143515,
            "range": "±1.48%",
            "unit": "ops/sec",
            "extra": "228 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 142231,
            "range": "±1.42%",
            "unit": "ops/sec",
            "extra": "220 samples"
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
          "id": "41585f85e2e5b19d6c1f661a3d1b683df322317a",
          "message": "Use the proper algo name for `window.crypto.subtle.digest()` (#6521)\n\nUse the proper algo name for `window.crypto.subtle.digest()`",
          "timestamp": "2023-09-28T16:53:08-04:00",
          "tree_id": "1ac3ed6c7d29fb8ff6ba81097b34c3928f7dfec6",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/41585f85e2e5b19d6c1f661a3d1b683df322317a"
        },
        "date": 1695934674061,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 144636,
            "range": "±1.55%",
            "unit": "ops/sec",
            "extra": "229 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 142607,
            "range": "±1.11%",
            "unit": "ops/sec",
            "extra": "224 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "joarroyo@microsoft.com",
            "name": "Jo Arroyo",
            "username": "jo-arroyo"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "2dd17704fd6c3e1ba77b9f57d062785fcd662c86",
          "message": "V3 sample updates (#6517)\n\nUpdate samples for MSAL Browser, MSAL Angular, MSAL React and MSAL Node\r\n(Public client) to use v3.",
          "timestamp": "2023-09-28T14:38:37-07:00",
          "tree_id": "09699aed326148b804d4a8b597d8046273dbe7df",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/2dd17704fd6c3e1ba77b9f57d062785fcd662c86"
        },
        "date": 1695937400658,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 150570,
            "range": "±1.55%",
            "unit": "ops/sec",
            "extra": "231 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 148591,
            "range": "±1.39%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "1ed195242f08b9637ef7654f59687db0b5d885ab",
          "message": "Add 1p e2e performance telemetry pipeline (#6520)\n\n- Add 1p e2e performance telemetry pipeline.",
          "timestamp": "2023-09-29T14:22:32-04:00",
          "tree_id": "5f26b8e855c060d85ebc85577769e76b69933afa",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/1ed195242f08b9637ef7654f59687db0b5d885ab"
        },
        "date": 1696012015964,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 153299,
            "range": "±1.25%",
            "unit": "ops/sec",
            "extra": "233 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 153148,
            "range": "±1.30%",
            "unit": "ops/sec",
            "extra": "232 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "sameera.gajjarapu@microsoft.com",
            "name": "Sameera Gajjarapu",
            "username": "sameerag"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "bfdd254075e204a9c101e8614efd6965c7d40dd7",
          "message": "Address missing params in refreshtoken flow (#6504)\n\n* Address missing params in `acquireTokenByRefreshToken` for specific\r\nflows\r\n* Correct request thumbprint `clientId` in `AuthorizationCodeClient` and\r\n`RefreshTokenClient`\r\n\r\n---------\r\n\r\nCo-authored-by: Konstantin <kshabelko@microsoft.com>",
          "timestamp": "2023-10-02T11:23:44-07:00",
          "tree_id": "17dd7e45172cf60a77a6a12ed57e4477af217844",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/bfdd254075e204a9c101e8614efd6965c7d40dd7"
        },
        "date": 1696271373723,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 107528,
            "range": "±1.71%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 102917,
            "range": "±1.74%",
            "unit": "ops/sec",
            "extra": "219 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "joarroyo@microsoft.com",
            "name": "Jo Arroyo",
            "username": "jo-arroyo"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "3cd4368b9a5ca92162c4b108578fbdd7f3e73f8e",
          "message": "Docs and samples update re. secrets usage (#6523)\n\nUpdate docs and samples to remove references to hardcoded secrets as\r\nwell as key files being stored in a project's directory.\r\n\r\nFollow up to PR #6417, addresses #6263.",
          "timestamp": "2023-10-03T08:35:16-07:00",
          "tree_id": "5aa2c5bc82779fb3d8faea374f6c6ebee4b3ffa3",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/3cd4368b9a5ca92162c4b108578fbdd7f3e73f8e"
        },
        "date": 1696347635358,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 126948,
            "range": "±1.33%",
            "unit": "ops/sec",
            "extra": "224 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 126866,
            "range": "±1.54%",
            "unit": "ops/sec",
            "extra": "219 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "49699333+dependabot[bot]@users.noreply.github.com",
            "name": "dependabot[bot]",
            "username": "dependabot[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "027ca7c9894224505e968bcd07057d11775d6f59",
          "message": "Bump postcss from 8.4.28 to 8.4.31 (#6532)\n\nBumps [postcss](https://github.com/postcss/postcss) from 8.4.28 to\r\n8.4.31.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/postcss/postcss/releases\">postcss's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>8.4.31</h2>\r\n<ul>\r\n<li>Fixed <code>\\r</code> parsing to fix CVE-2023-44270.</li>\r\n</ul>\r\n<h2>8.4.30</h2>\r\n<ul>\r\n<li>Improved source map performance (by <a\r\nhref=\"https://github.com/romainmenke\"><code>@​romainmenke</code></a>).</li>\r\n</ul>\r\n<h2>8.4.29</h2>\r\n<ul>\r\n<li>Fixed <code>Node#source.offset</code> (by <a\r\nhref=\"https://github.com/idoros\"><code>@​idoros</code></a>).</li>\r\n<li>Fixed docs (by <a\r\nhref=\"https://github.com/coliff\"><code>@​coliff</code></a>).</li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/postcss/postcss/blob/main/CHANGELOG.md\">postcss's\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h2>8.4.31</h2>\r\n<ul>\r\n<li>Fixed <code>\\r</code> parsing to fix CVE-2023-44270.</li>\r\n</ul>\r\n<h2>8.4.30</h2>\r\n<ul>\r\n<li>Improved source map performance (by Romain Menke).</li>\r\n</ul>\r\n<h2>8.4.29</h2>\r\n<ul>\r\n<li>Fixed <code>Node#source.offset</code> (by Ido Rosenthal).</li>\r\n<li>Fixed docs (by Christian Oliff).</li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/postcss/postcss/commit/90208de8805dd762596c0028b8637ffbed23e371\"><code>90208de</code></a>\r\nRelease 8.4.31 version</li>\r\n<li><a\r\nhref=\"https://github.com/postcss/postcss/commit/58cc860b4c1707510c9cd1bc1fa30b423a9ad6c5\"><code>58cc860</code></a>\r\nFix carrier return parsing</li>\r\n<li><a\r\nhref=\"https://github.com/postcss/postcss/commit/4fff8e4cdc237619df1d73a444c0a8329701c1e2\"><code>4fff8e4</code></a>\r\nImprove pnpm test output</li>\r\n<li><a\r\nhref=\"https://github.com/postcss/postcss/commit/cd43ed123274a92ebc13a1e8cccf1d65b8198f84\"><code>cd43ed1</code></a>\r\nUpdate dependencies</li>\r\n<li><a\r\nhref=\"https://github.com/postcss/postcss/commit/caa916bdcbf66c51321574e2dde112ab13e8b306\"><code>caa916b</code></a>\r\nUpdate dependencies</li>\r\n<li><a\r\nhref=\"https://github.com/postcss/postcss/commit/8972f76923e921a3c9655822382039b31b1c8e1a\"><code>8972f76</code></a>\r\nTypo</li>\r\n<li><a\r\nhref=\"https://github.com/postcss/postcss/commit/11a5286f781d2a637f2c545c5e9cd661055acaab\"><code>11a5286</code></a>\r\nTypo</li>\r\n<li><a\r\nhref=\"https://github.com/postcss/postcss/commit/45c55017776fc61f7815d1ea8e92d5291ca5d6c8\"><code>45c5501</code></a>\r\nRelease 8.4.30 version</li>\r\n<li><a\r\nhref=\"https://github.com/postcss/postcss/commit/bc3c341f589f9c15f1b56838a33d908374e537e0\"><code>bc3c341</code></a>\r\nUpdate linter</li>\r\n<li><a\r\nhref=\"https://github.com/postcss/postcss/commit/b2be58a2eb788d12474ee1335f8ecdb9fa6225aa\"><code>b2be58a</code></a>\r\nMerge pull request <a\r\nhref=\"https://redirect.github.com/postcss/postcss/issues/1881\">#1881</a>\r\nfrom romainmenke/improve-sourcemap-performance--phil...</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/postcss/postcss/compare/8.4.28...8.4.31\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=postcss&package-manager=npm_and_yarn&previous-version=8.4.28&new-version=8.4.31)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2023-10-03T12:48:42-07:00",
          "tree_id": "c4881cf039199bbe7be5760bfc2a248977a1b352",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/027ca7c9894224505e968bcd07057d11775d6f59"
        },
        "date": 1696362877795,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 107967,
            "range": "±1.91%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 105248,
            "range": "±1.87%",
            "unit": "ops/sec",
            "extra": "222 samples"
          }
        ]
      }
    ]
  }
}