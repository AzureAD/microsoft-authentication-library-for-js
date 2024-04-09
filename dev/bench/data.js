window.BENCHMARK_DATA = {
  "lastUpdate": 1712692247729,
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
          "id": "d1bbf52b5c3ab14e456af076a8b4b1e7c5c024c1",
          "message": "Bump actions/checkout from 3 to 4 (#6488)\n\nBumps [actions/checkout](https://github.com/actions/checkout) from 3 to\r\n4.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/actions/checkout/releases\">actions/checkout's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>v4.0.0</h2>\r\n<h2>What's Changed</h2>\r\n<ul>\r\n<li>Update default runtime to node20 by <a\r\nhref=\"https://github.com/takost\"><code>@​takost</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1436\">actions/checkout#1436</a></li>\r\n<li>Support fetching without the --progress option by <a\r\nhref=\"https://github.com/simonbaird\"><code>@​simonbaird</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1067\">actions/checkout#1067</a></li>\r\n<li>Release 4.0.0 by <a\r\nhref=\"https://github.com/takost\"><code>@​takost</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1447\">actions/checkout#1447</a></li>\r\n</ul>\r\n<h2>New Contributors</h2>\r\n<ul>\r\n<li><a href=\"https://github.com/takost\"><code>@​takost</code></a> made\r\ntheir first contribution in <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1436\">actions/checkout#1436</a></li>\r\n<li><a\r\nhref=\"https://github.com/simonbaird\"><code>@​simonbaird</code></a> made\r\ntheir first contribution in <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1067\">actions/checkout#1067</a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/actions/checkout/compare/v3...v4.0.0\">https://github.com/actions/checkout/compare/v3...v4.0.0</a></p>\r\n<h2>v3.6.0</h2>\r\n<h2>What's Changed</h2>\r\n<ul>\r\n<li>Mark test scripts with Bash'isms to be run via Bash by <a\r\nhref=\"https://github.com/dscho\"><code>@​dscho</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1377\">actions/checkout#1377</a></li>\r\n<li>Add option to fetch tags even if fetch-depth &gt; 0 by <a\r\nhref=\"https://github.com/RobertWieczoreck\"><code>@​RobertWieczoreck</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/579\">actions/checkout#579</a></li>\r\n<li>Release 3.6.0 by <a\r\nhref=\"https://github.com/luketomlinson\"><code>@​luketomlinson</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1437\">actions/checkout#1437</a></li>\r\n</ul>\r\n<h2>New Contributors</h2>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/RobertWieczoreck\"><code>@​RobertWieczoreck</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/579\">actions/checkout#579</a></li>\r\n<li><a\r\nhref=\"https://github.com/luketomlinson\"><code>@​luketomlinson</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1437\">actions/checkout#1437</a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/actions/checkout/compare/v3.5.3...v3.6.0\">https://github.com/actions/checkout/compare/v3.5.3...v3.6.0</a></p>\r\n<h2>v3.5.3</h2>\r\n<h2>What's Changed</h2>\r\n<ul>\r\n<li>Fix: Checkout Issue in self hosted runner due to faulty submodule\r\ncheck-ins by <a\r\nhref=\"https://github.com/megamanics\"><code>@​megamanics</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1196\">actions/checkout#1196</a></li>\r\n<li>Fix typos found by codespell by <a\r\nhref=\"https://github.com/DimitriPapadopoulos\"><code>@​DimitriPapadopoulos</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1287\">actions/checkout#1287</a></li>\r\n<li>Add support for sparse checkouts by <a\r\nhref=\"https://github.com/dscho\"><code>@​dscho</code></a> and <a\r\nhref=\"https://github.com/dfdez\"><code>@​dfdez</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1369\">actions/checkout#1369</a></li>\r\n<li>Release v3.5.3 by <a\r\nhref=\"https://github.com/TingluoHuang\"><code>@​TingluoHuang</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1376\">actions/checkout#1376</a></li>\r\n</ul>\r\n<h2>New Contributors</h2>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/megamanics\"><code>@​megamanics</code></a> made\r\ntheir first contribution in <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1196\">actions/checkout#1196</a></li>\r\n<li><a\r\nhref=\"https://github.com/DimitriPapadopoulos\"><code>@​DimitriPapadopoulos</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1287\">actions/checkout#1287</a></li>\r\n<li><a href=\"https://github.com/dfdez\"><code>@​dfdez</code></a> made\r\ntheir first contribution in <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1369\">actions/checkout#1369</a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/actions/checkout/compare/v3...v3.5.3\">https://github.com/actions/checkout/compare/v3...v3.5.3</a></p>\r\n<h2>v3.5.2</h2>\r\n<h2>What's Changed</h2>\r\n<ul>\r\n<li>Fix: Use correct API url / endpoint in GHES by <a\r\nhref=\"https://github.com/fhammerl\"><code>@​fhammerl</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1289\">actions/checkout#1289</a>\r\nbased on <a\r\nhref=\"https://redirect.github.com/actions/checkout/issues/1286\">#1286</a>\r\nby <a href=\"https://github.com/1newsr\"><code>@​1newsr</code></a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/actions/checkout/compare/v3.5.1...v3.5.2\">https://github.com/actions/checkout/compare/v3.5.1...v3.5.2</a></p>\r\n<h2>v3.5.1</h2>\r\n<h2>What's Changed</h2>\r\n<ul>\r\n<li>Improve checkout performance on Windows runners by upgrading\r\n<code>@​actions/github</code> dependency by <a\r\nhref=\"https://github.com/BrettDong\"><code>@​BrettDong</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1246\">actions/checkout#1246</a></li>\r\n</ul>\r\n<h2>New Contributors</h2>\r\n<ul>\r\n<li><a href=\"https://github.com/BrettDong\"><code>@​BrettDong</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1246\">actions/checkout#1246</a></li>\r\n</ul>\r\n<!-- raw HTML omitted -->\r\n</blockquote>\r\n<p>... (truncated)</p>\r\n</details>\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/actions/checkout/blob/main/CHANGELOG.md\">actions/checkout's\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h1>Changelog</h1>\r\n<h2>v4.0.0</h2>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1067\">Support\r\nfetching without the --progress option</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1436\">Update to\r\nnode20</a></li>\r\n</ul>\r\n<h2>v3.6.0</h2>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1377\">Fix: Mark\r\ntest scripts with Bash'isms to be run via Bash</a></li>\r\n<li><a href=\"https://redirect.github.com/actions/checkout/pull/579\">Add\r\noption to fetch tags even if fetch-depth &gt; 0</a></li>\r\n</ul>\r\n<h2>v3.5.3</h2>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1196\">Fix:\r\nCheckout fail in self-hosted runners when faulty submodule are\r\nchecked-in</a></li>\r\n<li><a href=\"https://redirect.github.com/actions/checkout/pull/1287\">Fix\r\ntypos found by codespell</a></li>\r\n<li><a href=\"https://redirect.github.com/actions/checkout/pull/1369\">Add\r\nsupport for sparse checkouts</a></li>\r\n</ul>\r\n<h2>v3.5.2</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/actions/checkout/pull/1289\">Fix\r\napi endpoint for GHES</a></li>\r\n</ul>\r\n<h2>v3.5.1</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/actions/checkout/pull/1246\">Fix\r\nslow checkout on Windows</a></li>\r\n</ul>\r\n<h2>v3.5.0</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/actions/checkout/pull/1237\">Add\r\nnew public key for known_hosts</a></li>\r\n</ul>\r\n<h2>v3.4.0</h2>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1209\">Upgrade\r\ncodeql actions to v2</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1210\">Upgrade\r\ndependencies</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1225\">Upgrade\r\n<code>@​actions/io</code></a></li>\r\n</ul>\r\n<h2>v3.3.0</h2>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1045\">Implement\r\nbranch list using callbacks from exec function</a></li>\r\n<li><a href=\"https://redirect.github.com/actions/checkout/pull/1050\">Add\r\nin explicit reference to private checkout options</a></li>\r\n<li>[Fix comment typos (that got added in <a\r\nhref=\"https://redirect.github.com/actions/checkout/issues/770\">#770</a>)](<a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1057\">actions/checkout#1057</a>)</li>\r\n</ul>\r\n<h2>v3.2.0</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/actions/checkout/pull/942\">Add\r\nGitHub Action to perform release</a></li>\r\n<li><a href=\"https://redirect.github.com/actions/checkout/pull/967\">Fix\r\nstatus badge</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1002\">Replace\r\ndatadog/squid with ubuntu/squid Docker image</a></li>\r\n<li><a href=\"https://redirect.github.com/actions/checkout/pull/964\">Wrap\r\npipeline commands for submoduleForeach in quotes</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1029\">Update\r\n<code>@​actions/io</code> to 1.1.2</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/actions/checkout/pull/1039\">Upgrading\r\nversion to 3.2.0</a></li>\r\n</ul>\r\n<h2>v3.1.0</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/actions/checkout/pull/939\">Use\r\n<code>@​actions/core</code> <code>saveState</code> and\r\n<code>getState</code></a></li>\r\n<li><a href=\"https://redirect.github.com/actions/checkout/pull/922\">Add\r\n<code>github-server-url</code> input</a></li>\r\n</ul>\r\n<h2>v3.0.2</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/actions/checkout/pull/770\">Add\r\ninput <code>set-safe-directory</code></a></li>\r\n</ul>\r\n<h2>v3.0.1</h2>\r\n<!-- raw HTML omitted -->\r\n</blockquote>\r\n<p>... (truncated)</p>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/actions/checkout/commit/3df4ab11eba7bda6032a0b82a6bb43b11571feac\"><code>3df4ab1</code></a>\r\nRelease 4.0.0 (<a\r\nhref=\"https://redirect.github.com/actions/checkout/issues/1447\">#1447</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/actions/checkout/commit/8b5e8b768746b50394015010d25e690bfab9dfbc\"><code>8b5e8b7</code></a>\r\nSupport fetching without the --progress option (<a\r\nhref=\"https://redirect.github.com/actions/checkout/issues/1067\">#1067</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/actions/checkout/commit/97a652b80035363df47baee5031ec8670b8878ac\"><code>97a652b</code></a>\r\nUpdate default runtime to node20 (<a\r\nhref=\"https://redirect.github.com/actions/checkout/issues/1436\">#1436</a>)</li>\r\n<li>See full diff in <a\r\nhref=\"https://github.com/actions/checkout/compare/v3...v4\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=actions/checkout&package-manager=github_actions&previous-version=3&new-version=4)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\n\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>\r\nCo-authored-by: Hector Morales <hemoral@microsoft.com>\r\nCo-authored-by: Robbie-Microsoft <87724641+Robbie-Microsoft@users.noreply.github.com>",
          "timestamp": "2023-10-03T16:17:21-04:00",
          "tree_id": "836fcd2fad59739bfaa5c9d8f3cc221cd08868d1",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/d1bbf52b5c3ab14e456af076a8b4b1e7c5c024c1"
        },
        "date": 1696364523659,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 147581,
            "range": "±1.37%",
            "unit": "ops/sec",
            "extra": "234 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 148615,
            "range": "±1.41%",
            "unit": "ops/sec",
            "extra": "232 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "lalima.sharda@gmail.com",
            "name": "Lalima Sharda",
            "username": "lalimasharda"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "90629381de88e0bb391c3cb658b9ec2923806993",
          "message": "Bug fix: id token Base64 decoding (#6535)\n\nAddresses base64 decoding errors reported by customers and #6492",
          "timestamp": "2023-10-04T16:08:41-07:00",
          "tree_id": "cf872b583078855393f49b11b27614333f6f620d",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/90629381de88e0bb391c3cb658b9ec2923806993"
        },
        "date": 1696461210534,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 152575,
            "range": "±1.40%",
            "unit": "ops/sec",
            "extra": "231 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 149960,
            "range": "±1.40%",
            "unit": "ops/sec",
            "extra": "233 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "kaghiya@microsoft.com",
            "name": "KarishmaGhiya",
            "username": "KarishmaGhiya"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "1d42d78e4d9894c7de2c04a91828acc6140a0648",
          "message": "[Msal node] expose the type through msal-node imported from common (#6538)\n\n- Exposing the type needed from @azure/msal-common through\r\n@azure/msal-node (`INativeBrokerPlugin`)",
          "timestamp": "2023-10-05T10:08:58-07:00",
          "tree_id": "be2b298e71b5f6dfa70b38eb142b2581847bf3b3",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/1d42d78e4d9894c7de2c04a91828acc6140a0648"
        },
        "date": 1696526027837,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 150008,
            "range": "±1.40%",
            "unit": "ops/sec",
            "extra": "233 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 150147,
            "range": "±1.32%",
            "unit": "ops/sec",
            "extra": "234 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "lalima.sharda@gmail.com",
            "name": "Lalima Sharda",
            "username": "lalimasharda"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e5c9d2f67ec9f106032f36ba43efbc4ce78ae98e",
          "message": "Pre-release Oct 2023 (#6537)\n\nCo-authored-by: lalimasharda <lalimasharda@users.noreply.github.com>",
          "timestamp": "2023-10-05T11:46:44-07:00",
          "tree_id": "f6c5fc47363091a7f3723ff6046970551921c3da",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/e5c9d2f67ec9f106032f36ba43efbc4ce78ae98e"
        },
        "date": 1696531892239,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 145098,
            "range": "±1.55%",
            "unit": "ops/sec",
            "extra": "230 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 148797,
            "range": "±1.30%",
            "unit": "ops/sec",
            "extra": "229 samples"
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
          "id": "26bdb77289ef28708c50860287132a397138729f",
          "message": "Enable e2e https support (#6543)\n\n- Enable e2e https support.",
          "timestamp": "2023-10-06T09:24:30-04:00",
          "tree_id": "3c6163d8bec19c9431250c0fe81b4115ffa2afa6",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/26bdb77289ef28708c50860287132a397138729f"
        },
        "date": 1696599007050,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 139485,
            "range": "±1.18%",
            "unit": "ops/sec",
            "extra": "217 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 137327,
            "range": "±1.53%",
            "unit": "ops/sec",
            "extra": "233 samples"
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
          "id": "e1348188036acb2f5d182e1979722429c5a0539b",
          "message": "Bump electron from 22.3.24 to 22.3.25 in /samples/msal-node-samples/ElectronSystemBrowserTestApp (#6542)\n\nBumps [electron](https://github.com/electron/electron) from 22.3.24 to\r\n22.3.25.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/electron/electron/releases\">electron's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>electron v22.3.25</h2>\r\n<h1>Release Notes for v22.3.25</h1>\r\n<h2>Other Changes</h2>\r\n<ul>\r\n<li>Security: backported fix for CVE-2023-5217. <a\r\nhref=\"https://redirect.github.com/electron/electron/pull/40026\">#40026</a></li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/1c1c13234f606f80b5684d4846f4ab52df4a9d28\"><code>1c1c132</code></a>\r\nchore: cherry-pick 3fbd1dca6a4d from libvpx (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/40026\">#40026</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/d892c2b1c8e53e0ed9dc887989f0a9fe3239fe56\"><code>d892c2b</code></a>\r\nbuild: fixup autoninja (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/39899\">#39899</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/6132e80a4f109056ad303052341e2f278284eb67\"><code>6132e80</code></a>\r\nbuild: run on circle hosts for forks (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/39865\">#39865</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/a953199af39a587ca510bbb6486f118ffa12fe8f\"><code>a953199</code></a>\r\nbuild: use aks backed runners for linux builds (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/39838\">#39838</a>)</li>\r\n<li>See full diff in <a\r\nhref=\"https://github.com/electron/electron/compare/v22.3.24...v22.3.25\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=electron&package-manager=npm_and_yarn&previous-version=22.3.24&new-version=22.3.25)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2023-10-06T18:18:01Z",
          "tree_id": "c5e071c9a47ca0f03f1cb9e2267aa1b0aabdbcd2",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/e1348188036acb2f5d182e1979722429c5a0539b"
        },
        "date": 1696616577082,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 146598,
            "range": "±1.41%",
            "unit": "ops/sec",
            "extra": "234 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 148763,
            "range": "±1.29%",
            "unit": "ops/sec",
            "extra": "230 samples"
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
          "id": "b16f16c660290f10b57465520a26c4a4881e75a9",
          "message": "Bump electron from 22.3.24 to 22.3.25 in /extensions/samples/electron-webpack (#6541)\n\nBumps [electron](https://github.com/electron/electron) from 22.3.24 to\r\n22.3.25.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/electron/electron/releases\">electron's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>electron v22.3.25</h2>\r\n<h1>Release Notes for v22.3.25</h1>\r\n<h2>Other Changes</h2>\r\n<ul>\r\n<li>Security: backported fix for CVE-2023-5217. <a\r\nhref=\"https://redirect.github.com/electron/electron/pull/40026\">#40026</a></li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/1c1c13234f606f80b5684d4846f4ab52df4a9d28\"><code>1c1c132</code></a>\r\nchore: cherry-pick 3fbd1dca6a4d from libvpx (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/40026\">#40026</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/d892c2b1c8e53e0ed9dc887989f0a9fe3239fe56\"><code>d892c2b</code></a>\r\nbuild: fixup autoninja (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/39899\">#39899</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/6132e80a4f109056ad303052341e2f278284eb67\"><code>6132e80</code></a>\r\nbuild: run on circle hosts for forks (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/39865\">#39865</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/a953199af39a587ca510bbb6486f118ffa12fe8f\"><code>a953199</code></a>\r\nbuild: use aks backed runners for linux builds (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/39838\">#39838</a>)</li>\r\n<li>See full diff in <a\r\nhref=\"https://github.com/electron/electron/compare/v22.3.24...v22.3.25\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=electron&package-manager=npm_and_yarn&previous-version=22.3.24&new-version=22.3.25)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2023-10-06T18:21:51Z",
          "tree_id": "f8b67832541e6fdb906732e5bada7c6a340ca389",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/b16f16c660290f10b57465520a26c4a4881e75a9"
        },
        "date": 1696616832918,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 131036,
            "range": "±1.47%",
            "unit": "ops/sec",
            "extra": "226 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 125627,
            "range": "±1.40%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "f34fdbc69574ae6ce8a2ebb76b8a094f53d6f266",
          "message": "Bump electron from 22.3.24 to 22.3.25 (#6540)\n\nBumps [electron](https://github.com/electron/electron) from 22.3.24 to\r\n22.3.25.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/electron/electron/releases\">electron's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>electron v22.3.25</h2>\r\n<h1>Release Notes for v22.3.25</h1>\r\n<h2>Other Changes</h2>\r\n<ul>\r\n<li>Security: backported fix for CVE-2023-5217. <a\r\nhref=\"https://redirect.github.com/electron/electron/pull/40026\">#40026</a></li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/1c1c13234f606f80b5684d4846f4ab52df4a9d28\"><code>1c1c132</code></a>\r\nchore: cherry-pick 3fbd1dca6a4d from libvpx (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/40026\">#40026</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/d892c2b1c8e53e0ed9dc887989f0a9fe3239fe56\"><code>d892c2b</code></a>\r\nbuild: fixup autoninja (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/39899\">#39899</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/6132e80a4f109056ad303052341e2f278284eb67\"><code>6132e80</code></a>\r\nbuild: run on circle hosts for forks (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/39865\">#39865</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/electron/electron/commit/a953199af39a587ca510bbb6486f118ffa12fe8f\"><code>a953199</code></a>\r\nbuild: use aks backed runners for linux builds (<a\r\nhref=\"https://redirect.github.com/electron/electron/issues/39838\">#39838</a>)</li>\r\n<li>See full diff in <a\r\nhref=\"https://github.com/electron/electron/compare/v22.3.24...v22.3.25\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=electron&package-manager=npm_and_yarn&previous-version=22.3.24&new-version=22.3.25)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2023-10-06T18:26:01Z",
          "tree_id": "b0053e9d89b66c78aa6453d43c7d203fab9efd7a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/f34fdbc69574ae6ce8a2ebb76b8a094f53d6f266"
        },
        "date": 1696617051724,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 153517,
            "range": "±1.02%",
            "unit": "ops/sec",
            "extra": "232 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 151596,
            "range": "±1.17%",
            "unit": "ops/sec",
            "extra": "232 samples"
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
          "id": "d3184cd28b468a889bd2480b4d6a60a43d61b69f",
          "message": "Update issue bot (#6552)\n\n- Removes task which posts reminders for the team to respond to issues\r\n- Removes task which reopens closed issues when the author comments.\r\nThis is buggy with the new system since \"close and comment\" cannot be\r\ndifferentiated anymore\r\n- Removes auto-assignment to OCE",
          "timestamp": "2023-10-10T12:14:18-07:00",
          "tree_id": "4fbfdec3b18994baf172c69813e713ba6714de1c",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/d3184cd28b468a889bd2480b4d6a60a43d61b69f"
        },
        "date": 1696965578210,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 150339,
            "range": "±1.67%",
            "unit": "ops/sec",
            "extra": "230 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 148431,
            "range": "±1.52%",
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
          "id": "3f02f79c53c5904494e7d8bc15ffab36971a7f26",
          "message": "Implement preconnect to speed up /token calls, refactor static class methods to exported methods for better minification (#6550)\n\nAdds a\r\n[preconnect](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preconnect)\r\nlink element to the document header in flows where we're reasonably sure\r\nwe will hit the /token endpoint (acquireTokenPopup, ssoSilent,\r\nacquireTokenSilent after RT expiration). This tells the browser to start\r\nresolving DNS and establishing the SSL connection so that when the\r\n/token call is made it doesn't need to wait for these steps to complete\r\n(can take up to 300ms). This is a short lived connection and the browser\r\nwill kill it if not used promptly so I've included a cleanup function on\r\na timer (10s)\r\n\r\nAlso de-classed BrowserUtils for size reduction while I was adding a new\r\nfunction there anyway.",
          "timestamp": "2023-10-11T15:22:03-07:00",
          "tree_id": "f481528b2820df0c38d926ee522efbee7cbf134a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/3f02f79c53c5904494e7d8bc15ffab36971a7f26"
        },
        "date": 1697063249983,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 132127,
            "range": "±1.47%",
            "unit": "ops/sec",
            "extra": "226 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 129739,
            "range": "±1.36%",
            "unit": "ops/sec",
            "extra": "227 samples"
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
          "id": "0f5e6c2142889ea9f43d808f270aec9264afd363",
          "message": "Build account objects from cached ID Token (#6529)\n\nThis PR:\r\n\r\n- Removes ID token claims from cached account entities\r\n- Refactors `getAllAccounts` to only use `getAccountsFilteredBy` in\r\norder to remove duplicated logic\r\n- Adds `staticAuthorityOptions` to CacheManager so environment matching\r\ncan work in cases where `resolveEndpointsAsync` hasn't resolved and\r\nthere is no authority metadata in memory\r\n- Refactors `Authority.getCloudDiscoveryMetadataFromHardCodedSources`\r\ninto an exported function and moves it into `AuthorityMetadata` so it\r\ncan be reused in environment matching\r\n- Fixes #6228\r\n\r\n---------\r\n\r\nCo-authored-by: Sameera Gajjarapu <sameera.gajjarapu@microsoft.com>\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2023-10-11T17:45:09-07:00",
          "tree_id": "e808873cddca83a02ce5fd3da05b8201ba1b94da",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/0f5e6c2142889ea9f43d808f270aec9264afd363"
        },
        "date": 1697071826892,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 135795,
            "range": "±1.59%",
            "unit": "ops/sec",
            "extra": "219 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 129631,
            "range": "±1.51%",
            "unit": "ops/sec",
            "extra": "226 samples"
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
          "id": "487be359ff08d4c8fc82a7232d04048172023409",
          "message": "Replace custom encoder with TextEncoder in code challenge generator (#6560)\n\nReplaces custom encoding implementation with browser provided API which\r\nis much faster.\r\n\r\nOur custom decoding implementation is not used anywhere so that has been\r\nremoved as well.",
          "timestamp": "2023-10-12T13:23:20-07:00",
          "tree_id": "f3399a19e5d556490765952c9afc195ce800a291",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/487be359ff08d4c8fc82a7232d04048172023409"
        },
        "date": 1697142519939,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 146903,
            "range": "±1.93%",
            "unit": "ops/sec",
            "extra": "227 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 146646,
            "range": "±1.54%",
            "unit": "ops/sec",
            "extra": "232 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "shoatman@microsoft.com",
            "name": "Shane Oatman",
            "username": "shoatman"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "618c4caa4bf0fb0bd64128dadb7a0c8a681c6b87",
          "message": "Shoatman/naa latest (#6359)\n\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2023-10-12T15:58:51-07:00",
          "tree_id": "d648e7913893865b8935cb8883b037d834951bba",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/618c4caa4bf0fb0bd64128dadb7a0c8a681c6b87"
        },
        "date": 1697151817779,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 158277,
            "range": "±1.07%",
            "unit": "ops/sec",
            "extra": "237 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 159542,
            "range": "±1.00%",
            "unit": "ops/sec",
            "extra": "236 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "shoatman@microsoft.com",
            "name": "Shane Oatman",
            "username": "shoatman"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "d5ae4e0ea383a70cd74d75002b16d7583b2809e2",
          "message": "addressing rollup issue based when using 2 outputs for one input (#6567)\n\nI saw random discussion about a problem with trying to output both cjs\r\nand umd at the same time. I split and the issues with the UMD output\r\nwent away. (no longer prefixing inlined dyanamic imports with \"index.\"\r\n\r\nI confirmed the UMD output no longer is prefixed.... let's see how the\r\nvarious builds do now.",
          "timestamp": "2023-10-16T14:16:11-07:00",
          "tree_id": "65fe5cb321904f433ad9852ba2a6c08294dff302",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/d5ae4e0ea383a70cd74d75002b16d7583b2809e2"
        },
        "date": 1697491336514,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 124044,
            "range": "±1.77%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 126021,
            "range": "±1.51%",
            "unit": "ops/sec",
            "extra": "222 samples"
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
          "id": "31fb0a77a6bf9db77a41330fa09a76db4ff030c0",
          "message": "More ATS instrumentation (#6562)\n\n- Adds measurement to track reason for a cache miss\r\n- Splits the execute post request measurement into separate measurements\r\nfor RT redemption versus Auth Code redemption\r\n- Adds additional measurements to break down caching",
          "timestamp": "2023-10-16T21:43:19Z",
          "tree_id": "c7d116768dfbc44ae085dcb0650ca4e6e4f53bff",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/31fb0a77a6bf9db77a41330fa09a76db4ff030c0"
        },
        "date": 1697492926383,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 120296,
            "range": "±1.83%",
            "unit": "ops/sec",
            "extra": "209 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 119649,
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
          "id": "cfac159c239152524542e7fe6d76ca5e0b415b7f",
          "message": "Instrument create and remove hidden iframe & refactor silent handler into exported functions (#6533)\n\n- Adds instrumentation for loadFrame, loadFrameSync and\r\nremoveHiddenIframe\r\n- Refactors SilentHandler into static functions\r\n- Refactors monitorIframeForHash to do less work inside setInterval",
          "timestamp": "2023-10-17T11:43:16-07:00",
          "tree_id": "ae8d9551c1730b32c4a0fd9f89a7f4d15f502c96",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/cfac159c239152524542e7fe6d76ca5e0b415b7f"
        },
        "date": 1697568567996,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 112893,
            "range": "±2.02%",
            "unit": "ops/sec",
            "extra": "217 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 113818,
            "range": "±1.80%",
            "unit": "ops/sec",
            "extra": "215 samples"
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
          "id": "333afb6a7e250c8b42b01b106120c41a9b78a94d",
          "message": "Deleted msal-node's package-lock.json (#6571)\n\nThis file should have been deleted as part of the original npm\r\nworkspaces PR. It breaks npm workspaces when developing in msal-node.",
          "timestamp": "2023-10-17T20:02:07-04:00",
          "tree_id": "a26c32deb7ec9d5b59b67f3cdf481cc8a94a8bc6",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/333afb6a7e250c8b42b01b106120c41a9b78a94d"
        },
        "date": 1697587647417,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 142122,
            "range": "±1.74%",
            "unit": "ops/sec",
            "extra": "234 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 144691,
            "range": "±1.26%",
            "unit": "ops/sec",
            "extra": "225 samples"
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
          "id": "9934e3b07118403898e65091035d26295e55f128",
          "message": "Bump @babel/traverse from 7.22.11 to 7.23.2 (#6572)\n\nBumps\r\n[@babel/traverse](https://github.com/babel/babel/tree/HEAD/packages/babel-traverse)\r\nfrom 7.22.11 to 7.23.2.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/babel/babel/releases\"><code>@​babel/traverse</code>'s\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>v7.23.2 (2023-10-11)</h2>\r\n<p><strong>NOTE</strong>: This release also re-publishes\r\n<code>@babel/core</code>, even if it does not appear in the linked\r\nrelease commit.</p>\r\n<p>Thanks <a\r\nhref=\"https://github.com/jimmydief\"><code>@​jimmydief</code></a> for\r\nyour first PR!</p>\r\n<h4>:bug: Bug Fix</h4>\r\n<ul>\r\n<li><code>babel-traverse</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/16033\">#16033</a>\r\nOnly evaluate own String/Number/Math methods (<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-preset-typescript</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/16022\">#16022</a>\r\nRewrite <code>.tsx</code> extension when using\r\n<code>rewriteImportExtensions</code> (<a\r\nhref=\"https://github.com/jimmydief\"><code>@​jimmydief</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-helpers</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/16017\">#16017</a>\r\nFix: fallback to typeof when toString is applied to incompatible object\r\n(<a href=\"https://github.com/JLHwung\"><code>@​JLHwung</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-helpers</code>,\r\n<code>babel-plugin-transform-modules-commonjs</code>,\r\n<code>babel-runtime-corejs2</code>, <code>babel-runtime-corejs3</code>,\r\n<code>babel-runtime</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/16025\">#16025</a>\r\nAvoid override mistake in namespace imports (<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n</ul>\r\n</li>\r\n</ul>\r\n<h4>Committers: 5</h4>\r\n<ul>\r\n<li>Babel Bot (<a\r\nhref=\"https://github.com/babel-bot\"><code>@​babel-bot</code></a>)</li>\r\n<li>Huáng Jùnliàng (<a\r\nhref=\"https://github.com/JLHwung\"><code>@​JLHwung</code></a>)</li>\r\n<li>James Diefenderfer (<a\r\nhref=\"https://github.com/jimmydief\"><code>@​jimmydief</code></a>)</li>\r\n<li>Nicolò Ribaudo (<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n<li><a\r\nhref=\"https://github.com/liuxingbaoyu\"><code>@​liuxingbaoyu</code></a></li>\r\n</ul>\r\n<h2>v7.23.1 (2023-09-25)</h2>\r\n<p>Re-publishing <code>@babel/helpers</code> due to a publishing error\r\nin 7.23.0.</p>\r\n<h2>v7.23.0 (2023-09-25)</h2>\r\n<p>Thanks <a\r\nhref=\"https://github.com/lorenzoferre\"><code>@​lorenzoferre</code></a>\r\nand <a\r\nhref=\"https://github.com/RajShukla1\"><code>@​RajShukla1</code></a> for\r\nyour first PRs!</p>\r\n<h4>:rocket: New Feature</h4>\r\n<ul>\r\n<li><code>babel-plugin-proposal-import-wasm-source</code>,\r\n<code>babel-plugin-syntax-import-source</code>,\r\n<code>babel-plugin-transform-dynamic-import</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15870\">#15870</a>\r\nSupport transforming <code>import source</code> for wasm (<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-helper-module-transforms</code>,\r\n<code>babel-helpers</code>,\r\n<code>babel-plugin-proposal-import-defer</code>,\r\n<code>babel-plugin-syntax-import-defer</code>,\r\n<code>babel-plugin-transform-modules-commonjs</code>,\r\n<code>babel-runtime-corejs2</code>, <code>babel-runtime-corejs3</code>,\r\n<code>babel-runtime</code>, <code>babel-standalone</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15878\">#15878</a>\r\nImplement <code>import defer</code> proposal transform support (<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-generator</code>, <code>babel-parser</code>,\r\n<code>babel-types</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15845\">#15845</a>\r\nImplement <code>import defer</code> parsing support (<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15829\">#15829</a> Add\r\nparsing support for the &quot;source phase imports&quot; proposal (<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-generator</code>,\r\n<code>babel-helper-module-transforms</code>, <code>babel-parser</code>,\r\n<code>babel-plugin-transform-dynamic-import</code>,\r\n<code>babel-plugin-transform-modules-amd</code>,\r\n<code>babel-plugin-transform-modules-commonjs</code>,\r\n<code>babel-plugin-transform-modules-systemjs</code>,\r\n<code>babel-traverse</code>, <code>babel-types</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15682\">#15682</a> Add\r\n<code>createImportExpressions</code> parser option (<a\r\nhref=\"https://github.com/JLHwung\"><code>@​JLHwung</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-standalone</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15671\">#15671</a>\r\nPass through nonce to the transformed script element (<a\r\nhref=\"https://github.com/JLHwung\"><code>@​JLHwung</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-helper-function-name</code>,\r\n<code>babel-helper-member-expression-to-functions</code>,\r\n<code>babel-helpers</code>, <code>babel-parser</code>,\r\n<code>babel-plugin-proposal-destructuring-private</code>,\r\n<code>babel-plugin-proposal-optional-chaining-assign</code>,\r\n<code>babel-plugin-syntax-optional-chaining-assign</code>,\r\n<code>babel-plugin-transform-destructuring</code>,\r\n<code>babel-plugin-transform-optional-chaining</code>,\r\n<code>babel-runtime-corejs2</code>, <code>babel-runtime-corejs3</code>,\r\n<code>babel-runtime</code>, <code>babel-standalone</code>,\r\n<code>babel-types</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15751\">#15751</a> Add\r\nsupport for optional chain in assignments (<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-helpers</code>,\r\n<code>babel-plugin-proposal-decorators</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15895\">#15895</a>\r\nImplement the &quot;decorator metadata&quot; proposal (<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-traverse</code>, <code>babel-types</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15893\">#15893</a> Add\r\n<code>t.buildUndefinedNode</code> (<a\r\nhref=\"https://github.com/liuxingbaoyu\"><code>@​liuxingbaoyu</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-preset-typescript</code></li>\r\n</ul>\r\n<!-- raw HTML omitted -->\r\n</blockquote>\r\n<p>... (truncated)</p>\r\n</details>\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/babel/babel/blob/main/CHANGELOG.md\"><code>@​babel/traverse</code>'s\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h2>v7.23.2 (2023-10-11)</h2>\r\n<h4>:bug: Bug Fix</h4>\r\n<ul>\r\n<li><code>babel-traverse</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/16033\">#16033</a>\r\nOnly evaluate own String/Number/Math methods (<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-preset-typescript</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/16022\">#16022</a>\r\nRewrite <code>.tsx</code> extension when using\r\n<code>rewriteImportExtensions</code> (<a\r\nhref=\"https://github.com/jimmydief\"><code>@​jimmydief</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-helpers</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/16017\">#16017</a>\r\nFix: fallback to typeof when toString is applied to incompatible object\r\n(<a href=\"https://github.com/JLHwung\"><code>@​JLHwung</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-helpers</code>,\r\n<code>babel-plugin-transform-modules-commonjs</code>,\r\n<code>babel-runtime-corejs2</code>, <code>babel-runtime-corejs3</code>,\r\n<code>babel-runtime</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/16025\">#16025</a>\r\nAvoid override mistake in namespace imports (<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n</ul>\r\n</li>\r\n</ul>\r\n<h2>v7.23.0 (2023-09-25)</h2>\r\n<h4>:rocket: New Feature</h4>\r\n<ul>\r\n<li><code>babel-plugin-proposal-import-wasm-source</code>,\r\n<code>babel-plugin-syntax-import-source</code>,\r\n<code>babel-plugin-transform-dynamic-import</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15870\">#15870</a>\r\nSupport transforming <code>import source</code> for wasm (<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-helper-module-transforms</code>,\r\n<code>babel-helpers</code>,\r\n<code>babel-plugin-proposal-import-defer</code>,\r\n<code>babel-plugin-syntax-import-defer</code>,\r\n<code>babel-plugin-transform-modules-commonjs</code>,\r\n<code>babel-runtime-corejs2</code>, <code>babel-runtime-corejs3</code>,\r\n<code>babel-runtime</code>, <code>babel-standalone</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15878\">#15878</a>\r\nImplement <code>import defer</code> proposal transform support (<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-generator</code>, <code>babel-parser</code>,\r\n<code>babel-types</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15845\">#15845</a>\r\nImplement <code>import defer</code> parsing support (<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15829\">#15829</a> Add\r\nparsing support for the &quot;source phase imports&quot; proposal (<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-generator</code>,\r\n<code>babel-helper-module-transforms</code>, <code>babel-parser</code>,\r\n<code>babel-plugin-transform-dynamic-import</code>,\r\n<code>babel-plugin-transform-modules-amd</code>,\r\n<code>babel-plugin-transform-modules-commonjs</code>,\r\n<code>babel-plugin-transform-modules-systemjs</code>,\r\n<code>babel-traverse</code>, <code>babel-types</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15682\">#15682</a> Add\r\n<code>createImportExpressions</code> parser option (<a\r\nhref=\"https://github.com/JLHwung\"><code>@​JLHwung</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-standalone</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15671\">#15671</a>\r\nPass through nonce to the transformed script element (<a\r\nhref=\"https://github.com/JLHwung\"><code>@​JLHwung</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-helper-function-name</code>,\r\n<code>babel-helper-member-expression-to-functions</code>,\r\n<code>babel-helpers</code>, <code>babel-parser</code>,\r\n<code>babel-plugin-proposal-destructuring-private</code>,\r\n<code>babel-plugin-proposal-optional-chaining-assign</code>,\r\n<code>babel-plugin-syntax-optional-chaining-assign</code>,\r\n<code>babel-plugin-transform-destructuring</code>,\r\n<code>babel-plugin-transform-optional-chaining</code>,\r\n<code>babel-runtime-corejs2</code>, <code>babel-runtime-corejs3</code>,\r\n<code>babel-runtime</code>, <code>babel-standalone</code>,\r\n<code>babel-types</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15751\">#15751</a> Add\r\nsupport for optional chain in assignments (<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-helpers</code>,\r\n<code>babel-plugin-proposal-decorators</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15895\">#15895</a>\r\nImplement the &quot;decorator metadata&quot; proposal (<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-traverse</code>, <code>babel-types</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15893\">#15893</a> Add\r\n<code>t.buildUndefinedNode</code> (<a\r\nhref=\"https://github.com/liuxingbaoyu\"><code>@​liuxingbaoyu</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-preset-typescript</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15913\">#15913</a> Add\r\n<code>rewriteImportExtensions</code> option to TS preset (<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-parser</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15896\">#15896</a>\r\nAllow TS tuples to have both labeled and unlabeled elements (<a\r\nhref=\"https://github.com/yukukotani\"><code>@​yukukotani</code></a>)</li>\r\n</ul>\r\n</li>\r\n</ul>\r\n<h4>:bug: Bug Fix</h4>\r\n<ul>\r\n<li><code>babel-plugin-transform-block-scoping</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15962\">#15962</a>\r\nfix: <code>transform-block-scoping</code> captures the variables of the\r\nmethod in the loop (<a\r\nhref=\"https://github.com/liuxingbaoyu\"><code>@​liuxingbaoyu</code></a>)</li>\r\n</ul>\r\n</li>\r\n</ul>\r\n<h4>:nail_care: Polish</h4>\r\n<ul>\r\n<li><code>babel-traverse</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15797\">#15797</a>\r\nExpand evaluation of global built-ins in <code>@babel/traverse</code>\r\n(<a\r\nhref=\"https://github.com/lorenzoferre\"><code>@​lorenzoferre</code></a>)</li>\r\n</ul>\r\n</li>\r\n<li><code>babel-plugin-proposal-explicit-resource-management</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15985\">#15985</a>\r\nImprove source maps for blocks with <code>using</code> declarations (<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n</ul>\r\n</li>\r\n</ul>\r\n<h4>:microscope: Output optimization</h4>\r\n<ul>\r\n<li><code>babel-core</code>,\r\n<code>babel-helper-module-transforms</code>,\r\n<code>babel-plugin-transform-async-to-generator</code>,\r\n<code>babel-plugin-transform-classes</code>,\r\n<code>babel-plugin-transform-dynamic-import</code>,\r\n<code>babel-plugin-transform-function-name</code>,\r\n<code>babel-plugin-transform-modules-amd</code>,\r\n<code>babel-plugin-transform-modules-commonjs</code>,\r\n<code>babel-plugin-transform-modules-umd</code>,\r\n<code>babel-plugin-transform-parameters</code>,\r\n<code>babel-plugin-transform-react-constant-elements</code>,\r\n<code>babel-plugin-transform-react-inline-elements</code>,\r\n<code>babel-plugin-transform-runtime</code>,\r\n<code>babel-plugin-transform-typescript</code>,\r\n<code>babel-preset-env</code>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/babel/babel/pull/15984\">#15984</a>\r\nInline <code>exports.XXX =</code> update in simple variable declarations\r\n(<a\r\nhref=\"https://github.com/nicolo-ribaudo\"><code>@​nicolo-ribaudo</code></a>)</li>\r\n</ul>\r\n</li>\r\n</ul>\r\n<h2>v7.22.20 (2023-09-16)</h2>\r\n<!-- raw HTML omitted -->\r\n</blockquote>\r\n<p>... (truncated)</p>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/babel/babel/commit/b4b9942a6cde0685c222eb3412347880aae40ad5\"><code>b4b9942</code></a>\r\nv7.23.2</li>\r\n<li><a\r\nhref=\"https://github.com/babel/babel/commit/b13376b346946e3f62fc0848c1d2a23223314c82\"><code>b13376b</code></a>\r\nOnly evaluate own String/Number/Math methods (<a\r\nhref=\"https://github.com/babel/babel/tree/HEAD/packages/babel-traverse/issues/16033\">#16033</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/babel/babel/commit/ca58ec15cb6dde6812c36997477e44880bec0bba\"><code>ca58ec1</code></a>\r\nv7.23.0</li>\r\n<li><a\r\nhref=\"https://github.com/babel/babel/commit/0f333dafcf470f1970083e4e695ced6aec8bead0\"><code>0f333da</code></a>\r\nAdd <code>createImportExpressions</code> parser option (<a\r\nhref=\"https://github.com/babel/babel/tree/HEAD/packages/babel-traverse/issues/15682\">#15682</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/babel/babel/commit/3744545649fdc21688a2f3c97e1e39dbebff0d21\"><code>3744545</code></a>\r\nFix linting</li>\r\n<li><a\r\nhref=\"https://github.com/babel/babel/commit/c7e6806e2194deb36c330f543409c792592b22d4\"><code>c7e6806</code></a>\r\nAdd <code>t.buildUndefinedNode</code> (<a\r\nhref=\"https://github.com/babel/babel/tree/HEAD/packages/babel-traverse/issues/15893\">#15893</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/babel/babel/commit/38ee8b4dd693f1e2bd00107bbc1167ce84736ea0\"><code>38ee8b4</code></a>\r\nExpand evaluation of global built-ins in <code>@babel/traverse</code>\r\n(<a\r\nhref=\"https://github.com/babel/babel/tree/HEAD/packages/babel-traverse/issues/15797\">#15797</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/babel/babel/commit/9f3dfd90211472cf0083a3234dd1a1b857ce3624\"><code>9f3dfd9</code></a>\r\nv7.22.20</li>\r\n<li><a\r\nhref=\"https://github.com/babel/babel/commit/3ed28b29c1fb15588369bdd55187b69f1248e87d\"><code>3ed28b2</code></a>\r\nFully support <code>||</code> and <code>&amp;&amp;</code> in\r\n<code>pluginToggleBooleanFlag</code> (<a\r\nhref=\"https://github.com/babel/babel/tree/HEAD/packages/babel-traverse/issues/15961\">#15961</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/babel/babel/commit/77b0d7359909c94f3797c24006f244847fbc8d6d\"><code>77b0d73</code></a>\r\nv7.22.19</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/babel/babel/commits/v7.23.2/packages/babel-traverse\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=@babel/traverse&package-manager=npm_and_yarn&previous-version=7.22.11&new-version=7.23.2)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2023-10-18T10:23:18-07:00",
          "tree_id": "64a3453ae1d683a6787d8b2051c60b4cffc85a37",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/9934e3b07118403898e65091035d26295e55f128"
        },
        "date": 1697650125454,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 131260,
            "range": "±1.50%",
            "unit": "ops/sec",
            "extra": "227 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 129619,
            "range": "±1.61%",
            "unit": "ops/sec",
            "extra": "224 samples"
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
          "id": "ce665da7df8c584fe8f889c4856729cd285fead2",
          "message": "October Release #2 (#6587)\n\nCo-authored-by: tnorling <tnorling@users.noreply.github.com>",
          "timestamp": "2023-10-20T15:25:42-07:00",
          "tree_id": "5bad3f3f07d74a0e93470b391ba4722ed60ec347",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/ce665da7df8c584fe8f889c4856729cd285fead2"
        },
        "date": 1697841022880,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 154661,
            "range": "±1.21%",
            "unit": "ops/sec",
            "extra": "233 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 152557,
            "range": "±0.92%",
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
          "id": "3e4c956c57e1476632cab77832493d4d0c51470b",
          "message": "Don't use temporary cache for silent & popup flows (#6586)\n\nSilent and Popup flows don't need to use temporary cache because they\r\ndon't lose context the way the Redirect flow does. Applying this across\r\nthe board causes unnecessary stringification, storage, lookup and\r\nparsing in those flows, especially since the code isn't shared across\r\nthose flows anyway.\r\n\r\nThis PR refactors the popup and silent flows to pass the request object\r\nthrough the stack instead of storing and looking up in sessionStorage.\r\nThe redirect flow will continue to utilize sessionStorage for temp\r\ncache.",
          "timestamp": "2023-10-20T16:38:04-07:00",
          "tree_id": "b257c183510c9b6276ccd8e86b4f275fb98985f2",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/3e4c956c57e1476632cab77832493d4d0c51470b"
        },
        "date": 1697845376271,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 154657,
            "range": "±1.27%",
            "unit": "ops/sec",
            "extra": "227 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 153810,
            "range": "±1.13%",
            "unit": "ops/sec",
            "extra": "237 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "bogavril@microsoft.com",
            "name": "Bogdan Gavril",
            "username": "bgavrilMS"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "289b937631ac226fb0081860a67de26bf9c4be90",
          "message": "Add express session maxAge (#6554)\n\nThis is to force AAD to re-evaluate the user access, since the cache\r\nstorage is done on a per user basis, i.e. shared by several sessions\r\nthat the user could open.",
          "timestamp": "2023-10-23T16:27:35Z",
          "tree_id": "efb93dacc0d72e35879235a5edf948a3ee39bfb0",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/289b937631ac226fb0081860a67de26bf9c4be90"
        },
        "date": 1698078750054,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 150462,
            "range": "±1.39%",
            "unit": "ops/sec",
            "extra": "235 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 150036,
            "range": "±1.30%",
            "unit": "ops/sec",
            "extra": "232 samples"
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
          "id": "a9442419c825fdf209114820aae300b79a32452a",
          "message": "Fix iframe fallback when RT is not found in cache (#6599)\n\nIt seems this fallback behavior was missed in the transition from v2 to\r\nv3. When the RT cannot be found in the cache we should try to fallback\r\nto the iframe flow. Also includes minor refactor to make the code more\r\nreadable and remove some unnecessary work.",
          "timestamp": "2023-10-23T17:22:01-07:00",
          "tree_id": "2237eb9b71d5026306ca896df50cada47f5a8e23",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/a9442419c825fdf209114820aae300b79a32452a"
        },
        "date": 1698107212693,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 156521,
            "range": "±1.11%",
            "unit": "ops/sec",
            "extra": "234 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 152593,
            "range": "±1.40%",
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
          "id": "f0092e21d988682bc1dca95e887d0b11b19b4e29",
          "message": "Add pipeline to run 1p PWB e2e tests (#6598)\n\n- Add pipeline to run 1p PWB e2e tests.",
          "timestamp": "2023-10-24T15:05:18-04:00",
          "tree_id": "eb48d3fe8ca6f45b7ebad7b004b50f9f3b9f7c24",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/f0092e21d988682bc1dca95e887d0b11b19b4e29"
        },
        "date": 1698174641677,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 156936,
            "range": "±1.01%",
            "unit": "ops/sec",
            "extra": "232 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 152010,
            "range": "±1.18%",
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
          "id": "5f49a5e39a6d0d5ae319c7a21ed18d06d8a6fd51",
          "message": "Refactor token cache entities into types (#6580)\n\nRefactors `CredentialEntity`, `IdTokenEntity`, `AccessTokenEntity`, and\r\n`RefreshTokenEntity` to be Types rather than a Class and moves static\r\nclass methods into functions exported to the `CacheHelpers` namespace.\r\n\r\nMaking these types and separating the class methods from the type\r\ndefinition allows us to read from the cache and directly use the value\r\nwithout needing to first copy each key/value pair into an instance of\r\nthe class (the `toObject` helper function). Doing it this way also\r\nresults in a small bundle size improvement.\r\n\r\nReviews can be focused on the `msal-common/src/cache` folder. The rest\r\nof the changes are repetitively changing references to the affected\r\nfunctions",
          "timestamp": "2023-10-24T19:50:04Z",
          "tree_id": "791bac6a50aa14a4280f54fc5a7a416885aaf627",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/5f49a5e39a6d0d5ae319c7a21ed18d06d8a6fd51"
        },
        "date": 1698177328978,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 149864,
            "range": "±1.32%",
            "unit": "ops/sec",
            "extra": "231 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 146626,
            "range": "±1.35%",
            "unit": "ops/sec",
            "extra": "229 samples"
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
          "id": "bfb5b4a2a94699b77e9ffc3f5116277ec2bc78fd",
          "message": "Bump next from 13.4.19 to 13.5.0 (#6606)\n\nBumps [next](https://github.com/vercel/next.js) from 13.4.19 to 13.5.0.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/vercel/next.js/releases\">next's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>v13.4.20-canary.41</h2>\r\n<h3>Core Changes</h3>\r\n<ul>\r\n<li>Add <code>mui-core</code> to the default\r\n<code>optimizePackageImports</code> list: <a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55554\">#55554</a></li>\r\n<li>Consolidate experimental React opt-in &amp; add <code>ppr</code>\r\nflag: <a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55560\">#55560</a></li>\r\n<li>Add react-icons to optimizePackageImports: <a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55572\">#55572</a></li>\r\n<li>Fix useState function initialiser case for\r\n<code>optimize_server_react</code> transform: <a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55551\">#55551</a></li>\r\n<li>Update supported config options for Turbopack: <a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55556\">#55556</a></li>\r\n<li>Fix react packages are not bundled for metadata routes: <a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55579\">#55579</a></li>\r\n<li>improve internal error logging: <a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55582\">#55582</a></li>\r\n<li>fix styled-jsx alias: <a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55581\">#55581</a></li>\r\n</ul>\r\n<h3>Documentation Changes</h3>\r\n<ul>\r\n<li>chore: Fix heading hierarchy in revalidateTag documentation: <a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55470\">#55470</a></li>\r\n<li>chore: replace issue triaing actions with <code>nissuer</code>: <a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55525\">#55525</a></li>\r\n</ul>\r\n<h3>Credits</h3>\r\n<p>Huge thanks to <a\r\nhref=\"https://github.com/romeobravo\"><code>@​romeobravo</code></a>, <a\r\nhref=\"https://github.com/shuding\"><code>@​shuding</code></a>, <a\r\nhref=\"https://github.com/ztanner\"><code>@​ztanner</code></a>, <a\r\nhref=\"https://github.com/balazsorban44\"><code>@​balazsorban44</code></a>,\r\n<a href=\"https://github.com/padmaia\"><code>@​padmaia</code></a>, <a\r\nhref=\"https://github.com/huozhi\"><code>@​huozhi</code></a>, and <a\r\nhref=\"https://github.com/sokra\"><code>@​sokra</code></a> for\r\nhelping!</p>\r\n<h2>v13.4.20-canary.40</h2>\r\n<h3>Core Changes</h3>\r\n<ul>\r\n<li>Fix missing module.compiled trace file and unhandledRejection in\r\nensurePage: <a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55553\">#55553</a></li>\r\n</ul>\r\n<h3>Example Changes</h3>\r\n<ul>\r\n<li>Type Error on Event Type payment_intent webhook: <a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55493\">#55493</a></li>\r\n<li>Correct spelling in playwright docs: <a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55557\">#55557</a></li>\r\n</ul>\r\n<h3>Credits</h3>\r\n<p>Huge thanks to <a\r\nhref=\"https://github.com/roigecode\"><code>@​roigecode</code></a>, <a\r\nhref=\"https://github.com/hoop71\"><code>@​hoop71</code></a>, and <a\r\nhref=\"https://github.com/ijjk\"><code>@​ijjk</code></a> for helping!</p>\r\n<h2>v13.4.20-canary.39</h2>\r\n<h3>Core Changes</h3>\r\n<ul>\r\n<li>fix next.js own build on windows: <a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55544\">#55544</a></li>\r\n<li>Fix notFound status code with ISR in app: <a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55542\">#55542</a></li>\r\n<li>Disable client-only for middleware and pages api layer: <a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55541\">#55541</a></li>\r\n</ul>\r\n<h3>Documentation Changes</h3>\r\n<ul>\r\n<li>Add route groups example to revalidatePath doc: <a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55543\">#55543</a></li>\r\n</ul>\r\n<h3>Misc Changes</h3>\r\n<ul>\r\n<li>chore(third-parties): replace rimraf with rm.mjs: <a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55547\">#55547</a></li>\r\n</ul>\r\n<!-- raw HTML omitted -->\r\n</blockquote>\r\n<p>... (truncated)</p>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/ffafad2c35a3f9677bb520f68e989f58f192b931\"><code>ffafad2</code></a>\r\nv13.5.0</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/4a589ed83db304b07b2a18002fff419cb4727222\"><code>4a589ed</code></a>\r\nv13.4.20-canary.41</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/deb81cf246d83233a7d2c0320f19bc4518a37ae4\"><code>deb81cf</code></a>\r\nfix styled-jsx alias (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55581\">#55581</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/1a9b0f6f7a03ccdc825f92c654b8ca991f27d3fc\"><code>1a9b0f6</code></a>\r\nimprove internal error logging (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55582\">#55582</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/063154918c28b4f2a45ffd8d506fc44924483d6e\"><code>0631549</code></a>\r\nFix react packages are not bundled for metadata routes (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55579\">#55579</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/bad53655e8669389e534578980791079b37ea37f\"><code>bad5365</code></a>\r\nUpdate supported config options for Turbopack (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55556\">#55556</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/8881c413a38a3dc0844f4a74f5bfed25b63fd0e7\"><code>8881c41</code></a>\r\nFix useState function initialiser case for\r\n<code>optimize_server_react</code> transform ...</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/10250119dfed2a40fb65cdad171094fb916293e2\"><code>1025011</code></a>\r\nAdd react-icons to optimizePackageImports (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55572\">#55572</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/d5c35a1bbb647f8b5a8d3d00c8d2a9c02113d29c\"><code>d5c35a1</code></a>\r\nchore: replace issue triaing actions with <code>nissuer</code> (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55525\">#55525</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/33c561b21d59a2b5b2bf63389c353916f1cee20e\"><code>33c561b</code></a>\r\nConsolidate experimental React opt-in &amp; add <code>ppr</code> flag\r\n(<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/55560\">#55560</a>)</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/vercel/next.js/compare/v13.4.19...v13.5.0\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=next&package-manager=npm_and_yarn&previous-version=13.4.19&new-version=13.5.0)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2023-10-25T12:58:54-07:00",
          "tree_id": "e88c65c28801a393e83e993cd41d880db28ee397",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/bfb5b4a2a94699b77e9ffc3f5116277ec2bc78fd"
        },
        "date": 1698264312030,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 116644,
            "range": "±2.22%",
            "unit": "ops/sec",
            "extra": "210 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 113213,
            "range": "±2.05%",
            "unit": "ops/sec",
            "extra": "218 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "levon@amelyan.com",
            "name": "Leo Amelyan",
            "username": "lamelyan"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "13e8fc5998624934d4506b7d56bcc91a77ebded7",
          "message": "Update configuration.md (#6568)\n\nUpdate link to MSAL configuration options. The previous link just goes\r\nto the general docs page.\r\n\r\n---------\r\n\r\nCo-authored-by: Hector Morales <hemoral@microsoft.com>\r\nCo-authored-by: Hector Morales <hectormg@hey.com>\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2023-10-27T09:46:39-07:00",
          "tree_id": "bec670b21d1a0007c8fb4c284611e305f034726a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/13e8fc5998624934d4506b7d56bcc91a77ebded7"
        },
        "date": 1698425488571,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 153491,
            "range": "±1.06%",
            "unit": "ops/sec",
            "extra": "236 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 150660,
            "range": "±1.19%",
            "unit": "ops/sec",
            "extra": "224 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "janusz@forserial.org",
            "name": "Janusz Dziurzyński",
            "username": "rzyns"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "ffe542b30693153a63afeb3a98ff2804b846d13e",
          "message": "Fix downstream ESM imports, fixes #6573 (#6600)\n\nUses default import for importing keytar (a CJS module), which is really\r\nthe only foolproof way of importing CJS from an ESM context.\r\n\r\nI confirmed by creating a simple package:\r\n```json5\r\n// msal-node-extensions/foo/package.json\r\n{ \"type\": \"module\" }\r\n```\r\n\r\n```js\r\n// msal-node-extensions/foo/index.js\r\nimport * as msal from \"../dist/index.mjs\";\r\nmsal;\r\n```\r\n\r\n\r\nRunning `node foo/index.mjs` on `dev` gives the following error:\r\n\r\n```\r\nfile:///.../microsoft-authentication-library-for-js/extensions/msal-node-extensions/dist/persistence/KeychainPersistence.mjs:3\r\nimport { setPassword, getPassword, deletePassword } from 'keytar';\r\n                                   ^^^^^^^^^^^^^^\r\nSyntaxError: Named export 'deletePassword' not found. The requested module 'keytar' is a CommonJS module, which may not support all module.exports as named exports.\r\nCommonJS modules can always be imported via the default export, for example using:\r\n\r\nimport pkg from 'keytar';\r\nconst { setPassword, getPassword, deletePassword } = pkg;\r\n\r\n    at ModuleJob._instantiate (node:internal/modules/esm/module_job:124:21)\r\n    at async ModuleJob.run (node:internal/modules/esm/module_job:190:5)\r\n\r\nNode.js v18.17.1\r\n```\r\n\r\nRunning the same command on this branch succeeds (no output, exit code\r\n0).\r\n\r\nNot sure of a good/reliable way to encode that in an automated test, but\r\nI'd be happy to add one if anyone has any suggestions",
          "timestamp": "2023-10-27T09:45:51-07:00",
          "tree_id": "4c28762ed8fcee085588c9c38dae8aa88a08f7ed",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/ffe542b30693153a63afeb3a98ff2804b846d13e"
        },
        "date": 1698425494493,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 128162,
            "range": "±1.71%",
            "unit": "ops/sec",
            "extra": "225 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 126342,
            "range": "±1.52%",
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
          "id": "bf61f42aff220c33ae4b0e248cc4aa9009306f3a",
          "message": "Update popup & redirect flows to use invokeAsync (#6612)\n\nUpdates remaining references to `setPreQueueTime` to use the\r\n`invokeAsync` helper instead",
          "timestamp": "2023-10-27T13:34:20-07:00",
          "tree_id": "a9d6d3845a4614b2395977bf0c238710c4523581",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/bf61f42aff220c33ae4b0e248cc4aa9009306f3a"
        },
        "date": 1698439234738,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 114792,
            "range": "±1.57%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 113393,
            "range": "±1.82%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "a8e0c73f25c736814495ce13aacf7313a7cbfc67",
          "message": "Bump browserify-sign from 4.2.1 to 4.2.2 (#6623)\n\nBumps\r\n[browserify-sign](https://github.com/crypto-browserify/browserify-sign)\r\nfrom 4.2.1 to 4.2.2.\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/browserify/browserify-sign/blob/main/CHANGELOG.md\">browserify-sign's\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h2><a\r\nhref=\"https://github.com/browserify/browserify-sign/compare/v4.2.1...v4.2.2\">v4.2.2</a>\r\n- 2023-10-25</h2>\r\n<h3>Fixed</h3>\r\n<ul>\r\n<li>[Tests] log when openssl doesn't support cipher <a\r\nhref=\"https://redirect.github.com/browserify/browserify-sign/issues/37\"><code>[#37](https://github.com/crypto-browserify/browserify-sign/issues/37)</code></a></li>\r\n</ul>\r\n<h3>Commits</h3>\r\n<ul>\r\n<li>Only apps should have lockfiles <a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/09a89959393b3c89fedd4f7f3bafa4fec44371d7\"><code>09a8995</code></a></li>\r\n<li>[eslint] switch to eslint <a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/83fe46374b819e959d56d2c0b931308f7451a664\"><code>83fe463</code></a></li>\r\n<li>[meta] add <code>npmignore</code> and <code>auto-changelog</code> <a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/44181838e7dcc4d5d0c568f74312ea28f0bcdfd5\"><code>4418183</code></a></li>\r\n<li>[meta] fix package.json indentation <a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/9ac5a5eaaac8a11eb70ec2febd13745c8764ae02\"><code>9ac5a5e</code></a></li>\r\n<li>[Tests] migrate from travis to github actions <a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/d845d855def38e2085d5a21e447a48300f99fa60\"><code>d845d85</code></a></li>\r\n<li>[Fix] <code>sign</code>: throw on unsupported padding scheme <a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/8767739a4516289568bcce9fed8a3b7e23478de9\"><code>8767739</code></a></li>\r\n<li>[Fix] properly check the upper bound for DSA signatures <a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/85994cd6348b50f2fd1b73c54e20881416f44a30\"><code>85994cd</code></a></li>\r\n<li>[Tests] handle openSSL not supporting a scheme <a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/f5f17c27f9824de40b5ce8ebd8502111203fd6af\"><code>f5f17c2</code></a></li>\r\n<li>[Deps] update <code>bn.js</code>, <code>browserify-rsa</code>,\r\n<code>elliptic</code>, <code>parse-asn1</code>,\r\n<code>readable-stream</code>, <code>safe-buffer</code> <a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/a67d0eb4ffceabb366b69da69ce9a223e9d5e96b\"><code>a67d0eb</code></a></li>\r\n<li>[Dev Deps] update <code>nyc</code>, <code>standard</code>,\r\n<code>tape</code> <a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/cc5350b96702fcba930e0662cf763844fd2f59bf\"><code>cc5350b</code></a></li>\r\n<li>[Tests] always run coverage; downgrade <code>nyc</code> <a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/75ce1d5c49a6591dd13422016c07f8f9cae13371\"><code>75ce1d5</code></a></li>\r\n<li>[meta] add <code>safe-publish-latest</code> <a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/dcf49ce85a1a66a6fb31689508d916d7894286a9\"><code>dcf49ce</code></a></li>\r\n<li>[Tests] add <code>npm run posttest</code> <a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/75dd8fd6ce56eb37b12e30807e5f913867b21733\"><code>75dd8fd</code></a></li>\r\n<li>[Dev Deps] update <code>tape</code> <a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/3aec0386dc8dfba8698be756ec770df863867c84\"><code>3aec038</code></a></li>\r\n<li>[Tests] skip unsupported schemes <a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/703c83ea72db2f45714fe749c6f04b05243ca9a8\"><code>703c83e</code></a></li>\r\n<li>[Tests] node &lt; 6 lacks array <code>includes</code> <a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/3aa43cfbc1fdde8481bcdd3bff581574159b869a\"><code>3aa43cf</code></a></li>\r\n<li>[Dev Deps] fix eslint range <a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/98d4e0d7ff18871b0ca07415f758a610ccf8ebbe\"><code>98d4e0d</code></a></li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/4af5a90bf8acd9e76e5671dc0497f6ba71968a2c\"><code>4af5a90</code></a>\r\nv4.2.2</li>\r\n<li><a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/3aec0386dc8dfba8698be756ec770df863867c84\"><code>3aec038</code></a>\r\n[Dev Deps] update <code>tape</code></li>\r\n<li><a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/85994cd6348b50f2fd1b73c54e20881416f44a30\"><code>85994cd</code></a>\r\n[Fix] properly check the upper bound for DSA signatures</li>\r\n<li><a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/9ac5a5eaaac8a11eb70ec2febd13745c8764ae02\"><code>9ac5a5e</code></a>\r\n[meta] fix package.json indentation</li>\r\n<li><a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/dcf49ce85a1a66a6fb31689508d916d7894286a9\"><code>dcf49ce</code></a>\r\n[meta] add <code>safe-publish-latest</code></li>\r\n<li><a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/44181838e7dcc4d5d0c568f74312ea28f0bcdfd5\"><code>4418183</code></a>\r\n[meta] add <code>npmignore</code> and <code>auto-changelog</code></li>\r\n<li><a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/8767739a4516289568bcce9fed8a3b7e23478de9\"><code>8767739</code></a>\r\n[Fix] <code>sign</code>: throw on unsupported padding scheme</li>\r\n<li><a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/5f6fb1755917851a40249db7d834da4265ed5950\"><code>5f6fb17</code></a>\r\n[Tests] log when openssl doesn't support cipher</li>\r\n<li><a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/f5f17c27f9824de40b5ce8ebd8502111203fd6af\"><code>f5f17c2</code></a>\r\n[Tests] handle openSSL not supporting a scheme</li>\r\n<li><a\r\nhref=\"https://github.com/browserify/browserify-sign/commit/d845d855def38e2085d5a21e447a48300f99fa60\"><code>d845d85</code></a>\r\n[Tests] migrate from travis to github actions</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/crypto-browserify/browserify-sign/compare/v4.2.1...v4.2.2\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<details>\r\n<summary>Maintainer changes</summary>\r\n<p>This version was pushed to npm by <a\r\nhref=\"https://www.npmjs.com/~ljharb\">ljharb</a>, a new releaser for\r\nbrowserify-sign since your current version.</p>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=browserify-sign&package-manager=npm_and_yarn&previous-version=4.2.1&new-version=4.2.2)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2023-10-30T08:52:06-04:00",
          "tree_id": "ac1ad8498a8e14050ced880a8c5b894874d81ad6",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/a8e0c73f25c736814495ce13aacf7313a7cbfc67"
        },
        "date": 1698670699064,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 124804,
            "range": "±1.57%",
            "unit": "ops/sec",
            "extra": "218 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 123495,
            "range": "±1.84%",
            "unit": "ops/sec",
            "extra": "222 samples"
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
          "id": "9296e4b86b6834c6160583771a598bf9de59372d",
          "message": "Add \"inlineDynamicImports\" to rollup config to fix CJS build. Make factory methods basic functions (#6615)\n\n- Add \"inlineDynamicImports\" to rollup config to fix CJS build.\r\n- Make factory methods basic functions.",
          "timestamp": "2023-10-30T09:31:41-04:00",
          "tree_id": "1e59422f8cc66b3293730012dc5e0fc870d42e77",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/9296e4b86b6834c6160583771a598bf9de59372d"
        },
        "date": 1698673027391,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 156027,
            "range": "±1.16%",
            "unit": "ops/sec",
            "extra": "234 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 144229,
            "range": "±1.13%",
            "unit": "ops/sec",
            "extra": "227 samples"
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
          "id": "20e2ce3ef9b22b4848587c51cc95b61319dca737",
          "message": "Bump \"next\" package for nextjs sample (#6630)\n\n- Fixes an issue with missing \"next\" package.",
          "timestamp": "2023-10-30T12:47:02-04:00",
          "tree_id": "6c62f564315dae9ea10aae72166ccf2cf47275df",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/20e2ce3ef9b22b4848587c51cc95b61319dca737"
        },
        "date": 1698684716644,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 151426,
            "range": "±1.35%",
            "unit": "ops/sec",
            "extra": "234 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 151981,
            "range": "±1.10%",
            "unit": "ops/sec",
            "extra": "235 samples"
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
          "id": "ec68b28506f247884c1f843b1cbd9d39c088733a",
          "message": "Bump actions/setup-node from 3 to 4 (#6627)\n\nBumps [actions/setup-node](https://github.com/actions/setup-node) from 3\r\nto 4.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/actions/setup-node/releases\">actions/setup-node's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>v4.0.0</h2>\r\n<h2>What's Changed</h2>\r\n<p>In scope of this release we changed version of node runtime for\r\naction from node16 to node20 and updated dependencies in <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/866\">actions/setup-node#866</a></p>\r\n<p>Besides, release contains such changes as:</p>\r\n<ul>\r\n<li>Upgrade actions/checkout to v4 by <a\r\nhref=\"https://github.com/gmembre-zenika\"><code>@​gmembre-zenika</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/868\">actions/setup-node#868</a></li>\r\n<li>Update actions/checkout for documentation and yaml by <a\r\nhref=\"https://github.com/dmitry-shibanov\"><code>@​dmitry-shibanov</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/876\">actions/setup-node#876</a></li>\r\n</ul>\r\n<h2>New Contributors</h2>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/gmembre-zenika\"><code>@​gmembre-zenika</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/868\">actions/setup-node#868</a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/actions/setup-node/compare/v3...v4.0.0\">https://github.com/actions/setup-node/compare/v3...v4.0.0</a></p>\r\n<h2>v3.8.2</h2>\r\n<h2>What's Changed</h2>\r\n<ul>\r\n<li>Update semver by <a\r\nhref=\"https://github.com/dmitry-shibanov\"><code>@​dmitry-shibanov</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/861\">actions/setup-node#861</a></li>\r\n<li>Update temp directory creation by <a\r\nhref=\"https://github.com/nikolai-laevskii\"><code>@​nikolai-laevskii</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/859\">actions/setup-node#859</a></li>\r\n<li>Bump <code>@​babel/traverse</code> from 7.15.4 to 7.23.2 by <a\r\nhref=\"https://github.com/dependabot\"><code>@​dependabot</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/870\">actions/setup-node#870</a></li>\r\n<li>Add notice about binaries not being updated yet by <a\r\nhref=\"https://github.com/nikolai-laevskii\"><code>@​nikolai-laevskii</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/872\">actions/setup-node#872</a></li>\r\n<li>Update toolkit cache and core by <a\r\nhref=\"https://github.com/dmitry-shibanov\"><code>@​dmitry-shibanov</code></a>\r\nand <a\r\nhref=\"https://github.com/seongwon-privatenote\"><code>@​seongwon-privatenote</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/875\">actions/setup-node#875</a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/actions/setup-node/compare/v3...v3.8.2\">https://github.com/actions/setup-node/compare/v3...v3.8.2</a></p>\r\n<h2>v3.8.1</h2>\r\n<h2>What's Changed</h2>\r\n<p>In scope of this release, the filter was removed within the\r\ncache-save step by <a\r\nhref=\"https://github.com/dmitry-shibanov\"><code>@​dmitry-shibanov</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/831\">actions/setup-node#831</a>.\r\nIt is filtered and checked in the toolkit/cache library.</p>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/actions/setup-node/compare/v3...v3.8.1\">https://github.com/actions/setup-node/compare/v3...v3.8.1</a></p>\r\n<h2>v3.8.0</h2>\r\n<h2>What's Changed</h2>\r\n<h3>Bug fixes:</h3>\r\n<ul>\r\n<li>Add check for existing paths by <a\r\nhref=\"https://github.com/dmitry-shibanov\"><code>@​dmitry-shibanov</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/803\">actions/setup-node#803</a></li>\r\n<li>Resolve SymbolicLink by <a\r\nhref=\"https://github.com/dmitry-shibanov\"><code>@​dmitry-shibanov</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/809\">actions/setup-node#809</a></li>\r\n<li>Change passing logic for cache input by <a\r\nhref=\"https://github.com/dmitry-shibanov\"><code>@​dmitry-shibanov</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/816\">actions/setup-node#816</a></li>\r\n<li>Fix armv7 cache issue by <a\r\nhref=\"https://github.com/louislam\"><code>@​louislam</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/794\">actions/setup-node#794</a></li>\r\n<li>Update check-dist workflow name by <a\r\nhref=\"https://github.com/sinchang\"><code>@​sinchang</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/710\">actions/setup-node#710</a></li>\r\n</ul>\r\n<h3>Feature implementations:</h3>\r\n<ul>\r\n<li>feat: handling the case where &quot;node&quot; is used for\r\ntool-versions file. by <a\r\nhref=\"https://github.com/xytis\"><code>@​xytis</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/812\">actions/setup-node#812</a></li>\r\n</ul>\r\n<h3>Documentation changes:</h3>\r\n<ul>\r\n<li>Refer to semver package name in README.md by <a\r\nhref=\"https://github.com/olleolleolle\"><code>@​olleolleolle</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/808\">actions/setup-node#808</a></li>\r\n</ul>\r\n<h3>Update dependencies:</h3>\r\n<ul>\r\n<li>Update toolkit cache to fix zstd by <a\r\nhref=\"https://github.com/dmitry-shibanov\"><code>@​dmitry-shibanov</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/804\">actions/setup-node#804</a></li>\r\n<li>Bump tough-cookie and <code>@​azure/ms-rest-js</code> by <a\r\nhref=\"https://github.com/dependabot\"><code>@​dependabot</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/802\">actions/setup-node#802</a></li>\r\n<li>Bump semver from 6.1.2 to 6.3.1 by <a\r\nhref=\"https://github.com/dependabot\"><code>@​dependabot</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/setup-node/pull/807\">actions/setup-node#807</a></li>\r\n</ul>\r\n<!-- raw HTML omitted -->\r\n</blockquote>\r\n<p>... (truncated)</p>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/actions/setup-node/commit/8f152de45cc393bb48ce5d89d36b731f54556e65\"><code>8f152de</code></a>\r\nUpdate actions/checkout for documentation and yaml (<a\r\nhref=\"https://redirect.github.com/actions/setup-node/issues/876\">#876</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/actions/setup-node/commit/23755b521f87533c8ed7f8fb13674f9021579e34\"><code>23755b5</code></a>\r\nupgrade actions/checkout to v4 (<a\r\nhref=\"https://redirect.github.com/actions/setup-node/issues/868\">#868</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/actions/setup-node/commit/54534a2a9ba7308e8a8995af3104899e6a95b681\"><code>54534a2</code></a>\r\nChange node version for action to node20 (<a\r\nhref=\"https://redirect.github.com/actions/setup-node/issues/866\">#866</a>)</li>\r\n<li>See full diff in <a\r\nhref=\"https://github.com/actions/setup-node/compare/v3...v4\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=actions/setup-node&package-manager=github_actions&previous-version=3&new-version=4)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\n\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2023-10-30T11:11:48-07:00",
          "tree_id": "2f97756606d113e37f8424a1d5d471e4d06b24a3",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/ec68b28506f247884c1f843b1cbd9d39c088733a"
        },
        "date": 1698689916365,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 114665,
            "range": "±1.68%",
            "unit": "ops/sec",
            "extra": "215 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 109768,
            "range": "±1.86%",
            "unit": "ops/sec",
            "extra": "216 samples"
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
          "id": "c93777ed04311851fe2a7028bb5d86e073c98f52",
          "message": "Fix hardcoded metadata fetching for tenanted authorities (#6622)\n\nThis PR:\r\n- Updates hardcoded Cloud Discovery Metadata to the correct value from\r\nthe network response\r\n- Returns a cached account without ID token claims if the matching ID\r\ntoken cannot be found\r\n- Adds end-to-end tests for AAD tenanted authorities\r\n- Fixes #6608  and #6602",
          "timestamp": "2023-10-30T14:37:20-07:00",
          "tree_id": "c1a8d39bc920930135bef13813304c6de197b30f",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/c93777ed04311851fe2a7028bb5d86e073c98f52"
        },
        "date": 1698702207748,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 117958,
            "range": "±1.71%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 114548,
            "range": "±1.69%",
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
          "id": "b561834d3e0647e421633a94088be25bab4f0b6a",
          "message": "October 2023 Patch Release (#6634)\n\nCo-authored-by: hectormmg <hectormmg@users.noreply.github.com>",
          "timestamp": "2023-10-30T16:27:26-07:00",
          "tree_id": "d584a28ba8cc3fb3c3f2526421927e319d0a6238",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/b561834d3e0647e421633a94088be25bab4f0b6a"
        },
        "date": 1698708773673,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 132257,
            "range": "±1.51%",
            "unit": "ops/sec",
            "extra": "225 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 125271,
            "range": "±1.68%",
            "unit": "ops/sec",
            "extra": "211 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "travis.walker@microsoft.com",
            "name": "Travis Walker",
            "username": "trwalke"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "9ed331c47f6a8d6c10a640a884a3db966f6a58a4",
          "message": "Removing allowestsrnonmsi query parameter (#6582)\n\nFix for\r\nhttps://github.com/AzureAD/microsoft-authentication-library-for-js/issues/6557\r\nRemoving allowestsrnonmsi query parameter\r\n\r\n---------\r\n\r\nCo-authored-by: trwalke <trwalke@microsoft.com>",
          "timestamp": "2023-10-31T15:46:00Z",
          "tree_id": "8d1a495e9d6a76e300fbc3e183ae5d179a601dfc",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/9ed331c47f6a8d6c10a640a884a3db966f6a58a4"
        },
        "date": 1698767548007,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 102837,
            "range": "±1.77%",
            "unit": "ops/sec",
            "extra": "219 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 100099,
            "range": "±1.80%",
            "unit": "ops/sec",
            "extra": "219 samples"
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
          "id": "33ae9c8143a924c2d7f2114c1ff4a869c259a97c",
          "message": "Instrument functions that drop multiple matched tokens (#6647)\n\n- Instrument functions that drop multiple matched tokens.",
          "timestamp": "2023-11-01T14:59:47-04:00",
          "tree_id": "20c92cbab71eaf6d0e1ec38893495300a7fdf2c4",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/33ae9c8143a924c2d7f2114c1ff4a869c259a97c"
        },
        "date": 1698865580928,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 113012,
            "range": "±1.95%",
            "unit": "ops/sec",
            "extra": "211 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 110800,
            "range": "±1.89%",
            "unit": "ops/sec",
            "extra": "220 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "janusz@corechain.tech",
            "name": "Janusz Dziurzyński",
            "username": "rzyns"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "25472ea4b5fb2ecef8eada945fa7c9f7eb0f2557",
          "message": "Fix Environment.getUserRootDirectory() on Non-Windows Platforms (#6581)\n\nfix: `Environment.getUserRootDirectory()` only ever executes Windows\r\ncode path\r\n\r\nFrom the Azure msal-node\r\n[docs](https://github.com/MicrosoftDocs/azure-docs/blob/e622cd3bded2530b8db7843cd9539fd16f0cd67c/articles/active-directory/develop/msal-node-extensions.md?plain=1#L50-L52):\r\n```typescript\r\n// You can use the helper functions provided through the Environment class to construct your cache path\r\n// The helper functions provide consistent implementations across Windows, Mac and Linux.\r\nconst cachePath = path.join(Environment.getUserRootDirectory(), \"./cache.json\");\r\n```\r\nThe existing (broken) code:\r\n\r\n\r\nhttps://github.com/AzureAD/microsoft-authentication-library-for-js/blob/9934e3b07118403898e65091035d26295e55f128/extensions/msal-node-extensions/src/utils/Environment.ts#L59-L63\r\n\r\nmsal-node-extensions: `Environment.getUserHomeDirOnUnix()` was never\r\ncalled, because `!this.isWindowsPlatform` would always be false, since\r\n`isWindowsPlatform()` is a static method and not a property getter (or\r\nproperty)\r\n\r\n---------\r\n\r\nSigned-off-by: Janusz Dziurzynski <janusz@corechain.tech>",
          "timestamp": "2023-11-02T09:42:44-07:00",
          "tree_id": "209f0152603f13043049a9dc3c364d6b451febad",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/25472ea4b5fb2ecef8eada945fa7c9f7eb0f2557"
        },
        "date": 1698943727556,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 120150,
            "range": "±1.74%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 114730,
            "range": "±1.75%",
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
          "id": "42a5e13c333d34be82734bcc3cd91ff7e8dd7d25",
          "message": "Change ServerTelemetryEntity from Class to Type (#6651)\n\nContinuation of the work to convert cache entities from classes to types\r\nand moving the related static methods to CacheHelpers namespace",
          "timestamp": "2023-11-02T14:02:36-07:00",
          "tree_id": "50924151e59fc6bb9b71f5728fca4fb787173569",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/42a5e13c333d34be82734bcc3cd91ff7e8dd7d25"
        },
        "date": 1698959279130,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 207441,
            "range": "±1.15%",
            "unit": "ops/sec",
            "extra": "230 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 196697,
            "range": "±2.00%",
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
          "id": "db14ee4cb268de9e048fb3ab31a953917f2abdeb",
          "message": "Fix no refresh required log message (#6644)\n\nThis PR:\r\n- Updates ATS instrumentation to change logger message when cache\r\noutcome is 0 and doesn't require a refresh\r\n\r\n---------\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2023-11-03T14:49:20-07:00",
          "tree_id": "45cda6be07fe5ee0ff72f1dcd9382f026372638f",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/db14ee4cb268de9e048fb3ab31a953917f2abdeb"
        },
        "date": 1699048540982,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 110749,
            "range": "±2.04%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 113908,
            "range": "±1.64%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "e9dd9337c02fcfe008514f5fd057087d3409cc91",
          "message": "Make SHR header configurable (#6654)\n\nThis PR:\r\n- Adds an `shrOptions` attribute to `BaseAuthRequest` to allow\r\napplications to override header claims such as `typ` in the SHR returned\r\n- Renames and exposes `JsonWebTokenTypes` for convenience",
          "timestamp": "2023-11-04T14:43:22-07:00",
          "tree_id": "4066531edc4746d140eaf666ad95eccd0cbec077",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/e9dd9337c02fcfe008514f5fd057087d3409cc91"
        },
        "date": 1699134488138,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 156559,
            "range": "±1.23%",
            "unit": "ops/sec",
            "extra": "235 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 156072,
            "range": "±1.07%",
            "unit": "ops/sec",
            "extra": "218 samples"
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
          "id": "619e10fe4ffb23060137150cd93c954cc2ca05ae",
          "message": "Optimize response parsing (#6646)\n\nThis PR optimizes response fragment/query parsing by:\r\n- ensuring it only happens once (today /authorize responses are parsed\r\nat least twice and up to 3 times in a single request)\r\n- using APIs provided by the browser/node runtime rather than our own,\r\nslower, implementation\r\n- ensuring we correctly extract the fragment or query depending on what\r\nwas configured by OIDCOptions (there are bugs related to this today)\r\n- renames references to \"hash\" to \"response\" to reflect the fact that it\r\ncan come from either the hash or query\r\n- removes popup timeout logic which only started counting once the popup\r\nreturned to the redirectUri. We should consider implementing a timeout\r\nfor the entire operation but this may be a breaking change so left that\r\nout of scope for this PR.",
          "timestamp": "2023-11-06T11:59:39-08:00",
          "tree_id": "96bea9f86f016b615d8ff1f09ff5a7034816ab2b",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/619e10fe4ffb23060137150cd93c954cc2ca05ae"
        },
        "date": 1699301088687,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 187555,
            "range": "±2.29%",
            "unit": "ops/sec",
            "extra": "213 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 197712,
            "range": "±1.91%",
            "unit": "ops/sec",
            "extra": "233 samples"
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
          "id": "460e17d0fd02938cfe2d2404c977ac9cf002c6b0",
          "message": "Fix redirect clearing popup hash (#6652)\n\nThe handleRedirectPromise logic contains a bug which can result in popup\r\nwindows not closing. This PR fixes that bug.\r\n\r\nToday handleRedirectPromise does the following things:\r\n1. Parses the hash and looks for known properties\r\n2. Clears the hash from the window\r\n3. Parses state to determine if the response belongs to a Redirect\r\n4. Returns null if not\r\n\r\nBecause we clear the hash before we've determined if the response is\r\neven a redirect response this can result in race conditions preventing\r\npopup windows from closing if the popup uses a redirectUri which invokes\r\nhandleRedirectPromise (most apps using React or Angular do this out of\r\nthe box)\r\n\r\nThis PR addresses this bug by parsing state for the interactionType\r\n_before_ clearing the hash.",
          "timestamp": "2023-11-06T14:42:16-08:00",
          "tree_id": "7e8cc6eb732242933b3d5a1f08328867cebe0a5a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/460e17d0fd02938cfe2d2404c977ac9cf002c6b0"
        },
        "date": 1699310841720,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 186268,
            "range": "±2.03%",
            "unit": "ops/sec",
            "extra": "212 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 199691,
            "range": "±1.86%",
            "unit": "ops/sec",
            "extra": "224 samples"
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
          "id": "53ca42e1b4b04b70c13b6d4c697cb3e2477b1005",
          "message": "Create one correlationId across a flow (#6650)\n\nWhen the request is not initialized with a correlationId, this PR\r\nensures that the msal js generates only one correlationId across the\r\nflow and the perf events around the flow.",
          "timestamp": "2023-11-06T15:21:28-08:00",
          "tree_id": "30722d3982fe17b9c2c3622504cee7c4207c07bb",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/53ca42e1b4b04b70c13b6d4c697cb3e2477b1005"
        },
        "date": 1699313191000,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 192850,
            "range": "±1.85%",
            "unit": "ops/sec",
            "extra": "215 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 199825,
            "range": "±1.48%",
            "unit": "ops/sec",
            "extra": "233 samples"
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
          "id": "2bc32d539b86a2a7aa2dcbfcb00aa24b40cbe7c0",
          "message": "Add node 16 support (#6656)\n\nAdds Node 16 to supported versions",
          "timestamp": "2023-11-06T16:01:02-08:00",
          "tree_id": "6c241584d013ff20c7403053e7ba811ab8c522c5",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/2bc32d539b86a2a7aa2dcbfcb00aa24b40cbe7c0"
        },
        "date": 1699315567428,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 196364,
            "range": "±2.06%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187911,
            "range": "±2.02%",
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
          "id": "787aa62c42de5c275be5f8892ceac798132a8ed3",
          "message": "Bump package versions (#6659)\n\nCo-authored-by: tnorling <tnorling@users.noreply.github.com>",
          "timestamp": "2023-11-06T16:35:46-08:00",
          "tree_id": "1f8fe18f4ede6ae2102ce4a63af5059f367d7c97",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/787aa62c42de5c275be5f8892ceac798132a8ed3"
        },
        "date": 1699317653714,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 181994,
            "range": "±1.90%",
            "unit": "ops/sec",
            "extra": "219 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 183094,
            "range": "±1.90%",
            "unit": "ops/sec",
            "extra": "220 samples"
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
          "id": "f085dcbb122aab1ede38af5c940974d820028fe4",
          "message": "Fix success template not rendering (#6666)\n\nTests to follow",
          "timestamp": "2023-11-07T12:58:12-08:00",
          "tree_id": "70bab9200977eb6a77d5c352ed708e6b2949b10a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/f085dcbb122aab1ede38af5c940974d820028fe4"
        },
        "date": 1699391033604,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 130607,
            "range": "±1.52%",
            "unit": "ops/sec",
            "extra": "224 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 128458,
            "range": "±1.77%",
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
          "id": "d37574232dae46a7aebdbd969bfbcc4c705dad08",
          "message": "Msal-Node Patch Release (#6667)\n\nPatch release for msal-node including success template fix\r\n\r\n---------\r\n\r\nCo-authored-by: tnorling <tnorling@users.noreply.github.com>",
          "timestamp": "2023-11-07T13:10:09-08:00",
          "tree_id": "38fcef17c161a606f4d3769a11c71a09f6d795ff",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/d37574232dae46a7aebdbd969bfbcc4c705dad08"
        },
        "date": 1699391748006,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 133225,
            "range": "±1.23%",
            "unit": "ops/sec",
            "extra": "224 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 133881,
            "range": "±1.64%",
            "unit": "ops/sec",
            "extra": "225 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "travis.walker@microsoft.com",
            "name": "Travis Walker",
            "username": "trwalke"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "a274857a16d9f765b35254ee390e5ca194aefed0",
          "message": "Adding logging to make regional scenarios more clear (#6641)\n\nWas able to confirm the regional configuration api works. Logs make the\r\nused endpoint misleading.\r\nFix for\r\nhttps://github.com/AzureAD/microsoft-authentication-library-for-js/issues/6510\r\n\r\n---------\r\n\r\nCo-authored-by: trwalke <trwalke@microsoft.com>",
          "timestamp": "2023-11-08T06:22:41Z",
          "tree_id": "7a762bd82b1bf2e7a243fe2aaf50658e67c3557b",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/a274857a16d9f765b35254ee390e5ca194aefed0"
        },
        "date": 1699424927848,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 130217,
            "range": "±1.46%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 129048,
            "range": "±1.68%",
            "unit": "ops/sec",
            "extra": "220 samples"
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
          "id": "9225d42c915af330895373e05213aed842d3eec5",
          "message": "Add E2E test for AcquireTokenInteractive (#6669)\n\nE2E test for AcquireTokenInteractive, including verification of the\r\nsuccess template. Closes out the work for #6666",
          "timestamp": "2023-11-08T22:27:03Z",
          "tree_id": "b5007aa147b9d8c72c8158b4260cb88e67f823a1",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/9225d42c915af330895373e05213aed842d3eec5"
        },
        "date": 1699482739426,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 224811,
            "range": "±1.28%",
            "unit": "ops/sec",
            "extra": "239 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 182833,
            "range": "±2.03%",
            "unit": "ops/sec",
            "extra": "222 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "dasau@microsoft.com",
            "name": "codexeon",
            "username": "codexeon"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "6ac9a88f28c119362be6d3f981b0503b2297f451",
          "message": "Nested App Auth fixes (#6672)\n\nSome minor fixes from initial NAA fix including:\r\n\r\n- expiresOn AuthenticationResult contained the wrong value.\r\n- expires_in should be used with timestamp before request was made to\r\nserver, to account for time deltas between servers.\r\n- authenticationScheme was returning empty\r\n- AccountInfo was not returning idTokenClaims, and should use id token\r\nfor properties as a fallback.\r\n- Added authority parameter for server to host to return authority used\r\nin the request.\r\n- Avoid making call to getActiveAccount if host does not support it.\r\n- Merge client capabilities and claims before sending request to host.\r\n- uniqueId should be localAccountId to match implementation of existing\r\nmsal-browser.\r\n- Removes toNaaSilentTokenRequest which had the same behavior as\r\nexisting toNaaTokenRequest.\r\n- Handle state parameter locally in MSAL.js",
          "timestamp": "2023-11-10T06:28:42Z",
          "tree_id": "230765ab1a5982f3e2ce67cfa8788f8df05c2106",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/6ac9a88f28c119362be6d3f981b0503b2297f451"
        },
        "date": 1699598090178,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 107213,
            "range": "±2.16%",
            "unit": "ops/sec",
            "extra": "212 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 111495,
            "range": "±2.05%",
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
          "id": "c7e042d457f6a1f464bb342c27a04b28f928880f",
          "message": "Bump axios from 1.5.0 to 1.6.0 (#6687)\n\nBumps [axios](https://github.com/axios/axios) from 1.5.0 to 1.6.0.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/axios/axios/releases\">axios's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>Release v1.6.0</h2>\r\n<h2>Release notes:</h2>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li><strong>CSRF:</strong> fixed CSRF vulnerability CVE-2023-45857 (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6028\">#6028</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/96ee232bd3ee4de2e657333d4d2191cd389e14d0\">96ee232</a>)</li>\r\n<li><strong>dns:</strong> fixed lookup function decorator to work\r\nproperly in node v20; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6011\">#6011</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/5aaff532a6b820bb9ab6a8cd0f77131b47e2adb8\">5aaff53</a>)</li>\r\n<li><strong>types:</strong> fix AxiosHeaders types; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/5931\">#5931</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/a1c8ad008b3c13d53e135bbd0862587fb9d3fc09\">a1c8ad0</a>)</li>\r\n</ul>\r\n<h3>PRs</h3>\r\n<ul>\r\n<li>CVE 2023 45857 ( <a\r\nhref=\"https://api.github.com/repos/axios/axios/pulls/6028\">#6028</a>\r\n)</li>\r\n</ul>\r\n<pre><code>\r\n⚠️ Critical vulnerability fix. See\r\nhttps://security.snyk.io/vuln/SNYK-JS-AXIOS-6032459\r\n</code></pre>\r\n<h3>Contributors to this release</h3>\r\n<ul>\r\n<li><!-- raw HTML omitted --> <a\r\nhref=\"https://github.com/DigitalBrainJS\" title=\"+449/-114\r\n([#6032](https://github.com/axios/axios/issues/6032)\r\n[#6021](https://github.com/axios/axios/issues/6021)\r\n[#6011](https://github.com/axios/axios/issues/6011)\r\n[#5932](https://github.com/axios/axios/issues/5932)\r\n[#5931](https://github.com/axios/axios/issues/5931) )\">Dmitriy\r\nMozgovoy</a></li>\r\n<li><!-- raw HTML omitted --> <a\r\nhref=\"https://github.com/valentin-panov\" title=\"+4/-4\r\n([#6028](https://github.com/axios/axios/issues/6028) )\">Valentin\r\nPanov</a></li>\r\n<li><!-- raw HTML omitted --> <a href=\"https://github.com/therealrinku\"\r\ntitle=\"+1/-1 ([#5889](https://github.com/axios/axios/issues/5889)\r\n)\">Rinku Chaudhari</a></li>\r\n</ul>\r\n<h2>Release v1.5.1</h2>\r\n<h2>Release notes:</h2>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li><strong>adapters:</strong> improved adapters loading logic to have\r\nclear error messages; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/5919\">#5919</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/e4107797a7a1376f6209fbecfbbce73d3faa7859\">e410779</a>)</li>\r\n<li><strong>formdata:</strong> fixed automatic addition of the\r\n<code>Content-Type</code> header for FormData in non-browser\r\nenvironments; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/5917\">#5917</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/bc9af51b1886d1b3529617702f2a21a6c0ed5d92\">bc9af51</a>)</li>\r\n<li><strong>headers:</strong> allow <code>content-encoding</code> header\r\nto handle case-insensitive values (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/5890\">#5890</a>)\r\n(<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/5892\">#5892</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/4c89f25196525e90a6e75eda9cb31ae0a2e18acd\">4c89f25</a>)</li>\r\n<li><strong>types:</strong> removed duplicated code (<a\r\nhref=\"https://github.com/axios/axios/commit/9e6205630e1c9cf863adf141c0edb9e6d8d4b149\">9e62056</a>)</li>\r\n</ul>\r\n<h3>Contributors to this release</h3>\r\n<ul>\r\n<li><!-- raw HTML omitted --> <a\r\nhref=\"https://github.com/DigitalBrainJS\" title=\"+89/-18\r\n([#5919](https://github.com/axios/axios/issues/5919)\r\n[#5917](https://github.com/axios/axios/issues/5917) )\">Dmitriy\r\nMozgovoy</a></li>\r\n<li><!-- raw HTML omitted --> <a href=\"https://github.com/DavidJDallas\"\r\ntitle=\"+11/-5 ()\">David Dallas</a></li>\r\n<li><!-- raw HTML omitted --> <a href=\"https://github.com/fb-sean\"\r\ntitle=\"+2/-8 ()\">Sean Sattler</a></li>\r\n<li><!-- raw HTML omitted --> <a href=\"https://github.com/0o001\"\r\ntitle=\"+4/-4 ()\">Mustafa Ateş Uzun</a></li>\r\n<li><!-- raw HTML omitted --> <a\r\nhref=\"https://github.com/sfc-gh-pmotacki\" title=\"+2/-1\r\n([#5892](https://github.com/axios/axios/issues/5892) )\">Przemyslaw\r\nMotacki</a></li>\r\n<li><!-- raw HTML omitted --> <a href=\"https://github.com/Cadienvan\"\r\ntitle=\"+1/-1 ()\">Michael Di Prisco</a></li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/axios/axios/blob/v1.x/CHANGELOG.md\">axios's\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h1><a\r\nhref=\"https://github.com/axios/axios/compare/v1.5.1...v1.6.0\">1.6.0</a>\r\n(2023-10-26)</h1>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li><strong>CSRF:</strong> fixed CSRF vulnerability CVE-2023-45857 (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6028\">#6028</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/96ee232bd3ee4de2e657333d4d2191cd389e14d0\">96ee232</a>)</li>\r\n<li><strong>dns:</strong> fixed lookup function decorator to work\r\nproperly in node v20; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6011\">#6011</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/5aaff532a6b820bb9ab6a8cd0f77131b47e2adb8\">5aaff53</a>)</li>\r\n<li><strong>types:</strong> fix AxiosHeaders types; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/5931\">#5931</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/a1c8ad008b3c13d53e135bbd0862587fb9d3fc09\">a1c8ad0</a>)</li>\r\n</ul>\r\n<h3>PRs</h3>\r\n<ul>\r\n<li>CVE 2023 45857 ( <a\r\nhref=\"https://api.github.com/repos/axios/axios/pulls/6028\">#6028</a>\r\n)</li>\r\n</ul>\r\n<pre><code>\r\n⚠️ Critical vulnerability fix. See\r\nhttps://security.snyk.io/vuln/SNYK-JS-AXIOS-6032459\r\n</code></pre>\r\n<h3>Contributors to this release</h3>\r\n<ul>\r\n<li><!-- raw HTML omitted --> <a\r\nhref=\"https://github.com/DigitalBrainJS\" title=\"+449/-114\r\n([#6032](https://github.com/axios/axios/issues/6032)\r\n[#6021](https://github.com/axios/axios/issues/6021)\r\n[#6011](https://github.com/axios/axios/issues/6011)\r\n[#5932](https://github.com/axios/axios/issues/5932)\r\n[#5931](https://github.com/axios/axios/issues/5931) )\">Dmitriy\r\nMozgovoy</a></li>\r\n<li><!-- raw HTML omitted --> <a\r\nhref=\"https://github.com/valentin-panov\" title=\"+4/-4\r\n([#6028](https://github.com/axios/axios/issues/6028) )\">Valentin\r\nPanov</a></li>\r\n<li><!-- raw HTML omitted --> <a href=\"https://github.com/therealrinku\"\r\ntitle=\"+1/-1 ([#5889](https://github.com/axios/axios/issues/5889)\r\n)\">Rinku Chaudhari</a></li>\r\n</ul>\r\n<h2><a\r\nhref=\"https://github.com/axios/axios/compare/v1.5.0...v1.5.1\">1.5.1</a>\r\n(2023-09-26)</h2>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li><strong>adapters:</strong> improved adapters loading logic to have\r\nclear error messages; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/5919\">#5919</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/e4107797a7a1376f6209fbecfbbce73d3faa7859\">e410779</a>)</li>\r\n<li><strong>formdata:</strong> fixed automatic addition of the\r\n<code>Content-Type</code> header for FormData in non-browser\r\nenvironments; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/5917\">#5917</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/bc9af51b1886d1b3529617702f2a21a6c0ed5d92\">bc9af51</a>)</li>\r\n<li><strong>headers:</strong> allow <code>content-encoding</code> header\r\nto handle case-insensitive values (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/5890\">#5890</a>)\r\n(<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/5892\">#5892</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/4c89f25196525e90a6e75eda9cb31ae0a2e18acd\">4c89f25</a>)</li>\r\n<li><strong>types:</strong> removed duplicated code (<a\r\nhref=\"https://github.com/axios/axios/commit/9e6205630e1c9cf863adf141c0edb9e6d8d4b149\">9e62056</a>)</li>\r\n</ul>\r\n<h3>Contributors to this release</h3>\r\n<ul>\r\n<li><!-- raw HTML omitted --> <a\r\nhref=\"https://github.com/DigitalBrainJS\" title=\"+89/-18\r\n([#5919](https://github.com/axios/axios/issues/5919)\r\n[#5917](https://github.com/axios/axios/issues/5917) )\">Dmitriy\r\nMozgovoy</a></li>\r\n<li><!-- raw HTML omitted --> <a href=\"https://github.com/DavidJDallas\"\r\ntitle=\"+11/-5 ()\">David Dallas</a></li>\r\n<li><!-- raw HTML omitted --> <a href=\"https://github.com/fb-sean\"\r\ntitle=\"+2/-8 ()\">Sean Sattler</a></li>\r\n<li><!-- raw HTML omitted --> <a href=\"https://github.com/0o001\"\r\ntitle=\"+4/-4 ()\">Mustafa Ateş Uzun</a></li>\r\n<li><!-- raw HTML omitted --> <a\r\nhref=\"https://github.com/sfc-gh-pmotacki\" title=\"+2/-1\r\n([#5892](https://github.com/axios/axios/issues/5892) )\">Przemyslaw\r\nMotacki</a></li>\r\n<li><!-- raw HTML omitted --> <a href=\"https://github.com/Cadienvan\"\r\ntitle=\"+1/-1 ()\">Michael Di Prisco</a></li>\r\n</ul>\r\n<h3>PRs</h3>\r\n<ul>\r\n<li>CVE 2023 45857 ( <a\r\nhref=\"https://api.github.com/repos/axios/axios/pulls/6028\">#6028</a>\r\n)</li>\r\n</ul>\r\n<pre><code>\r\n⚠️ Critical vulnerability fix. See\r\nhttps://security.snyk.io/vuln/SNYK-JS-AXIOS-6032459\r\n</code></pre>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/f7adacdbaa569281253c8cfc623ad3f4dc909c60\"><code>f7adacd</code></a>\r\nchore(release): v1.6.0 (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6031\">#6031</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/9917e67cbb6c157382863bad8c741de58e3f3c2b\"><code>9917e67</code></a>\r\nchore(ci): fix release-it arg; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6032\">#6032</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/96ee232bd3ee4de2e657333d4d2191cd389e14d0\"><code>96ee232</code></a>\r\nfix(CSRF): fixed CSRF vulnerability CVE-2023-45857 (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6028\">#6028</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/7d45ab2e2ad6e59f5475e39afd4b286b1f393fc0\"><code>7d45ab2</code></a>\r\nchore(tests): fixed tests to pass in node v19 and v20 with\r\n<code>keep-alive</code> enabl...</li>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/5aaff532a6b820bb9ab6a8cd0f77131b47e2adb8\"><code>5aaff53</code></a>\r\nfix(dns): fixed lookup function decorator to work properly in node v20;\r\n(<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6011\">#6011</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/a48a63ad823fc20e5a6a705f05f09842ca49f48c\"><code>a48a63a</code></a>\r\nchore(docs): added AxiosHeaders docs; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/5932\">#5932</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/a1c8ad008b3c13d53e135bbd0862587fb9d3fc09\"><code>a1c8ad0</code></a>\r\nfix(types): fix AxiosHeaders types; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/5931\">#5931</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/2ac731d60545ba5c4202c25fd2e732ddd8297d82\"><code>2ac731d</code></a>\r\nchore(docs): update readme.md (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/5889\">#5889</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/88fb52b5fad7aabab0532e7ad086c5f1b0178905\"><code>88fb52b</code></a>\r\nchore(release): v1.5.1 (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/5920\">#5920</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/e4107797a7a1376f6209fbecfbbce73d3faa7859\"><code>e410779</code></a>\r\nfix(adapters): improved adapters loading logic to have clear error\r\nmessages; ...</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/axios/axios/compare/v1.5.0...v1.6.0\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=axios&package-manager=npm_and_yarn&previous-version=1.5.0&new-version=1.6.0)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2023-11-10T14:49:26-08:00",
          "tree_id": "4bd42aa38884ae08c5fa572a9c71b2fb5a40e2ec",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/c7e042d457f6a1f464bb342c27a04b28f928880f"
        },
        "date": 1699656953606,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 112876,
            "range": "±2.24%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 108189,
            "range": "±2.18%",
            "unit": "ops/sec",
            "extra": "219 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "travis.walker@microsoft.com",
            "name": "Travis Walker",
            "username": "trwalke"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "aedda1e187df946e3f2be8f53e25d8b95b28e751",
          "message": "VS Code debugger setup for contributing. (#6671)\n\nAdding section for VS Code debugger setup\r\n\r\n---------\r\n\r\nCo-authored-by: trwalke <trwalke@microsoft.com>",
          "timestamp": "2023-11-13T22:37:37Z",
          "tree_id": "11dcf64b3ed7b5ddd759f838deee75f3772a7162",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/aedda1e187df946e3f2be8f53e25d8b95b28e751"
        },
        "date": 1699915384322,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 237026,
            "range": "±0.89%",
            "unit": "ops/sec",
            "extra": "236 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 231878,
            "range": "±1.24%",
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
          "id": "d14178b5d9ac4aadfc15015429bde177c0bd83c7",
          "message": "Fix logoutPopup request type (#6679)\n\nUpdates request type for `logoutPopup` to `EndSessionPopupRequest`\r\n\r\nFixes #6508",
          "timestamp": "2023-11-14T21:29:00Z",
          "tree_id": "f76ceabb0062a8b0eb20c6e646fadb8eda846ab4",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/d14178b5d9ac4aadfc15015429bde177c0bd83c7"
        },
        "date": 1699997643418,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 197093,
            "range": "±2.07%",
            "unit": "ops/sec",
            "extra": "215 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 179022,
            "range": "±2.13%",
            "unit": "ops/sec",
            "extra": "219 samples"
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
          "id": "58f167e39de7d2d9fb1d922bf6c455064bc19f46",
          "message": "Fix bug causing temporary cache not to be cleared & turn on return-await lint rule (#6678)\n\nIn some edge cases if an error is thrown during redirect response\r\nhandling temporary cache may not be cleared resulting in\r\ninteraction_in_progress errors when attempting to recover with a new\r\nredirect request. This was caused by an unawaited asynchronous call\r\ninside a synchronous try/catch which includes the cleanup logic.\r\n\r\nAlso turns on the return-await lint rule which requires any returned\r\npromises inside try/catch/finally to be awaited and disallows promises\r\nreturned outside try/catch/finally from being awaited\r\n\r\nFixes #6676",
          "timestamp": "2023-11-14T13:39:08-08:00",
          "tree_id": "4dbf72021e5195dcad8bff616d4b1d4562f3875c",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/58f167e39de7d2d9fb1d922bf6c455064bc19f46"
        },
        "date": 1699998255512,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 188990,
            "range": "±2.14%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 185011,
            "range": "±1.91%",
            "unit": "ops/sec",
            "extra": "215 samples"
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
          "id": "aa5296d3fadef68a357556c604bab2394267f185",
          "message": "Increase default iframe timout to 10s (#6700)\n\nThis PR increases the default iframe timeout to 10s",
          "timestamp": "2023-11-15T17:12:25-08:00",
          "tree_id": "4aeb84f3bfb678cec80b4fe955325acc870778e1",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/aa5296d3fadef68a357556c604bab2394267f185"
        },
        "date": 1700097454956,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 193859,
            "range": "±2.09%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 213814,
            "range": "±1.05%",
            "unit": "ops/sec",
            "extra": "215 samples"
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
          "id": "1398c679873833417c0e118e2b95cd8cf8017005",
          "message": "Make AADServerParamKeys individual exports (#6701)\n\nMoves AADServerParamKeys to separate exports under a new \"Constants\"\r\nfolder. Removes SSOTypes which was redundant.",
          "timestamp": "2023-11-17T12:41:46-08:00",
          "tree_id": "64967f22bae9004db06c9c882601d6b35c56fa0d",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/1398c679873833417c0e118e2b95cd8cf8017005"
        },
        "date": 1700254014526,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 228728,
            "range": "±1.15%",
            "unit": "ops/sec",
            "extra": "240 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187082,
            "range": "±1.93%",
            "unit": "ops/sec",
            "extra": "209 samples"
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
          "id": "70ab381446cf45f42b70f2ad3c59560783e6a627",
          "message": "Minor perf optimization when creating hidden iframe (#6705)\n\nUsing `document.body` directly is more performant than searching the\r\ndocument for body tags.\r\n\r\nCurrent P95 for hidden iframe creation is ~70ms which represents a\r\nsignificant portion of the time spent on client-side operations in\r\nssoSilent/ATS",
          "timestamp": "2023-11-17T15:46:30-08:00",
          "tree_id": "c79478c25361003b900f2bc75bc13cd45bcccc24",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/70ab381446cf45f42b70f2ad3c59560783e6a627"
        },
        "date": 1700265096768,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190549,
            "range": "±1.73%",
            "unit": "ops/sec",
            "extra": "227 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 186794,
            "range": "±2.23%",
            "unit": "ops/sec",
            "extra": "209 samples"
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
          "id": "77c626b23389f7c7044cfe69efbdf3fbd5a074e9",
          "message": "Version bump automation enhancements (#6725)\n\nThis PR:\r\n- Migrates msal-angular to us double quotes\r\n- Updates `/vscode/settings.json` to set jest `runMode` to `on-demand`\r\n\r\n---------\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2023-11-28T10:35:54-08:00",
          "tree_id": "ec71e0a24693d6d5b2c9b5f358a7756a41d0d932",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/77c626b23389f7c7044cfe69efbdf3fbd5a074e9"
        },
        "date": 1701196868181,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 192369,
            "range": "±2.02%",
            "unit": "ops/sec",
            "extra": "226 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 195722,
            "range": "±1.96%",
            "unit": "ops/sec",
            "extra": "224 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "dasau@microsoft.com",
            "name": "codexeon",
            "username": "codexeon"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "8068ac08fbccae2f9c93ea1a2d692f5d91e1f085",
          "message": "Nested App Auth is not working with Android response (#6707)\n\nAndroid API to return a response through Nested App Auth bridge is in a\r\nslightly different format than the other platforms. The payload looks\r\nlike { data: string } instead of string. The other implementations are\r\nall using a consistent format, and there is only one location in code\r\nthat we depend on bridge response format. Fix is to allow both response\r\nformats.",
          "timestamp": "2023-11-28T13:22:59-08:00",
          "tree_id": "5c5f5ceee2850083547ddaa0eb77aab6a74d327d",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/8068ac08fbccae2f9c93ea1a2d692f5d91e1f085"
        },
        "date": 1701206893399,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 199943,
            "range": "±1.46%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 182411,
            "range": "±2.17%",
            "unit": "ops/sec",
            "extra": "222 samples"
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
          "id": "d276e850b0d76c040b024f653e49f52ee2aa11ca",
          "message": "Add node 16 to node-extensions engines (#6726)\n\n- Adds node 16 to the node-extensions engines",
          "timestamp": "2023-11-28T13:46:00-08:00",
          "tree_id": "3a510e6583ed8c2d431bf5a012170afc597cabcd",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/d276e850b0d76c040b024f653e49f52ee2aa11ca"
        },
        "date": 1701208264520,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 212905,
            "range": "±1.87%",
            "unit": "ops/sec",
            "extra": "224 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 186019,
            "range": "±2.06%",
            "unit": "ops/sec",
            "extra": "222 samples"
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
          "id": "34c460d88f84263fe931d964860a30ddf4a1d981",
          "message": "React - Move rollup to dev deps (#6728)\n\nRollup and plugin-typescript were added to regular dependencies at some\r\npoint, moving back to devDependencies",
          "timestamp": "2023-11-28T14:41:38-08:00",
          "tree_id": "0293f73e9d164a8275cba21eb041edef6ebcdec4",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/34c460d88f84263fe931d964860a30ddf4a1d981"
        },
        "date": 1701211607591,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 212947,
            "range": "±1.85%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 181331,
            "range": "±1.92%",
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
          "id": "67fce83411aa71d9c493ac4a06a0b63b3ab43b1b",
          "message": "Use ADO Pipeline for CI (#6418)\n\nMigrates from Github Actions to ADO CI template defined in the 1P repo\r\n\r\n---------\r\n\r\nCo-authored-by: Hector Morales <hemoral@microsoft.com>",
          "timestamp": "2023-11-29T15:01:00-08:00",
          "tree_id": "3deb0b9c354ccb168a3a565c20d1ad3199e85782",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/67fce83411aa71d9c493ac4a06a0b63b3ab43b1b"
        },
        "date": 1701299165605,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 201801,
            "range": "±2.10%",
            "unit": "ops/sec",
            "extra": "218 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 198520,
            "range": "±1.94%",
            "unit": "ops/sec",
            "extra": "220 samples"
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
          "id": "392020bee299d01d14db2907da0cab681a3fbdc3",
          "message": "Add support for Multi-tenant accounts and cross-tenant token caching (#6536)\n\nThis PR:\r\n- Adds `tenantProfiles` map to `AccountInfo` and `tenantProfiles` array\r\n(serialization) to `AccountEntity`\r\n- Adds `realm` filtering to `getIdToken` and `getAccessToken` so cached\r\ntokens are only matched if they were issued by the tenant in the\r\nrequest's authority\r\n- Updates cached account setting logic to cache `AccountEntity` objects\r\nwith the available data of the home tenant profile in client_info\r\n(localAccountId = uid, realm = utid).\r\n- Adds logic to update the `AccountInfo` objects that `getAccount` APIs\r\nreturn to reflect the tenant-specific data (tenant profile) in the ID\r\ntoken claims from the ID token that matches the account filter passed in\r\n- Adds logic to `getAllAccounts` to expand and return all tenant\r\nprofiles that match the filter into full `AccountInfo` objects to\r\nmaintain backward compatibility\r\n- Sets access token and ID token realm values to the best available\r\nvalue from ID token claims with precedence tid > tfp > acr to cover AAD\r\nand B2C cases\r\n\r\n---------\r\n\r\nCo-authored-by: Sameera Gajjarapu <sameera.gajjarapu@microsoft.com>\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2023-11-29T15:12:43-08:00",
          "tree_id": "f95207a00d20d101a13a7475f9e01a4b191d95df",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/392020bee299d01d14db2907da0cab681a3fbdc3"
        },
        "date": 1701299861382,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 203858,
            "range": "±1.68%",
            "unit": "ops/sec",
            "extra": "218 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 206624,
            "range": "±1.33%",
            "unit": "ops/sec",
            "extra": "224 samples"
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
          "id": "d937f7dff31feeeb88ac5694536dcf1191ad7dfc",
          "message": "Post-release PR (#6740)\n\nPost-release PR\r\n\r\n---------\r\n\r\nCo-authored-by: Release Pipeline <release@msaljs.com>\r\nCo-authored-by: Hector Morales <hemoral@microsoft.com>",
          "timestamp": "2023-12-01T14:43:48-05:00",
          "tree_id": "26562f5d0c31b4073da50d26a429ce9d549af6d3",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/d937f7dff31feeeb88ac5694536dcf1191ad7dfc"
        },
        "date": 1701460177855,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 197181,
            "range": "±1.57%",
            "unit": "ops/sec",
            "extra": "227 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 212511,
            "range": "±1.54%",
            "unit": "ops/sec",
            "extra": "233 samples"
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
          "id": "8e7dbfd6198aa872fa94af9e22274a60dedc3d75",
          "message": "Bump @adobe/css-tools from 4.3.1 to 4.3.2 (#6736)\n\nBumps [@adobe/css-tools](https://github.com/adobe/css-tools) from 4.3.1\r\nto 4.3.2.\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/adobe/css-tools/blob/main/History.md\"><code>@​adobe/css-tools</code>'s\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h1>4.3.2 / 2023-11-28</h1>\r\n<ul>\r\n<li>Fix redos vulnerability with specific crafted css string -\r\nCVE-2023-48631</li>\r\n<li>Fix Problem parsing with :is() and nested :nth-child() <a\r\nhref=\"https://redirect.github.com/adobe/css-tools/issues/211\">#211</a></li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li>See full diff in <a\r\nhref=\"https://github.com/adobe/css-tools/commits\">compare view</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=@adobe/css-tools&package-manager=npm_and_yarn&previous-version=4.3.1&new-version=4.3.2)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2023-12-01T22:12:28Z",
          "tree_id": "18564bcff6af966e51b769aa44c75c4599eb84c8",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/8e7dbfd6198aa872fa94af9e22274a60dedc3d75"
        },
        "date": 1701469093140,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 215529,
            "range": "±1.33%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 193668,
            "range": "±1.84%",
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
          "id": "666dcd297c21eaa923e0f09ce4d7804b160351aa",
          "message": "Remove release pipeline files (#6723)\n\nRemove all release pipeline files and scripts once the migration to ADO\r\n+ OB is done",
          "timestamp": "2023-12-01T15:06:54-08:00",
          "tree_id": "c7d162840eb578840610c8197de8b589be8d4275",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/666dcd297c21eaa923e0f09ce4d7804b160351aa"
        },
        "date": 1701472358215,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 205316,
            "range": "±1.20%",
            "unit": "ops/sec",
            "extra": "233 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 195811,
            "range": "±1.67%",
            "unit": "ops/sec",
            "extra": "230 samples"
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
          "id": "f0d87e330dc7186a609fe65f545ffbdabdc68876",
          "message": "Fix external account loading (#6744)\n\nThis PR:\r\n- Adds environment as an optional parameter to `buildAccountToCache`\r\nutility function and passes in `authority.hostNameAndPort` as\r\nenvironment when `loadAccount` in `TokenCache` calls it.",
          "timestamp": "2023-12-04T22:57:21Z",
          "tree_id": "16f9d73cbc20ea5a0959ce6f9b46ff4b28ba212f",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/f0d87e330dc7186a609fe65f545ffbdabdc68876"
        },
        "date": 1701730991041,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 203372,
            "range": "±1.31%",
            "unit": "ops/sec",
            "extra": "235 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 210474,
            "range": "±1.02%",
            "unit": "ops/sec",
            "extra": "237 samples"
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
          "id": "fd49b33e306006b14f05a05a9d4cb53dd9d71a00",
          "message": "Node engines minimum (#6749)\n\nChanges engines fields in msal-node and msal-node-extensions to a\r\nminimum of 16 rather than choosing specific versions",
          "timestamp": "2023-12-06T09:18:33-08:00",
          "tree_id": "cdc25820b60854c3e08cbd0094ed96114180ebfe",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/fd49b33e306006b14f05a05a9d4cb53dd9d71a00"
        },
        "date": 1701883450676,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 188656,
            "range": "±1.84%",
            "unit": "ops/sec",
            "extra": "219 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187001,
            "range": "±1.88%",
            "unit": "ops/sec",
            "extra": "220 samples"
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
          "id": "4ef12a58add1bf9d62bc30b700a80b860c340adc",
          "message": "Add RT expiration check (#6703)\n\nAdds an RT expiration check when available - this is an optimization\r\nwhich avoids a wasted network call when the cached RT is expired. Only\r\napplicable to SPA apps using msal-browser",
          "timestamp": "2023-12-06T11:36:37-08:00",
          "tree_id": "61cbec2392167ee912cf98c2d0beb10604bd74ed",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/4ef12a58add1bf9d62bc30b700a80b860c340adc"
        },
        "date": 1701891751339,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 206457,
            "range": "±1.65%",
            "unit": "ops/sec",
            "extra": "225 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 207033,
            "range": "±1.40%",
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
          "id": "21afd757cd901dc1b2a0f6ce663ab05166e12067",
          "message": "Update FAQ with note about same domain requirements (#6762)\n\nFixes #6734",
          "timestamp": "2023-12-11T22:01:36Z",
          "tree_id": "34061532ee067206318555403c08ddebd38d79e7",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/21afd757cd901dc1b2a0f6ce663ab05166e12067"
        },
        "date": 1702332430375,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 174118,
            "range": "±1.63%",
            "unit": "ops/sec",
            "extra": "218 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 206429,
            "range": "±1.37%",
            "unit": "ops/sec",
            "extra": "225 samples"
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
          "id": "8c1c63df4be8e057eb3e08e0ce086570b0fd9ac0",
          "message": "Allow overriding log level and PII setting with session storage key-values (#6704)\n\nAllow overriding log level and PII setting with session storage\r\nkey-values to troubleshoot errors in non-dev environments.",
          "timestamp": "2023-12-12T09:34:54-05:00",
          "tree_id": "cc4cfaa79d7e6ee5ae483340993f4dad38c90243",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/8c1c63df4be8e057eb3e08e0ce086570b0fd9ac0"
        },
        "date": 1702392025963,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190986,
            "range": "±1.93%",
            "unit": "ops/sec",
            "extra": "217 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 196522,
            "range": "±1.90%",
            "unit": "ops/sec",
            "extra": "218 samples"
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
          "id": "162a8c1e2eaf7bc1992cb9ba11100818cf788391",
          "message": "Convert ThrottlingEntity into a type (#6754)\n\nContinues the work to convert all our cache entities from static classes\r\ninto Types & functions for perf and size",
          "timestamp": "2023-12-12T19:27:57Z",
          "tree_id": "500129f93c4f3fe1f3e00c61bfe2c88b2b87ca53",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/162a8c1e2eaf7bc1992cb9ba11100818cf788391"
        },
        "date": 1702409614918,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 221484,
            "range": "±1.37%",
            "unit": "ops/sec",
            "extra": "211 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187400,
            "range": "±1.98%",
            "unit": "ops/sec",
            "extra": "218 samples"
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
          "id": "793b5e6fd8ad3aa8bcfe8315cd8e852e0f4ee3b5",
          "message": "Handle bad_token by removing bad refresh token from cache (#6757)\n\nThis PR:\r\n- Catches `bad_token` sub error and handles it by immediately removing\r\nthe refresh token used in the refresh request, then lets the error\r\nbubble up to be handled as it is today\r\n- Adds test for this scenario\r\n\r\n---------\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2023-12-12T14:28:50-08:00",
          "tree_id": "c9f5d32433d3c4ec342b89936140cfb5ff91eda3",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/793b5e6fd8ad3aa8bcfe8315cd8e852e0f4ee3b5"
        },
        "date": 1702420465209,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 183667,
            "range": "±1.75%",
            "unit": "ops/sec",
            "extra": "226 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 183363,
            "range": "±2.09%",
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
          "id": "462e8768041263510096f31f826be31db1563fe7",
          "message": "Fix token refresh with relative redirectUri (#6761)\n\nIn 3.2.0 we added redirectUri to the /token request in order to support\r\nbroker scenarios. This caused a regression when refreshing tokens with\r\nrelative URLs. This PR addresses this issue.\r\n\r\nFixes #6733",
          "timestamp": "2023-12-13T14:04:36-08:00",
          "tree_id": "5015afa98d65cc67c4ad49771e2e5523bda74c3e",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/462e8768041263510096f31f826be31db1563fe7"
        },
        "date": 1702505426355,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 201555,
            "range": "±1.28%",
            "unit": "ops/sec",
            "extra": "230 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 172720,
            "range": "±1.97%",
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
          "id": "c2dfe4ed005d7ec87d0eded9449935d17e811f65",
          "message": "Reduce unnecessary cache lookups (#6753)\n\nWhen looking up tokens in the cache we:\r\n1. Get and parse: idToken, accessToken, refreshToken, account and\r\nappMetadata\r\n2. Evaluate the accessToken and if not found or expired throw\r\n3. Catch error and lookup the refreshToken again and attempt to exchange\r\nit over the network\r\n\r\nThere's 2 ways to improve this pattern, both addressed in this PR:\r\n1. Don't retrieve the refresh token until it's actually needed (if and\r\nwhen the accessToken needs to be refreshed)\r\n2. Don't retrieve idToken, account and appMetadata until they're needed\r\n(accessToken lookup was successful)\r\n\r\nThis saves 1 cache lookup on all calls and an additional 3 cache lookups\r\non calls that fail to return an access token from the cache",
          "timestamp": "2023-12-14T10:53:58-08:00",
          "tree_id": "a9a03f997b46b3cfe7ab97888e62e38fa04a513a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/c2dfe4ed005d7ec87d0eded9449935d17e811f65"
        },
        "date": 1702580375787,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 196801,
            "range": "±1.71%",
            "unit": "ops/sec",
            "extra": "228 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 183389,
            "range": "±1.71%",
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
          "id": "4aacf4d835e64ad4340639c7f7b5b41c137f7ce6",
          "message": "Dynamically load `BrowserPerformanceMeasurement` to capture browser perf measurements if session storage flag is set (#6748)\n\n- Dynamically load `BrowserPerformanceMeasurement` to capture browser\r\nperf measurements if session storage flag is set.\r\n- Calculate telemetry event duration using Unix epoch if browser\r\nperformance API is not available.\r\n- Update browser performance doc.",
          "timestamp": "2023-12-14T14:21:13-05:00",
          "tree_id": "f64e2efe36a66872544e5259f315217594342202",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/4aacf4d835e64ad4340639c7f7b5b41c137f7ce6"
        },
        "date": 1702582008643,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 185521,
            "range": "±2.00%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 182599,
            "range": "±2.04%",
            "unit": "ops/sec",
            "extra": "221 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "dasau@microsoft.com",
            "name": "Dan Saunders",
            "username": "codexeon"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "648501e4d9c65cb39322f97a9e09c5f93e1135b7",
          "message": "Update Nested App Auth internal schema (#6737)\n\nCurrently Nested App Auth uses a schema that contains union types such\r\nas response.body where the body can contain a different structure\r\ndepending on the request type. This works in JavaScript that uses a\r\ndynamic JSON parser, but some native implementations require a strongly\r\ntyped schema. There are workarounds on native, but it is easier for all\r\nplatforms to support Nested App Auth if union types are removed from the\r\nschema.\r\n\r\nAlso remove AccountByHomeIdRequest, AccountByLocalIdRequest, and\r\nAccountByUsernameRequest that are not currently implemented.",
          "timestamp": "2023-12-16T00:04:58-08:00",
          "tree_id": "4ecf19226170fbb86cd9acfceebc689983f6674d",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/648501e4d9c65cb39322f97a9e09c5f93e1135b7"
        },
        "date": 1702714230612,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 186436,
            "range": "±1.81%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 186927,
            "range": "±2.02%",
            "unit": "ops/sec",
            "extra": "222 samples"
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
          "id": "19811d7a92abe9bd6846b6418f51fa800aae9fc8",
          "message": "Bump actions/upload-artifact from 3 to 4 (#6778)\n\nBumps\r\n[actions/upload-artifact](https://github.com/actions/upload-artifact)\r\nfrom 3 to 4.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/actions/upload-artifact/releases\">actions/upload-artifact's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>v4.0.0</h2>\r\n<h2>What's Changed</h2>\r\n<p>The release of upload-artifact@v4 and download-artifact@v4 are major\r\nchanges to the backend architecture of Artifacts. They have numerous\r\nperformance and behavioral improvements.</p>\r\n<p>For more information, see the <a\r\nhref=\"https://github.com/actions/toolkit/tree/main/packages/artifact\"><code>@​actions/artifact</code></a>\r\ndocumentation.</p>\r\n<h2>New Contributors</h2>\r\n<ul>\r\n<li><a href=\"https://github.com/vmjoseph\"><code>@​vmjoseph</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/actions/upload-artifact/pull/464\">actions/upload-artifact#464</a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/actions/upload-artifact/compare/v3...v4.0.0\">https://github.com/actions/upload-artifact/compare/v3...v4.0.0</a></p>\r\n<h2>v3.1.3</h2>\r\n<h2>What's Changed</h2>\r\n<ul>\r\n<li>chore(github): remove trailing whitespaces by <a\r\nhref=\"https://github.com/ljmf00\"><code>@​ljmf00</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/upload-artifact/pull/313\">actions/upload-artifact#313</a></li>\r\n<li>Bump <code>@​actions/artifact</code> version to v1.1.2 by <a\r\nhref=\"https://github.com/bethanyj28\"><code>@​bethanyj28</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/upload-artifact/pull/436\">actions/upload-artifact#436</a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/actions/upload-artifact/compare/v3...v3.1.3\">https://github.com/actions/upload-artifact/compare/v3...v3.1.3</a></p>\r\n<h2>v3.1.2</h2>\r\n<ul>\r\n<li>Update all <code>@actions/*</code> NPM packages to their latest\r\nversions- <a\r\nhref=\"https://redirect.github.com/actions/upload-artifact/issues/374\">#374</a></li>\r\n<li>Update all dev dependencies to their most recent versions - <a\r\nhref=\"https://redirect.github.com/actions/upload-artifact/issues/375\">#375</a></li>\r\n</ul>\r\n<h2>v3.1.1</h2>\r\n<ul>\r\n<li>Update actions/core package to latest version to remove\r\n<code>set-output</code> deprecation warning <a\r\nhref=\"https://redirect.github.com/actions/upload-artifact/issues/351\">#351</a></li>\r\n</ul>\r\n<h2>v3.1.0</h2>\r\n<h2>What's Changed</h2>\r\n<ul>\r\n<li>Bump <code>@​actions/artifact</code> to v1.1.0 (<a\r\nhref=\"https://redirect.github.com/actions/upload-artifact/pull/327\">actions/upload-artifact#327</a>)\r\n<ul>\r\n<li>Adds checksum headers on artifact upload (<a\r\nhref=\"https://redirect.github.com/actions/toolkit/pull/1095\">actions/toolkit#1095</a>)\r\n(<a\r\nhref=\"https://redirect.github.com/actions/toolkit/pull/1063\">actions/toolkit#1063</a>)</li>\r\n</ul>\r\n</li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/actions/upload-artifact/commit/c7d193f32edcb7bfad88892161225aeda64e9392\"><code>c7d193f</code></a>\r\nMerge pull request <a\r\nhref=\"https://redirect.github.com/actions/upload-artifact/issues/466\">#466</a>\r\nfrom actions/v4-beta</li>\r\n<li><a\r\nhref=\"https://github.com/actions/upload-artifact/commit/13131bb095770b4070a7477c3cd2d96e1c16d9f4\"><code>13131bb</code></a>\r\nlicensed cache</li>\r\n<li><a\r\nhref=\"https://github.com/actions/upload-artifact/commit/4a6c273b9834f66a1d05c170dc3f80f9cdb9def1\"><code>4a6c273</code></a>\r\nMerge branch 'main' into v4-beta</li>\r\n<li><a\r\nhref=\"https://github.com/actions/upload-artifact/commit/f391bb91a3d3118aeca171c365bb319ece276b37\"><code>f391bb9</code></a>\r\nMerge pull request <a\r\nhref=\"https://redirect.github.com/actions/upload-artifact/issues/465\">#465</a>\r\nfrom actions/robherley/v4-documentation</li>\r\n<li><a\r\nhref=\"https://github.com/actions/upload-artifact/commit/9653d03c4b74c32144e02dae644fea70e079d4b3\"><code>9653d03</code></a>\r\nApply suggestions from code review</li>\r\n<li><a\r\nhref=\"https://github.com/actions/upload-artifact/commit/875b63076402f25ef9d52c294c86ba4f97810575\"><code>875b630</code></a>\r\nadd limitations section</li>\r\n<li><a\r\nhref=\"https://github.com/actions/upload-artifact/commit/ecb21463e93740a6be75c3116242169bfdbcb15a\"><code>ecb2146</code></a>\r\nadd compression example</li>\r\n<li><a\r\nhref=\"https://github.com/actions/upload-artifact/commit/5e7604f84a055838f64ed68bb9904751523081ae\"><code>5e7604f</code></a>\r\ntrim some repeated info</li>\r\n<li><a\r\nhref=\"https://github.com/actions/upload-artifact/commit/d6437d07581fe318a364512e6cf6b1dca6b4f92c\"><code>d6437d0</code></a>\r\nnaming</li>\r\n<li><a\r\nhref=\"https://github.com/actions/upload-artifact/commit/1b561557037b4957d7d184e9aac02bec86c771eb\"><code>1b56155</code></a>\r\ns/v4-beta/v4/g</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/actions/upload-artifact/compare/v3...v4\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=actions/upload-artifact&package-manager=github_actions&previous-version=3&new-version=4)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\n\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-01-02T10:56:28-08:00",
          "tree_id": "f9ab5cb3fb7622d9e5a6638e78430981dca1a841",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/19811d7a92abe9bd6846b6418f51fa800aae9fc8"
        },
        "date": 1704222128516,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 188657,
            "range": "±2.15%",
            "unit": "ops/sec",
            "extra": "218 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 192505,
            "range": "±2.03%",
            "unit": "ops/sec",
            "extra": "230 samples"
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
          "id": "2c5e457711f5b9ea037ba889bf4f58a31a60ae09",
          "message": "AuthorityMetadataEntity refactor into Type (#6802)\n\nContinues the work to convert cache entities from Classes into Types for\r\nsize/perf gains",
          "timestamp": "2024-01-08T11:08:22-08:00",
          "tree_id": "7254d74c6715751449df182c217b8a592258ac90",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/2c5e457711f5b9ea037ba889bf4f58a31a60ae09"
        },
        "date": 1704741242580,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 178373,
            "range": "±1.75%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 173187,
            "range": "±1.68%",
            "unit": "ops/sec",
            "extra": "218 samples"
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
          "id": "4789406b295c6c9ea21c7a99845b0fbe1d27b997",
          "message": "AppMetadataEntity refactor into Type (#6807)\n\nContinues the work to refactor cache Entity classes into Types for perf\r\nand size gains.",
          "timestamp": "2024-01-08T13:50:09-08:00",
          "tree_id": "d8959859883a19d5edc19c33730ae55dc15931dc",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/4789406b295c6c9ea21c7a99845b0fbe1d27b997"
        },
        "date": 1704750941835,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 181502,
            "range": "±1.83%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 185126,
            "range": "±1.90%",
            "unit": "ops/sec",
            "extra": "220 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "release@msaljs.com",
            "name": "MSAL.js Release Automation"
          },
          "committer": {
            "email": "release@msaljs.com",
            "name": "MSAL.js Release Automation"
          },
          "distinct": true,
          "id": "3d2f8c800af4e07d889026a1f69afd5f7c214bac",
          "message": "Bump package versions",
          "timestamp": "2024-01-09T00:03:25Z",
          "tree_id": "241da67228f980afa7a1c32b0c6dd17009282af6",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/3d2f8c800af4e07d889026a1f69afd5f7c214bac"
        },
        "date": 1704758954016,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 185066,
            "range": "±2.01%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 184008,
            "range": "±1.99%",
            "unit": "ops/sec",
            "extra": "219 samples"
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
          "id": "603098e62124b90c13dcd6e57a7d83d95cc07ce8",
          "message": "Fix default sample static file paths (#6786)",
          "timestamp": "2024-01-09T15:37:23-08:00",
          "tree_id": "cb1d11ab2471cb02ae4369e3a3cc53dca4d94e11",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/603098e62124b90c13dcd6e57a7d83d95cc07ce8"
        },
        "date": 1704843783934,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 180854,
            "range": "±1.93%",
            "unit": "ops/sec",
            "extra": "219 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 180676,
            "range": "±1.77%",
            "unit": "ops/sec",
            "extra": "220 samples"
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
          "id": "0ec61d8419092c117bbe4792bf9df1c2e624a799",
          "message": "Bump follow-redirects from 1.15.2 to 1.15.5 (#6826)\n\nBumps\r\n[follow-redirects](https://github.com/follow-redirects/follow-redirects)\r\nfrom 1.15.2 to 1.15.5.\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/follow-redirects/follow-redirects/commit/b1677ce00110ee50dc5da576751d39b281fc4944\"><code>b1677ce</code></a>\r\nRelease version 1.15.5 of the npm package.</li>\r\n<li><a\r\nhref=\"https://github.com/follow-redirects/follow-redirects/commit/d8914f7982403ea096b39bd594a00ee9d3b7e224\"><code>d8914f7</code></a>\r\nPreserve fragment in responseUrl.</li>\r\n<li><a\r\nhref=\"https://github.com/follow-redirects/follow-redirects/commit/65858205e59f1e23c9bf173348a7a7cbb8ac47f5\"><code>6585820</code></a>\r\nRelease version 1.15.4 of the npm package.</li>\r\n<li><a\r\nhref=\"https://github.com/follow-redirects/follow-redirects/commit/7a6567e16dfa9ad18a70bfe91784c28653fbf19d\"><code>7a6567e</code></a>\r\nDisallow bracketed hostnames.</li>\r\n<li><a\r\nhref=\"https://github.com/follow-redirects/follow-redirects/commit/05629af696588b90d64e738bc2e809a97a5f92fc\"><code>05629af</code></a>\r\nPrefer native URL instead of deprecated url.parse.</li>\r\n<li><a\r\nhref=\"https://github.com/follow-redirects/follow-redirects/commit/1cba8e85fa73f563a439fe460cf028688e4358df\"><code>1cba8e8</code></a>\r\nPrefer native URL instead of legacy url.resolve.</li>\r\n<li><a\r\nhref=\"https://github.com/follow-redirects/follow-redirects/commit/72bc2a4229bc18dc9fbd57c60579713e6264cb92\"><code>72bc2a4</code></a>\r\nSimplify _processResponse error handling.</li>\r\n<li><a\r\nhref=\"https://github.com/follow-redirects/follow-redirects/commit/3d42aecdca39b144a0a2f27ea134b4cf67dd796a\"><code>3d42aec</code></a>\r\nAdd bracket tests.</li>\r\n<li><a\r\nhref=\"https://github.com/follow-redirects/follow-redirects/commit/bcbb096b32686ecad6cd34235358ed6f2217d4f0\"><code>bcbb096</code></a>\r\nDo not directly set Error properties.</li>\r\n<li><a\r\nhref=\"https://github.com/follow-redirects/follow-redirects/commit/192dbe7ce671ecad813c074bffe3b3f5d3680fee\"><code>192dbe7</code></a>\r\nRelease version 1.15.3 of the npm package.</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/follow-redirects/follow-redirects/compare/v1.15.2...v1.15.5\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=follow-redirects&package-manager=npm_and_yarn&previous-version=1.15.2&new-version=1.15.5)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-01-17T11:27:07-08:00",
          "tree_id": "d999221e228c2a1a7b1c59ae98956e44231a7eb5",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/0ec61d8419092c117bbe4792bf9df1c2e624a799"
        },
        "date": 1705519973118,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190467,
            "range": "±1.70%",
            "unit": "ops/sec",
            "extra": "230 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 180410,
            "range": "±1.82%",
            "unit": "ops/sec",
            "extra": "220 samples"
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
          "id": "e9df7ce5dfa690aef838d6ba59d91c788c7f87d2",
          "message": "Support state parameter on silent requests (#6819)\n\nAdds support for `state` parameter on silent requests",
          "timestamp": "2024-01-17T19:36:37Z",
          "tree_id": "8c8207c24bd9cac9f1aa164f822924c25c57e673",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/e9df7ce5dfa690aef838d6ba59d91c788c7f87d2"
        },
        "date": 1705520545162,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 179080,
            "range": "±1.93%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 177231,
            "range": "±1.72%",
            "unit": "ops/sec",
            "extra": "218 samples"
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
          "id": "2014e7898f57532b7585a64279bc35cb698847dd",
          "message": "Update ssoSilent docs with troubleshooting information (#6818)\n\nThis PR:\r\n- Adds a warning about content security policies and HTTP headers that\r\nmay interfere with ssoSilent in the login docs\r\n- Adds a troubleshooting section to the ssoSilent FAQ",
          "timestamp": "2024-01-17T19:46:59Z",
          "tree_id": "476d63196d9ba2d457e3d31369922c806e918a89",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/2014e7898f57532b7585a64279bc35cb698847dd"
        },
        "date": 1705521163034,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 175917,
            "range": "±1.80%",
            "unit": "ops/sec",
            "extra": "216 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 180494,
            "range": "±1.93%",
            "unit": "ops/sec",
            "extra": "220 samples"
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
          "id": "7035deaaa499ead2c8e1d1d34fa138004cd49531",
          "message": "Fix bug affecting metadata resolution for tenanted authorities (#6814)\n\nOur hardcoded endpoint metadata is stored in a map keyed on full\r\nauthority urls including the common tenants (common, organizations,\r\nconsumers). This results in authority urls with specific tenants to fail\r\nthe hardcoded lookup and go to the network for metadata which is taking\r\n~700ms at P95.\r\n\r\nThis PR does the following:\r\n- Updates the hardcoded metadata map to key off domain only\r\n(consequently reducing the total number of entries)\r\n- Removes extraneous fields that are not being used\r\n- Adds telemetry data point indicating where we got the metadata from\r\n(hardcoded, config, network, cache)\r\n- Removes unnecessary `createInstance` function",
          "timestamp": "2024-01-17T19:58:06Z",
          "tree_id": "1b45c155abefadb014da831d2f87af57bb612459",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/7035deaaa499ead2c8e1d1d34fa138004cd49531"
        },
        "date": 1705521824887,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 182602,
            "range": "±1.97%",
            "unit": "ops/sec",
            "extra": "227 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 197741,
            "range": "±1.70%",
            "unit": "ops/sec",
            "extra": "217 samples"
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
          "id": "e6b89ba6da08052a4ad045c9b4e8620ba604c3d5",
          "message": "Bump msgpackr from 1.9.7 to 1.10.1 (#6792)\n\nBumps [msgpackr](https://github.com/kriszyp/msgpackr) from 1.9.7 to\r\n1.10.1.\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/kriszyp/msgpackr/commit/50bcdb8e312b45d9fcbd911c961d5ad31ef24019\"><code>50bcdb8</code></a>\r\nUpdate version</li>\r\n<li><a\r\nhref=\"https://github.com/kriszyp/msgpackr/commit/4e7657bca114ddf24696f943ace648c96783aa7c\"><code>4e7657b</code></a>\r\nAllow structuredClone to be explicitly turned off for the decoder</li>\r\n<li><a\r\nhref=\"https://github.com/kriszyp/msgpackr/commit/18f44f8800e2261341cdf489d1ba1e35a0133602\"><code>18f44f8</code></a>\r\nEnsure that string conversion doesn't recursively join or execute\r\ncode</li>\r\n<li><a\r\nhref=\"https://github.com/kriszyp/msgpackr/commit/cc6a0f17c2e439f9f194768e33ae8280e3a73fd7\"><code>cc6a0f1</code></a>\r\nUpdate version</li>\r\n<li><a\r\nhref=\"https://github.com/kriszyp/msgpackr/commit/cc8e177d9d7c386512d64aab46bf9b4568fc28d8\"><code>cc8e177</code></a>\r\nDocument useBigIntExtension</li>\r\n<li><a\r\nhref=\"https://github.com/kriszyp/msgpackr/commit/0310e2fedbeb783bd3692b5b12e7036f3de7dfb8\"><code>0310e2f</code></a>\r\nDefer other value types to msgpackr</li>\r\n<li><a\r\nhref=\"https://github.com/kriszyp/msgpackr/commit/6978440105975d71e5ef11257488e1e35eafbb5f\"><code>6978440</code></a>\r\nAdd support for BigInts larger than 64-bit</li>\r\n<li><a\r\nhref=\"https://github.com/kriszyp/msgpackr/commit/0e960cb06675a6884cbcff097f4de66777bb71c8\"><code>0e960cb</code></a>\r\nDon't suppress encoding errors when shared structures are saved</li>\r\n<li><a\r\nhref=\"https://github.com/kriszyp/msgpackr/commit/6b010f54a59824c0270774e4171ae88a402c0838\"><code>6b010f5</code></a>\r\nMaintain correct encode options on repacking</li>\r\n<li><a\r\nhref=\"https://github.com/kriszyp/msgpackr/commit/4b011432f55c8b72135b250f86c9fe85c63c27da\"><code>4b01143</code></a>\r\nAllow struct restarts to properly use start position</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/kriszyp/msgpackr/compare/v1.9.7...v1.10.1\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=msgpackr&package-manager=npm_and_yarn&previous-version=1.9.7&new-version=1.10.1)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-01-17T20:11:26Z",
          "tree_id": "7cf36a48dce2177a34beea1b0a022d36dabb3121",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/e6b89ba6da08052a4ad045c9b4e8620ba604c3d5"
        },
        "date": 1705522615744,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 183128,
            "range": "±1.92%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 193845,
            "range": "±1.78%",
            "unit": "ops/sec",
            "extra": "213 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "dzu@energinet.dk",
            "name": "Dzhavat Ushev",
            "username": "dzhavat"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "35ecaa5775e45955c04d70a38815671534f1fabf",
          "message": "Format Errors related documentation (#6720)\n\nNoticed a few minor issues with the `errors.md` file and decided to open\r\na PR.\r\n\r\nThe changes include:\r\n- remove link to `native_broker_called_before_initialize` error. Didn't\r\nfind anything in the repo related to this error\r\n- add link to `uninitialized_public_client_application` section\r\n- fix link to `Access to fetch at ...` section\r\n- format file (remove extra spaces, use small letters in links, etc.)\r\n\r\nCo-authored-by: Hector Morales <hemoral@microsoft.com>\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-01-17T13:14:28-08:00",
          "tree_id": "2fea88f01e3a28229ed5cf8b2b54a7d8326b73df",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/35ecaa5775e45955c04d70a38815671534f1fabf"
        },
        "date": 1705526405976,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 189998,
            "range": "±2.19%",
            "unit": "ops/sec",
            "extra": "219 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 201013,
            "range": "±1.33%",
            "unit": "ops/sec",
            "extra": "221 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "96488933+Rablet@users.noreply.github.com",
            "name": "Robin",
            "username": "Rablet"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "c0a59a93d82d22a7cf142ed1b3dbabfd43aa4c5d",
          "message": "Fix cachePlugin.js not resolving when cache file doesn't exist (#6713)\n\ncachePlugin.js is used for caching in the msal-node-samples. \r\n\r\nIf the cache file does not currently exist it crates the file, however\r\nin that scenario it currently never resolves the promise so calling\r\nsomething like acquireTokenByCode will not return on the first\r\ninvocation. Calling acquireTokenByCode again will return as in that case\r\nthe cache file has been created and the promise will be resolved\r\n\r\nThis PR fixes this by resolving the promise once the file has been\r\ncreated.\r\n\r\nSigned-off-by: Robin <hi@rablet.dev>\r\nCo-authored-by: Hector Morales <hemoral@microsoft.com>\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-01-17T13:14:47-08:00",
          "tree_id": "858ccc63e7d1231dccdfd0d218bafc5e6d4c40fb",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/c0a59a93d82d22a7cf142ed1b3dbabfd43aa4c5d"
        },
        "date": 1705526431420,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 183355,
            "range": "±1.92%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 202079,
            "range": "±2.06%",
            "unit": "ops/sec",
            "extra": "220 samples"
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
          "id": "2d4d0b2cde8e072ba6c64aea9b251984b2dd4021",
          "message": "Update issue templates (#6475)\n\nThis PR:\r\n- Removes question issue template\r\n- Adds disclaimers about bug issues without logs or network traces\r\ngetting deleted without comment\r\n- Adds a link to a network trace collection guide and a warning about\r\nproperly scrubbing network traces.\r\n\r\n---------\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>\r\nCo-authored-by: Emily Lauber <emilylauber@microsoft.com>",
          "timestamp": "2024-01-18T15:31:58-08:00",
          "tree_id": "3e8f701fcb42364a2677cf71bb2313f56e99bddf",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/2d4d0b2cde8e072ba6c64aea9b251984b2dd4021"
        },
        "date": 1705621064491,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 179257,
            "range": "±1.83%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 179755,
            "range": "±1.86%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "54b4253e3848dc985529c77036bab8d692309bf5",
          "message": "Bump vite from 3.2.7 to 3.2.8 (#6832)\n\nBumps [vite](https://github.com/vitejs/vite/tree/HEAD/packages/vite)\r\nfrom 3.2.7 to 3.2.8.\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/vitejs/vite/blob/v3.2.8/packages/vite/CHANGELOG.md\">vite's\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h2><!-- raw HTML omitted -->3.2.8 (2024-01-19)<!-- raw HTML omitted\r\n--></h2>\r\n<ul>\r\n<li>fix: fs deny for case insensitive (<a\r\nhref=\"https://github.com/vitejs/vite/commit/a26c87d\">a26c87d</a>)</li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/vitejs/vite/commit/7e3a86638e1585702e7fb8eaf8ede43740a6a44e\"><code>7e3a866</code></a>\r\nrelease: v3.2.8</li>\r\n<li><a\r\nhref=\"https://github.com/vitejs/vite/commit/a26c87d20f9af306b5ce3ff1648be7fa5146c278\"><code>a26c87d</code></a>\r\nfix: fs deny for case insensitive</li>\r\n<li>See full diff in <a\r\nhref=\"https://github.com/vitejs/vite/commits/v3.2.8/packages/vite\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=vite&package-manager=npm_and_yarn&previous-version=3.2.7&new-version=3.2.8)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-01-20T14:27:49-08:00",
          "tree_id": "c882e83c8167a62a14b0430604e8f3d300f884c6",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/54b4253e3848dc985529c77036bab8d692309bf5"
        },
        "date": 1705789995383,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 189365,
            "range": "±1.87%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 189452,
            "range": "±1.65%",
            "unit": "ops/sec",
            "extra": "224 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "altinok.darici@gmail.com",
            "name": "Altinok Darici",
            "username": "altinokdarici"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "688e3c1f5657ce8f6c3d0d7c62a80ee954fbe12b",
          "message": "Fix: Require is not defined in MJS (#6831)\n\nCurrently, I'm getting the below error when I use msal-node-extension\r\npackage in an ES module.\r\n\r\n```\r\nReferenceError: require is not defined in ES module scope, you can use import instead\r\nThis file is being treated as an ES module because it has a '.js' file extension and 'D:\\git\\my-repo\\node_modules\\my-package\\package.json' contains \"type\": \"module\". To treat it as a CommonJS script, rename it to use the '.cjs' file extension.\r\n    at file:///D:/git/my-repo/node_modules/@azure/msal-node-extensions/dist/Dpapi.mjs:20:5\r\n    at ModuleJob.run (node:internal/modules/esm/module_job:194:25)\r\n ```\r\n\r\nTo fix this issue, I'm creating the `require` when it's not defined. So that this code is safe to run in both msj and cjs\r\n\r\n---------\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-01-22T10:09:52-08:00",
          "tree_id": "309f8c6c691f686df1b7e8e3e8fffbc9b5b8f04a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/688e3c1f5657ce8f6c3d0d7c62a80ee954fbe12b"
        },
        "date": 1705947310404,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 189843,
            "range": "±1.96%",
            "unit": "ops/sec",
            "extra": "196 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 179511,
            "range": "±1.83%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "cf10eccbb55087167321c2461fdb2b21c505f0a4",
          "message": "Bump actions/cache from 3 to 4 (#6835)\n\nBumps [actions/cache](https://github.com/actions/cache) from 3 to 4.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/actions/cache/releases\">actions/cache's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>v4.0.0</h2>\r\n<h2>What's Changed</h2>\r\n<ul>\r\n<li>Update action to node20 by <a\r\nhref=\"https://github.com/takost\"><code>@​takost</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1284\">actions/cache#1284</a></li>\r\n<li>feat: save-always flag by <a\r\nhref=\"https://github.com/to-s\"><code>@​to-s</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1242\">actions/cache#1242</a></li>\r\n</ul>\r\n<h2>New Contributors</h2>\r\n<ul>\r\n<li><a href=\"https://github.com/takost\"><code>@​takost</code></a> made\r\ntheir first contribution in <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1284\">actions/cache#1284</a></li>\r\n<li><a href=\"https://github.com/to-s\"><code>@​to-s</code></a> made their\r\nfirst contribution in <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1242\">actions/cache#1242</a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/actions/cache/compare/v3...v4.0.0\">https://github.com/actions/cache/compare/v3...v4.0.0</a></p>\r\n<h2>v3.3.3</h2>\r\n<h2>What's Changed</h2>\r\n<ul>\r\n<li>Cache v3.3.3 by <a\r\nhref=\"https://github.com/robherley\"><code>@​robherley</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1302\">actions/cache#1302</a></li>\r\n</ul>\r\n<h2>New Contributors</h2>\r\n<ul>\r\n<li><a href=\"https://github.com/robherley\"><code>@​robherley</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1302\">actions/cache#1302</a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/actions/cache/compare/v3...v3.3.3\">https://github.com/actions/cache/compare/v3...v3.3.3</a></p>\r\n<h2>v3.3.2</h2>\r\n<h2>What's Changed</h2>\r\n<ul>\r\n<li>Fixed readme with new segment timeout values by <a\r\nhref=\"https://github.com/kotewar\"><code>@​kotewar</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1133\">actions/cache#1133</a></li>\r\n<li>Readme fixes by <a\r\nhref=\"https://github.com/kotewar\"><code>@​kotewar</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1134\">actions/cache#1134</a></li>\r\n<li>Updated description of the lookup-only input for main action by <a\r\nhref=\"https://github.com/kotewar\"><code>@​kotewar</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1130\">actions/cache#1130</a></li>\r\n<li>Change two new actions mention as quoted text by <a\r\nhref=\"https://github.com/bishal-pdMSFT\"><code>@​bishal-pdMSFT</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1131\">actions/cache#1131</a></li>\r\n<li>Update Cross-OS Caching tips by <a\r\nhref=\"https://github.com/pdotl\"><code>@​pdotl</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1122\">actions/cache#1122</a></li>\r\n<li>Bazel example (Take <a\r\nhref=\"https://redirect.github.com/actions/cache/issues/2\">#2</a>️⃣) by\r\n<a href=\"https://github.com/vorburger\"><code>@​vorburger</code></a> in\r\n<a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1132\">actions/cache#1132</a></li>\r\n<li>Remove actions to add new PRs and issues to a project board by <a\r\nhref=\"https://github.com/jorendorff\"><code>@​jorendorff</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1187\">actions/cache#1187</a></li>\r\n<li>Consume latest toolkit and fix dangling promise bug by <a\r\nhref=\"https://github.com/chkimes\"><code>@​chkimes</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1217\">actions/cache#1217</a></li>\r\n<li>Bump action version to 3.3.2 by <a\r\nhref=\"https://github.com/bethanyj28\"><code>@​bethanyj28</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1236\">actions/cache#1236</a></li>\r\n</ul>\r\n<h2>New Contributors</h2>\r\n<ul>\r\n<li><a href=\"https://github.com/vorburger\"><code>@​vorburger</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1132\">actions/cache#1132</a></li>\r\n<li><a\r\nhref=\"https://github.com/jorendorff\"><code>@​jorendorff</code></a> made\r\ntheir first contribution in <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1187\">actions/cache#1187</a></li>\r\n<li><a href=\"https://github.com/chkimes\"><code>@​chkimes</code></a> made\r\ntheir first contribution in <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1217\">actions/cache#1217</a></li>\r\n<li><a\r\nhref=\"https://github.com/bethanyj28\"><code>@​bethanyj28</code></a> made\r\ntheir first contribution in <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1236\">actions/cache#1236</a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/actions/cache/compare/v3...v3.3.2\">https://github.com/actions/cache/compare/v3...v3.3.2</a></p>\r\n<h2>v3.3.1</h2>\r\n<h2>What's Changed</h2>\r\n<ul>\r\n<li>Reduced download segment size to 128 MB and timeout to 10 minutes by\r\n<a href=\"https://github.com/kotewar\"><code>@​kotewar</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1129\">actions/cache#1129</a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/actions/cache/compare/v3...v3.3.1\">https://github.com/actions/cache/compare/v3...v3.3.1</a></p>\r\n<h2>v3.3.0</h2>\r\n<h2>What's Changed</h2>\r\n<ul>\r\n<li>Bug: Permission is missing in cache delete example by <a\r\nhref=\"https://github.com/kotokaze\"><code>@​kotokaze</code></a> in <a\r\nhref=\"https://redirect.github.com/actions/cache/pull/1123\">actions/cache#1123</a></li>\r\n</ul>\r\n<!-- raw HTML omitted -->\r\n</blockquote>\r\n<p>... (truncated)</p>\r\n</details>\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/actions/cache/blob/main/RELEASES.md\">actions/cache's\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h1>Releases</h1>\r\n<h3>3.0.0</h3>\r\n<ul>\r\n<li>Updated minimum runner version support from node 12 -&gt; node\r\n16</li>\r\n</ul>\r\n<h3>3.0.1</h3>\r\n<ul>\r\n<li>Added support for caching from GHES 3.5.</li>\r\n<li>Fixed download issue for files &gt; 2GB during restore.</li>\r\n</ul>\r\n<h3>3.0.2</h3>\r\n<ul>\r\n<li>Added support for dynamic cache size cap on GHES.</li>\r\n</ul>\r\n<h3>3.0.3</h3>\r\n<ul>\r\n<li>Fixed avoiding empty cache save when no files are available for\r\ncaching. (<a\r\nhref=\"https://redirect.github.com/actions/cache/issues/624\">issue</a>)</li>\r\n</ul>\r\n<h3>3.0.4</h3>\r\n<ul>\r\n<li>Fixed tar creation error while trying to create tar with path as\r\n<code>~/</code> home folder on <code>ubuntu-latest</code>. (<a\r\nhref=\"https://redirect.github.com/actions/cache/issues/689\">issue</a>)</li>\r\n</ul>\r\n<h3>3.0.5</h3>\r\n<ul>\r\n<li>Removed error handling by consuming actions/cache 3.0 toolkit, Now\r\ncache server error handling will be done by toolkit. (<a\r\nhref=\"https://redirect.github.com/actions/cache/pull/834\">PR</a>)</li>\r\n</ul>\r\n<h3>3.0.6</h3>\r\n<ul>\r\n<li>Fixed <a\r\nhref=\"https://redirect.github.com/actions/cache/issues/809\">#809</a> -\r\nzstd -d: no such file or directory error</li>\r\n<li>Fixed <a\r\nhref=\"https://redirect.github.com/actions/cache/issues/833\">#833</a> -\r\ncache doesn't work with github workspace directory</li>\r\n</ul>\r\n<h3>3.0.7</h3>\r\n<ul>\r\n<li>Fixed <a\r\nhref=\"https://redirect.github.com/actions/cache/issues/810\">#810</a> -\r\ndownload stuck issue. A new timeout is introduced in the download\r\nprocess to abort the download if it gets stuck and doesn't finish within\r\nan hour.</li>\r\n</ul>\r\n<h3>3.0.8</h3>\r\n<ul>\r\n<li>Fix zstd not working for windows on gnu tar in issues <a\r\nhref=\"https://redirect.github.com/actions/cache/issues/888\">#888</a> and\r\n<a\r\nhref=\"https://redirect.github.com/actions/cache/issues/891\">#891</a>.</li>\r\n<li>Allowing users to provide a custom timeout as input for aborting\r\ndownload of a cache segment using an environment variable\r\n<code>SEGMENT_DOWNLOAD_TIMEOUT_MINS</code>. Default is 60 minutes.</li>\r\n</ul>\r\n<h3>3.0.9</h3>\r\n<ul>\r\n<li>Enhanced the warning message for cache unavailablity in case of\r\nGHES.</li>\r\n</ul>\r\n<h3>3.0.10</h3>\r\n<ul>\r\n<li>Fix a bug with sorting inputs.</li>\r\n<li>Update definition for restore-keys in README.md</li>\r\n</ul>\r\n<!-- raw HTML omitted -->\r\n</blockquote>\r\n<p>... (truncated)</p>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/actions/cache/commit/13aacd865c20de90d75de3b17ebe84f7a17d57d2\"><code>13aacd8</code></a>\r\nMerge pull request <a\r\nhref=\"https://redirect.github.com/actions/cache/issues/1242\">#1242</a>\r\nfrom to-s/main</li>\r\n<li><a\r\nhref=\"https://github.com/actions/cache/commit/53b35c543921fe2e8b288765ff817de9de8d906f\"><code>53b35c5</code></a>\r\nMerge branch 'main' into main</li>\r\n<li><a\r\nhref=\"https://github.com/actions/cache/commit/65b8989fab3bb394817bdb845a453dff480c2b51\"><code>65b8989</code></a>\r\nMerge pull request <a\r\nhref=\"https://redirect.github.com/actions/cache/issues/1284\">#1284</a>\r\nfrom takost/update-to-node-20</li>\r\n<li><a\r\nhref=\"https://github.com/actions/cache/commit/d0be34d54485f31ca2ccbe66e6ea3d96544a807b\"><code>d0be34d</code></a>\r\nFix dist</li>\r\n<li><a\r\nhref=\"https://github.com/actions/cache/commit/66cf064d47313d2cccf392d01bd10925da2bd072\"><code>66cf064</code></a>\r\nMerge branch 'main' into update-to-node-20</li>\r\n<li><a\r\nhref=\"https://github.com/actions/cache/commit/1326563738ddb735c5f2ce85cba8c79f33b728cd\"><code>1326563</code></a>\r\nMerge branch 'main' into main</li>\r\n<li><a\r\nhref=\"https://github.com/actions/cache/commit/e71876755e268d6cc25a5d3e3c46ae447e35290a\"><code>e718767</code></a>\r\nFix format</li>\r\n<li><a\r\nhref=\"https://github.com/actions/cache/commit/01229828ffa049a8dee4db27bcb23ed33f2b451f\"><code>0122982</code></a>\r\nApply workaround for earlyExit</li>\r\n<li><a\r\nhref=\"https://github.com/actions/cache/commit/3185ecfd6135856ca6d904ae032cff4f39b8b365\"><code>3185ecf</code></a>\r\nUpdate &quot;only-&quot; actions to node20</li>\r\n<li><a\r\nhref=\"https://github.com/actions/cache/commit/25618a0a675e8447e5ffc8ed9b7ddb2aaf927f65\"><code>25618a0</code></a>\r\nBump version</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/actions/cache/compare/v3...v4\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=actions/cache&package-manager=github_actions&previous-version=3&new-version=4)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\n\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-01-22T10:34:05-08:00",
          "tree_id": "6829848fd293bc3aaf4eace92d1f9995a97cfa70",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/cf10eccbb55087167321c2461fdb2b21c505f0a4"
        },
        "date": 1705948785213,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 183742,
            "range": "±1.98%",
            "unit": "ops/sec",
            "extra": "217 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 185344,
            "range": "±1.61%",
            "unit": "ops/sec",
            "extra": "226 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "18417334+benborra@users.noreply.github.com",
            "name": "benborra",
            "username": "benborra"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "2c5e4f1c72835d4dc47a72d158094af89964b9b0",
          "message": "Read me MSAL Angular: Update github issues link. (#6834)\n\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-01-22T11:56:14-08:00",
          "tree_id": "b29b8fe6ee39a902a6a6a93fc494983b71fef434",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/2c5e4f1c72835d4dc47a72d158094af89964b9b0"
        },
        "date": 1705953710359,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 182209,
            "range": "±1.78%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 176595,
            "range": "±1.60%",
            "unit": "ops/sec",
            "extra": "219 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "release@msaljs.com",
            "name": "MSAL.js Release Automation"
          },
          "committer": {
            "email": "release@msaljs.com",
            "name": "MSAL.js Release Automation"
          },
          "distinct": true,
          "id": "2df9045fe3e9a2450c21f0024088697ec616802a",
          "message": "Bump package versions",
          "timestamp": "2024-01-23T00:06:05Z",
          "tree_id": "52597531158f0606964f6f48ad234ab82767d5a2",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/2df9045fe3e9a2450c21f0024088697ec616802a"
        },
        "date": 1705968714343,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 215125,
            "range": "±1.47%",
            "unit": "ops/sec",
            "extra": "235 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 178089,
            "range": "±1.78%",
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
          "id": "77c4f3d40c71621b03c65e9504ad153f14d7659c",
          "message": "Fix node-extensions tests (#6849)\n\nJest only has experimental support for ESM and is failing when parsing\r\n`import.meta` (ESM only) as it's assuming CJS. This PR mocks\r\n`import.meta` as suggested\r\n[here](https://github.com/kulshekhar/ts-jest/issues/3888#issuecomment-1722524078)\r\nto address for the time being. If/when jest/ts-jest address this on\r\ntheir end we can remove this.",
          "timestamp": "2024-01-25T21:54:16Z",
          "tree_id": "c9d4f7efcd0f5402b8c328361497b16caa915cb1",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/77c4f3d40c71621b03c65e9504ad153f14d7659c"
        },
        "date": 1706219990501,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 186416,
            "range": "±2.01%",
            "unit": "ops/sec",
            "extra": "218 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 182277,
            "range": "±1.97%",
            "unit": "ops/sec",
            "extra": "218 samples"
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
          "id": "813bda7f0529189645231ff394c4e1afdc68edb8",
          "message": "Reduce calls to resolveEndpointsAsync (#6838)\n\nWe are building an `Authority` object and parsing/validating endpoint\r\nmetadata at least twice in a single request - once to validate it\r\nmatches the account object passed in and again to build the final\r\nrequest object. This PR refactors to do both these steps at the same\r\ntime using a single `Authority` object. Additionally, telemetry is added\r\nto track the number of times an API is invoked over the course of a\r\nrequest to identify redundancies easier.",
          "timestamp": "2024-01-25T22:07:11Z",
          "tree_id": "58863de5f38649f65c7c20c4ce6f88bbeb187ff4",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/813bda7f0529189645231ff394c4e1afdc68edb8"
        },
        "date": 1706220758854,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 182038,
            "range": "±1.75%",
            "unit": "ops/sec",
            "extra": "219 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 180440,
            "range": "±1.65%",
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
          "id": "71d9e45ad28410a0e2f9e5d02aef05338a5331f1",
          "message": "Optimize `TimeUtils` for smaller bundle size (#6837)\n\nOptimize `TimeUtils` for smaller bundle size.",
          "timestamp": "2024-01-25T19:10:41-05:00",
          "tree_id": "bdc6c7c75308554984a3c90c42ad4d17b060e603",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/71d9e45ad28410a0e2f9e5d02aef05338a5331f1"
        },
        "date": 1706228178186,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 180680,
            "range": "±1.92%",
            "unit": "ops/sec",
            "extra": "218 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187164,
            "range": "±2.04%",
            "unit": "ops/sec",
            "extra": "218 samples"
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
          "id": "90e235f0b3cbef71e4de1b32947bf11ffb02ea6d",
          "message": "Make BrowserCrypto generate UUID v7 by default (#6841)\n\n- Make BrowserCrypto generate UUID v7 by default.",
          "timestamp": "2024-01-26T10:12:07-05:00",
          "tree_id": "f494055368bdd996bf3b55f6edb86fd7ad4e586e",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/90e235f0b3cbef71e4de1b32947bf11ffb02ea6d"
        },
        "date": 1706282255026,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 203651,
            "range": "±2.01%",
            "unit": "ops/sec",
            "extra": "211 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 181482,
            "range": "±1.69%",
            "unit": "ops/sec",
            "extra": "221 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "36167099+bbush915@users.noreply.github.com",
            "name": "bbush915",
            "username": "bbush915"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e491e8f576deec812d930bd91c7f58660f9a0fee",
          "message": "Fix: Cached AccessToken missing realm property in OIDC scenario (#6689)\n\nIn the case an application is using a separate OIDC-compliant authority\r\nand the tid claim is empty, the cached access token does not contain a\r\nrealm property. One side-effect is that the cached access token will\r\nfail the isAccessTokenEntity check, preventing it from being re-used.\r\n\r\n---------\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>\r\nCo-authored-by: Sameera Gajjarapu <sameera.gajjarapu@microsoft.com>",
          "timestamp": "2024-01-29T09:03:03-08:00",
          "tree_id": "d03ecd1b3e60a7af6eedcaaecb3bbe66d0990cfc",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/e491e8f576deec812d930bd91c7f58660f9a0fee"
        },
        "date": 1706548119715,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 196253,
            "range": "±1.78%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 203412,
            "range": "±1.33%",
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
          "id": "8ba7a00c197ac1b83e5420ee560a4e2ba9bef919",
          "message": "Bump dorny/paths-filter from 2 to 3 (#6856)\n\nBumps [dorny/paths-filter](https://github.com/dorny/paths-filter) from 2\r\nto 3.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/dorny/paths-filter/releases\">dorny/paths-filter's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>v3.0.0</h2>\r\n<h2>What's Changed</h2>\r\n<ul>\r\n<li>Update README.md: added real world usage example by <a\r\nhref=\"https://github.com/iamtodor\"><code>@​iamtodor</code></a> in <a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/178\">dorny/paths-filter#178</a></li>\r\n<li>Update Node.js to version 20 by <a\r\nhref=\"https://github.com/danielhjacobs\"><code>@​danielhjacobs</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/206\">dorny/paths-filter#206</a></li>\r\n<li>Update to nodejs 20 by <a\r\nhref=\"https://github.com/dorny\"><code>@​dorny</code></a> in <a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/210\">dorny/paths-filter#210</a></li>\r\n<li>chore(deps): bump checkout action to v4 and use setup-node to setup\r\nnode and cache npm deps by <a\r\nhref=\"https://github.com/chenrui333\"><code>@​chenrui333</code></a> in <a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/211\">dorny/paths-filter#211</a></li>\r\n<li>Update all dependencies by <a\r\nhref=\"https://github.com/dorny\"><code>@​dorny</code></a> in <a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/215\">dorny/paths-filter#215</a></li>\r\n</ul>\r\n<h2>New Contributors</h2>\r\n<ul>\r\n<li><a href=\"https://github.com/iamtodor\"><code>@​iamtodor</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/178\">dorny/paths-filter#178</a></li>\r\n<li><a\r\nhref=\"https://github.com/danielhjacobs\"><code>@​danielhjacobs</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/206\">dorny/paths-filter#206</a></li>\r\n<li><a\r\nhref=\"https://github.com/chenrui333\"><code>@​chenrui333</code></a> made\r\ntheir first contribution in <a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/211\">dorny/paths-filter#211</a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/dorny/paths-filter/compare/v2.11.1...v3.0.0\">https://github.com/dorny/paths-filter/compare/v2.11.1...v3.0.0</a></p>\r\n<h2>v2.11.1</h2>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/167\">Update\r\n<code>@​actions/core</code> to v1.10.0 - Fixes warning about deprecated\r\nset-output</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/168\">Document\r\nneed for pull-requests: read permission</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/164\">Updating\r\nto actions/checkout@v3</a></li>\r\n</ul>\r\n<h2>v2.11.0</h2>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/157\">Set\r\nlist-files input parameter as not required</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/161\">Update\r\nNode.js</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/162\">Fix\r\nincorrect handling of Unicode characters in exec()</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/163\">Use\r\nOctokit pagination</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/160\">Updates\r\nreal world links</a></li>\r\n</ul>\r\n<h2>v2.10.2</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/dorny/paths-filter/pull/91\">Fix\r\ngetLocalRef() returns wrong ref</a></li>\r\n</ul>\r\n<h2>v2.10.1</h2>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/85\">Improve\r\nrobustness of change detection</a></li>\r\n</ul>\r\n<h2>v2.10.0</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/dorny/paths-filter/pull/82\">Add\r\nref input parameter</a></li>\r\n<li><a href=\"https://redirect.github.com/dorny/paths-filter/pull/83\">Fix\r\nchange detection in PR when <code>pullRequest.changed_files</code> is\r\nincorrect</a></li>\r\n</ul>\r\n<h2>v2.9.3</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/dorny/paths-filter/pull/78\">Fix\r\nchange detection when base is a tag</a></li>\r\n</ul>\r\n<h2>v2.9.2</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/dorny/paths-filter/pull/75\">Fix\r\nfetching git history</a></li>\r\n</ul>\r\n<h2>v2.9.1</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/dorny/paths-filter/pull/74\">Fix\r\nfetching git history + fallback to unshallow repo</a></li>\r\n</ul>\r\n<h2>v2.9.0</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/dorny/paths-filter/pull/68\">Add\r\nlist-files: csv format</a></li>\r\n</ul>\r\n<h2>v2.8.0</h2>\r\n<!-- raw HTML omitted -->\r\n</blockquote>\r\n<p>... (truncated)</p>\r\n</details>\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/dorny/paths-filter/blob/master/CHANGELOG.md\">dorny/paths-filter's\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h1>Changelog</h1>\r\n<h2>v3.0.0</h2>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/210\">Update to\r\nNode.js 20 </a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/215\">Update\r\nall dependencies</a></li>\r\n</ul>\r\n<h2>v2.11.1</h2>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/167\">Update\r\n<code>@​actions/core</code> to v1.10.0 - Fixes warning about deprecated\r\nset-output</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/168\">Document\r\nneed for pull-requests: read permission</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/164\">Updating\r\nto actions/checkout@v3</a></li>\r\n</ul>\r\n<h2>v2.11.0</h2>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/157\">Set\r\nlist-files input parameter as not required</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/161\">Update\r\nNode.js</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/162\">Fix\r\nincorrect handling of Unicode characters in exec()</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/163\">Use\r\nOctokit pagination</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/160\">Updates\r\nreal world links</a></li>\r\n</ul>\r\n<h2>v2.10.2</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/dorny/paths-filter/pull/91\">Fix\r\ngetLocalRef() returns wrong ref</a></li>\r\n</ul>\r\n<h2>v2.10.1</h2>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/85\">Improve\r\nrobustness of change detection</a></li>\r\n</ul>\r\n<h2>v2.10.0</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/dorny/paths-filter/pull/82\">Add\r\nref input parameter</a></li>\r\n<li><a href=\"https://redirect.github.com/dorny/paths-filter/pull/83\">Fix\r\nchange detection in PR when pullRequest.changed_files is\r\nincorrect</a></li>\r\n</ul>\r\n<h2>v2.9.3</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/dorny/paths-filter/pull/78\">Fix\r\nchange detection when base is a tag</a></li>\r\n</ul>\r\n<h2>v2.9.2</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/dorny/paths-filter/pull/75\">Fix\r\nfetching git history</a></li>\r\n</ul>\r\n<h2>v2.9.1</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/dorny/paths-filter/pull/74\">Fix\r\nfetching git history + fallback to unshallow repo</a></li>\r\n</ul>\r\n<h2>v2.9.0</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/dorny/paths-filter/pull/68\">Add\r\nlist-files: csv format</a></li>\r\n</ul>\r\n<h2>v2.8.0</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/dorny/paths-filter/pull/65\">Add\r\ncount output variable</a></li>\r\n<li><a href=\"https://redirect.github.com/dorny/paths-filter/pull/61\">Fix\r\nlog grouping of changes</a></li>\r\n</ul>\r\n<h2>v2.7.0</h2>\r\n<ul>\r\n<li><a href=\"https://redirect.github.com/dorny/paths-filter/pull/59\">Add\r\n&quot;changes&quot; output variable to support matrix job\r\nconfiguration</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/58\">Improved\r\nlisting of matching files with <code>list-files: shell</code> and\r\n<code>list-files: escape</code> options</a></li>\r\n</ul>\r\n<h2>v2.6.0</h2>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/pull/53\">Support\r\nlocal changes</a></li>\r\n</ul>\r\n<!-- raw HTML omitted -->\r\n</blockquote>\r\n<p>... (truncated)</p>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/dorny/paths-filter/commit/0bc4621a3135347011ad047f9ecf449bf72ce2bd\"><code>0bc4621</code></a>\r\nBump major version to v3</li>\r\n<li><a\r\nhref=\"https://github.com/dorny/paths-filter/commit/7267a8516b6f92bdb098633497bad573efdbf271\"><code>7267a85</code></a>\r\nUpdate CHANGELOG for v2.12.0</li>\r\n<li><a\r\nhref=\"https://github.com/dorny/paths-filter/commit/e36f1124bf7d4849984518d6d3c52cceead221f4\"><code>e36f112</code></a>\r\nMerge pull request <a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/issues/215\">#215</a>\r\nfrom dorny/update-dependencies</li>\r\n<li><a\r\nhref=\"https://github.com/dorny/paths-filter/commit/2f74457227764299eb71f72c23ec2dd68b68d509\"><code>2f74457</code></a>\r\nUpdate all dependencies</li>\r\n<li><a\r\nhref=\"https://github.com/dorny/paths-filter/commit/67617953b4001d04fd3ced8df881d9ba1d08da9c\"><code>6761795</code></a>\r\nUpdate examples in README to use checkout@v4</li>\r\n<li><a\r\nhref=\"https://github.com/dorny/paths-filter/commit/a35d8d6a333efe86eeb5d0c5d4a7a2622cc3e8cf\"><code>a35d8d6</code></a>\r\nMerge pull request <a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/issues/211\">#211</a>\r\nfrom chenrui333/node-20</li>\r\n<li><a\r\nhref=\"https://github.com/dorny/paths-filter/commit/b5a5203f8b3312399faee023c83cf5e5dcaecae4\"><code>b5a5203</code></a>\r\nchore(deps): bump checkout action to v4 and use setup-node to setup node\r\nand ...</li>\r\n<li><a\r\nhref=\"https://github.com/dorny/paths-filter/commit/3c49e64ca26115121162fb767bc6af9e8d059f1a\"><code>3c49e64</code></a>\r\nMerge pull request <a\r\nhref=\"https://redirect.github.com/dorny/paths-filter/issues/210\">#210</a>\r\nfrom dorny/use-nodejs-20</li>\r\n<li><a\r\nhref=\"https://github.com/dorny/paths-filter/commit/8ec7be473424d724f09d3c51b7962ae5f2ffcbab\"><code>8ec7be4</code></a>\r\nUpdate to nodejs 20</li>\r\n<li><a\r\nhref=\"https://github.com/dorny/paths-filter/commit/100a1198b209450115509c0565d407ac269190dc\"><code>100a119</code></a>\r\nRevert back to node16</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/dorny/paths-filter/compare/v2...v3\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=dorny/paths-filter&package-manager=github_actions&previous-version=2&new-version=3)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\n\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-01-29T09:03:59-08:00",
          "tree_id": "d59d7c9d6d2a39cd1948552a29140894181b472e",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/8ba7a00c197ac1b83e5420ee560a4e2ba9bef919"
        },
        "date": 1706548169458,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 178842,
            "range": "±1.70%",
            "unit": "ops/sec",
            "extra": "218 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 190860,
            "range": "±1.81%",
            "unit": "ops/sec",
            "extra": "220 samples"
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
          "id": "8412655feba7b30748e2eeca875d2c7940c69e0e",
          "message": "Fix failing response handler test because of missing correlation ID (#6857)\n\nAdds missing correlation ID to authority initializer in ResponseHandler\r\nspec",
          "timestamp": "2024-01-29T11:04:49-08:00",
          "tree_id": "d12d8856c63b6609af273eafe73a54515a337417",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/8412655feba7b30748e2eeca875d2c7940c69e0e"
        },
        "date": 1706555417482,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 183749,
            "range": "±1.90%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 184702,
            "range": "±1.83%",
            "unit": "ops/sec",
            "extra": "217 samples"
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
          "id": "687fe33fcc6944be84bb8d499d5a122b8bbea68c",
          "message": "Update shared config version references to use local files (#6855)\n\nThis PR:\r\n- Replaces version numbers with local file paths for\r\n`eslint-config-msal` and `msal-test-utils` local packages",
          "timestamp": "2024-01-29T11:58:18-08:00",
          "tree_id": "7f6939f829049c46ccfcc6aaf686de15489733fa",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/687fe33fcc6944be84bb8d499d5a122b8bbea68c"
        },
        "date": 1706558674769,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 178731,
            "range": "±1.85%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 167607,
            "range": "±2.42%",
            "unit": "ops/sec",
            "extra": "220 samples"
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
          "id": "400dc4d2da88b95b6b78baa8895ce91a03150517",
          "message": "Add active account update event (#6854)\n\nThis PR:\r\n- Adds a new cross-tab account storage event called\r\n`ACTIVE_ACCOUNT_CHANGED` to `EventHandler` API\r\n- Adds logic to emit the `ACTIVE_ACCOUNT_CHANGED` event when the\r\n`active-account-filters` cache entry is modified in a new tab\r\n- Adds docs for event usage\r\n- Adds tests",
          "timestamp": "2024-01-30T13:11:41-08:00",
          "tree_id": "62c8c30c2db8cc1c385964ee09d7fa68c0041dad",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/400dc4d2da88b95b6b78baa8895ce91a03150517"
        },
        "date": 1706649449621,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 183255,
            "range": "±1.83%",
            "unit": "ops/sec",
            "extra": "218 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 193609,
            "range": "±2.10%",
            "unit": "ops/sec",
            "extra": "237 samples"
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
          "id": "4d4516ab8a8be188ad680c73d241cba51d75f2f8",
          "message": "Instrument handleRedirectPromise() (#6861)\n\nInstrument handleRedirectPromise().",
          "timestamp": "2024-01-31T13:58:01-05:00",
          "tree_id": "3e62b5433b23f4efec8a48b9e727d5d0d10f05f8",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/4d4516ab8a8be188ad680c73d241cba51d75f2f8"
        },
        "date": 1706727831731,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 205154,
            "range": "±1.48%",
            "unit": "ops/sec",
            "extra": "235 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 209069,
            "range": "±1.09%",
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
          "id": "e7a55511680aec602310f63db0bb5b7d2b07fab3",
          "message": "Fix electron webpack samples (#6864)\n\nThe electron webpack samples' transforms weren't updated when we changed\r\nto .cjs extensions which breaks native module imports (node extensions).\r\nThis PR addresses by adding .cjs to the list of files to transform",
          "timestamp": "2024-02-01T14:40:23-08:00",
          "tree_id": "f52a9b6647fc2a3d908aae83ec2062eff9175110",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/e7a55511680aec602310f63db0bb5b7d2b07fab3"
        },
        "date": 1706827553448,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 185913,
            "range": "±1.92%",
            "unit": "ops/sec",
            "extra": "231 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 177897,
            "range": "±1.80%",
            "unit": "ops/sec",
            "extra": "220 samples"
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
          "id": "e7e24e1b5d712c48d6ddc1374eacd7e7599bc18b",
          "message": "Add optional dependencies to react workflow (#6879)\n\n- Installs optional dependencies on msal-react-e2e workflow since\r\nthey're missing because of an npm bug that ignores optional dependencies",
          "timestamp": "2024-02-06T21:32:35Z",
          "tree_id": "810d4ea508f452d07534962a29ee091d331f8ab6",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/e7e24e1b5d712c48d6ddc1374eacd7e7599bc18b"
        },
        "date": 1707255483503,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190436,
            "range": "±1.92%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 178398,
            "range": "±1.57%",
            "unit": "ops/sec",
            "extra": "219 samples"
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
          "id": "bed223d7398e9cfb9cd0c981797d2a05865ed55c",
          "message": "Bump browser (#6882)\n\nBumping msal-browser manually so release pipeline bumps it to 3.9.0 and\r\nit skips 3.8.0 which was unpublished in msal-browser-1p",
          "timestamp": "2024-02-06T14:11:46-08:00",
          "tree_id": "a108522eec4f6ee9ad736c7f394770ac24c16eb7",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/bed223d7398e9cfb9cd0c981797d2a05865ed55c"
        },
        "date": 1707257834560,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 181597,
            "range": "±1.76%",
            "unit": "ops/sec",
            "extra": "219 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 190141,
            "range": "±2.05%",
            "unit": "ops/sec",
            "extra": "219 samples"
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
          "id": "d33c817d7501f8509413d78c3df2ea04355972a5",
          "message": "Enable 1st party and pre-release publishing in Release Pipeline (#6865)\n\nThis PR:\r\n- Adds `beachball:bump:alpha` and `beachball:bump: beta` scripts to root\r\npackage.json to support pre-publish package bumping in automation\r\n\r\n---------\r\n\r\nCo-authored-by: MSAL.js Release Automation <release@msaljs.com>",
          "timestamp": "2024-02-06T15:07:20-08:00",
          "tree_id": "3526ae07ad6acd5def90b73b4e85d00523034a00",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/d33c817d7501f8509413d78c3df2ea04355972a5"
        },
        "date": 1707261165875,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 198856,
            "range": "±1.98%",
            "unit": "ops/sec",
            "extra": "219 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 185385,
            "range": "±1.96%",
            "unit": "ops/sec",
            "extra": "222 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "msaljsbuilds@microsoft.com",
            "name": "MSAL.js Release Automation"
          },
          "committer": {
            "email": "msaljsbuilds@microsoft.com",
            "name": "MSAL.js Release Automation"
          },
          "distinct": true,
          "id": "298b2127d122b40febdbdb95f4df8a34521e54fa",
          "message": "Bump package versions",
          "timestamp": "2024-02-07T22:00:42Z",
          "tree_id": "b314a166fb85e89cee54317d6521a8bf5c7e1370",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/298b2127d122b40febdbdb95f4df8a34521e54fa"
        },
        "date": 1707343563594,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 192666,
            "range": "±2.02%",
            "unit": "ops/sec",
            "extra": "213 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 184406,
            "range": "±1.77%",
            "unit": "ops/sec",
            "extra": "220 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "98491992+DidunAyodeji@users.noreply.github.com",
            "name": "DidunAyodeji",
            "username": "DidunAyodeji"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "d51b97d822e3b687f9397ccf241b77505f6a0cff",
          "message": "Microsoft Entra ID rebrand (#6750)\n\nThis is the attempt to fix all the issues found in the first\r\n[PR.](https://github.com/AzureAD/microsoft-authentication-library-for-js/pull/6747)\r\nI have run an updated script based on the feedback I got and now those\r\nissues present in the 1st PR I made have been fixed.\r\n\r\nUpdating all Azure AD terms to the Microsoft Entra ID terms in all md\r\nfiles.\r\n\r\n## Does this introduce a breaking change?\r\n```\r\n[ ] Yes\r\n[x ] No\r\n```\r\n\r\n## Pull Request Type\r\nWhat kind of change does this Pull Request introduce?\r\n```\r\n[ ] Bugfix\r\n[ ] Feature\r\n[ ] Code style update (formatting, local variables)\r\n[ ] Refactoring (no functional changes, no api changes)\r\n[x] Documentation content changes\r\n[ ] Other... Please describe:\r\n```\r\n\r\n## What to Check\r\nThe updated changes to Microsoft Entra ID terminology make sense.\r\n\r\n## Other Information\r\nHere's a link to the Rebrand guidelines. Note that the script doesn't\r\nhave all the entries in the glossary that mine has. Let me know if you'd\r\nlike to see my version of the script.\r\nhttps://review.learn.microsoft.com/en-us/entra/fundamentals/how-to-rename-azure-ad?branch=main\r\n\r\n---------\r\n\r\nCo-authored-by: Hector Morales <hemoral@microsoft.com>",
          "timestamp": "2024-02-08T14:24:38-05:00",
          "tree_id": "ca44df22104aab1d1bd9acf949de8bcc04e2c545",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/d51b97d822e3b687f9397ccf241b77505f6a0cff"
        },
        "date": 1707420616235,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 208677,
            "range": "±1.45%",
            "unit": "ops/sec",
            "extra": "237 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 179111,
            "range": "±1.98%",
            "unit": "ops/sec",
            "extra": "220 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "lalima.sharda@gmail.com",
            "name": "Lalima Sharda",
            "username": "lalimasharda"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "c6b5f3d474cdad9b88b415b4ec552d945d9b6062",
          "message": "MSAL JS should not throw user account switch error when home account ids of the request/response match (#6846)\n\nThis PR fixes 2 issues:\r\n- When the parent app is requesting tokens on behalf of an iframed\r\napplication, it should check request/response based on the native\r\naccount id as well as the homeAccountId.\r\n- When the tokens are brokered, the parent's native account id should\r\nnot be cached in the iframed application. The iframed application should\r\nonly store it's own native account id.\r\n\r\n---------\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-02-12T20:58:28-08:00",
          "tree_id": "2daf19be09441dbf302457ea7f86870b6562d67a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/c6b5f3d474cdad9b88b415b4ec552d945d9b6062"
        },
        "date": 1707800638530,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 191457,
            "range": "±1.94%",
            "unit": "ops/sec",
            "extra": "219 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 184117,
            "range": "±2.00%",
            "unit": "ops/sec",
            "extra": "220 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "36167099+bbush915@users.noreply.github.com",
            "name": "bbush915",
            "username": "bbush915"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "d055ad8cb91961dbc0639861c618f11900485853",
          "message": "Fix: Authority string tenant parsing throws error in certain OIDC scenario (#6889)\n\nThe authority string tenant parsing assumes that the authority URL will\r\nalways have at least one PathSegment. This is not true in the case an\r\napplication is using a separate OIDC-compliant authority. This handles\r\nthis case gracefully, ultimately allowing the cached token to be reused.\r\n\r\n---------\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-02-13T10:11:24-08:00",
          "tree_id": "2168f616931c13163d099074cf7a7345d363f06f",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/d055ad8cb91961dbc0639861c618f11900485853"
        },
        "date": 1707848222739,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 184573,
            "range": "±1.86%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 185639,
            "range": "±1.90%",
            "unit": "ops/sec",
            "extra": "219 samples"
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
          "id": "bbf17fbef9d7b7b8e3e15e41acbe4d3391bfb6e1",
          "message": "Fix MSA e2e tests (#6896)\n\nThis PR:\r\n- Replaces sign-in button ID with #kmsiTitle ID for KMSI page in MSA\r\nflows",
          "timestamp": "2024-02-14T15:22:42-08:00",
          "tree_id": "cf8b82c24660477096201302ad38d45688089bcb",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/bbf17fbef9d7b7b8e3e15e41acbe4d3391bfb6e1"
        },
        "date": 1707953287402,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 186594,
            "range": "±1.83%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 179656,
            "range": "±1.61%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "db17cd032f59811bb9fd8b99f1dce453c225fcd8",
          "message": "Remove invalid prompt for silent request instead of throwing an error (#6895)\n\n- Remove invalid prompt for silent request instead of throwing an error.",
          "timestamp": "2024-02-14T19:46:51-05:00",
          "tree_id": "d147ddfffb48ebc98027eb922091cc3a5b34f3f2",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/db17cd032f59811bb9fd8b99f1dce453c225fcd8"
        },
        "date": 1707958380233,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 182518,
            "range": "±1.86%",
            "unit": "ops/sec",
            "extra": "218 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 175839,
            "range": "±1.77%",
            "unit": "ops/sec",
            "extra": "219 samples"
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
          "id": "9dc37a091a26f78dfeba1006e2a739f49d6e3011",
          "message": "Use UUIDv7 in PerformanceClient (#6866)\n\n- Use UUIDv7 in PerformanceClient.",
          "timestamp": "2024-02-14T20:54:54-05:00",
          "tree_id": "ec544e42a74e59cee3ebf283f8b4d353a372f9e8",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/9dc37a091a26f78dfeba1006e2a739f49d6e3011"
        },
        "date": 1707962429426,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 183565,
            "range": "±1.79%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 181584,
            "range": "±1.91%",
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
          "id": "df5a228eed4bf2922b41a7fd69bbfc5775d9a5fc",
          "message": "Export `createGuid` function (#6868)\n\nExport `createGuid` function.",
          "timestamp": "2024-02-14T21:04:48-05:00",
          "tree_id": "7fcffedaf95dc7948598d3dd33aa370543148ea7",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/df5a228eed4bf2922b41a7fd69bbfc5775d9a5fc"
        },
        "date": 1707963016665,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 187169,
            "range": "±2.01%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 183429,
            "range": "±1.96%",
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
          "id": "e4c23168adbb1007da281cfa3b1ed997dbb92657",
          "message": "Add ID Token secret to AccountInfo in all reponses (#6903)\n\nThis PR:\r\n- Adds the ID token to the account info object updated from tenant\r\nprofiles\r\n- Fixes #6900",
          "timestamp": "2024-02-16T14:47:17-08:00",
          "tree_id": "4172f1ea2ad7ef5d69906a98515012e2f57b67d1",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/e4c23168adbb1007da281cfa3b1ed997dbb92657"
        },
        "date": 1708123968765,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 182933,
            "range": "±1.64%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 183946,
            "range": "±1.73%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "ee8478695b89e8dc5590d9e4832051bae2684d8a",
          "message": "Remove bumpDeps false from beachball:bump:ci command (#6905)\n\nThis PR:\r\n- Removes bumpDeps false from package.json so dependent packages get\r\nbumped correctly",
          "timestamp": "2024-02-16T15:43:03-08:00",
          "tree_id": "fcb72ed7d6724b1346943a4858fc80a00938cd15",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/ee8478695b89e8dc5590d9e4832051bae2684d8a"
        },
        "date": 1708127318874,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 183652,
            "range": "±1.81%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 196916,
            "range": "±2.16%",
            "unit": "ops/sec",
            "extra": "218 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "msaljsbuilds@microsoft.com",
            "name": "MSAL.js Release Automation"
          },
          "committer": {
            "email": "msaljsbuilds@microsoft.com",
            "name": "MSAL.js Release Automation"
          },
          "distinct": true,
          "id": "8c015976765555ebf63b236373058ca0c333e7c7",
          "message": "Bump package versions",
          "timestamp": "2024-02-17T01:49:12Z",
          "tree_id": "535d39f1daa32e032ee0a5d4a431aada09ca6b7c",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/8c015976765555ebf63b236373058ca0c333e7c7"
        },
        "date": 1708134885035,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 187022,
            "range": "±2.00%",
            "unit": "ops/sec",
            "extra": "219 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 180502,
            "range": "±1.68%",
            "unit": "ops/sec",
            "extra": "219 samples"
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
          "id": "835d4c3d979c14df91175956e4c18020b6a61a9b",
          "message": "Append default scopes for the cache lookup (#6909)\n\nAppend default scopes for the cache lookup.",
          "timestamp": "2024-02-20T14:59:30-05:00",
          "tree_id": "ee38074a8a0c9e9f6a9da930c9de72ac5bc493ed",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/835d4c3d979c14df91175956e4c18020b6a61a9b"
        },
        "date": 1708459507255,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 198080,
            "range": "±2.08%",
            "unit": "ops/sec",
            "extra": "226 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 181526,
            "range": "±1.75%",
            "unit": "ops/sec",
            "extra": "220 samples"
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
          "id": "6546f4669b7d16a312eef40b6bde798e45d25056",
          "message": "Pre-release validation (#6894)\n\nThis PR:\r\n- Adds jest-junit test reporter to E2E test samples to help visualize\r\ntest results on the release pipeline\r\n- Adds missing dependencies to Angular samples",
          "timestamp": "2024-02-21T13:37:41-08:00",
          "tree_id": "3f4aee6626e766d57ed22af19247fef1620cb560",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/6546f4669b7d16a312eef40b6bde798e45d25056"
        },
        "date": 1708551797005,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 192543,
            "range": "±2.13%",
            "unit": "ops/sec",
            "extra": "217 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 181053,
            "range": "±1.92%",
            "unit": "ops/sec",
            "extra": "222 samples"
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
          "id": "6342e3c0687dedd560abb89c87bd7037973e99c3",
          "message": "Bump ip from 1.1.8 to 1.1.9 (#6910)\n\nBumps [ip](https://github.com/indutny/node-ip) from 1.1.8 to 1.1.9.\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/indutny/node-ip/commit/1ecbf2fd8c0cc85e44c3b587d2de641f50dc0217\"><code>1ecbf2f</code></a>\r\n1.1.9</li>\r\n<li><a\r\nhref=\"https://github.com/indutny/node-ip/commit/6a3ada9b471b09d5f0f5be264911ab564bf67894\"><code>6a3ada9</code></a>\r\nlib: fixed CVE-2023-42282 and added unit test</li>\r\n<li>See full diff in <a\r\nhref=\"https://github.com/indutny/node-ip/compare/v1.1.8...v1.1.9\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=ip&package-manager=npm_and_yarn&previous-version=1.1.8&new-version=1.1.9)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-02-22T11:45:43-08:00",
          "tree_id": "6f0ed7e4fa2a142390d3e5549a0f5fff1dc14a7a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/6342e3c0687dedd560abb89c87bd7037973e99c3"
        },
        "date": 1708631474241,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 183231,
            "range": "±1.71%",
            "unit": "ops/sec",
            "extra": "218 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 181729,
            "range": "±1.77%",
            "unit": "ops/sec",
            "extra": "222 samples"
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
          "id": "d946a36497db5afa2393f5686e07472b65980b43",
          "message": "Minor cache cleanup (#6917)\n\nIncremental step towards more cache changes, including:\r\n\r\n- Remove unused functions\r\n- Separates `getKeys` function for Persistent and Temporary items to\r\nonly return keys from the relevant location for what we're trying to do\r\n- Separates `removeItem` function for Persistent and Temporary items to\r\ndo only the work relevant to the item being removed",
          "timestamp": "2024-02-26T10:35:38-08:00",
          "tree_id": "0c1225ed4d0047f024c225d60d3027b5572f35fe",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/d946a36497db5afa2393f5686e07472b65980b43"
        },
        "date": 1708973886234,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 196242,
            "range": "±2.20%",
            "unit": "ops/sec",
            "extra": "218 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 176646,
            "range": "±1.84%",
            "unit": "ops/sec",
            "extra": "216 samples"
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
          "id": "0f8d9aeec7e5d764f1662b3ce8b026f3b1007113",
          "message": "Bump es5-ext from 0.10.62 to 0.10.64 (#6925)\n\nBumps [es5-ext](https://github.com/medikoo/es5-ext) from 0.10.62 to\r\n0.10.64.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/medikoo/es5-ext/releases\">es5-ext's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>0.10.64 (2024-02-27)</h2>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li>Revert update to postinstall script meant to fix Powershell issue,\r\nas it's a regression for some Linux terminals (<a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/c2e2bb90c295c4c582445a6f03b2a3ad0b22550a\">c2e2bb9</a>)</li>\r\n</ul>\r\n<hr />\r\n<p><a\r\nhref=\"https://github.com/medikoo/es5-ext/compare/v0.10.63...v0.10.64\">Comparison\r\nsince last release</a></p>\r\n<h2>0.10.63 (2024-02-23)</h2>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li>Do not rely on problematic regex (<a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/3551cdd7b2db08b1632841f819d008757d28e8e2\">3551cdd</a>),\r\naddresses <a\r\nhref=\"https://redirect.github.com/medikoo/es5-ext/issues/201\">#201</a></li>\r\n<li>Support ES2015+ function definitions in\r\n<code>function#toStringTokens()</code> (<a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/a52e95736690ad1d465ebcd9791d54570e294602\">a52e957</a>),\r\naddresses <a\r\nhref=\"https://redirect.github.com/medikoo/es5-ext/issues/021\">#021</a></li>\r\n<li>Ensure postinstall script does not crash on Windows, fixes <a\r\nhref=\"https://redirect.github.com/medikoo/es5-ext/issues/181\">#181</a>\r\n(<a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/bf8ed799d57df53096da9d908ff577f305e1366f\">bf8ed79</a>)</li>\r\n</ul>\r\n<h3>Maintenance Improvements</h3>\r\n<ul>\r\n<li>Simplify the manifest message (<a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/7855319f41b9736639cf4555bd2c419f17addf55\">7855319</a>)</li>\r\n</ul>\r\n<hr />\r\n<p><a\r\nhref=\"https://github.com/medikoo/es5-ext/compare/v0.10.62...v0.10.63\">Comparison\r\nsince last release</a></p>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/medikoo/es5-ext/blob/main/CHANGELOG.md\">es5-ext's\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h3><a\r\nhref=\"https://github.com/medikoo/es5-ext/compare/v0.10.63...v0.10.64\">0.10.64</a>\r\n(2024-02-27)</h3>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li>Revert update to postinstall script meant to fix Powershell issue,\r\nas it's a regression for some Linux terminals (<a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/c2e2bb90c295c4c582445a6f03b2a3ad0b22550a\">c2e2bb9</a>)</li>\r\n</ul>\r\n<h3><a\r\nhref=\"https://github.com/medikoo/es5-ext/compare/v0.10.62...v0.10.63\">0.10.63</a>\r\n(2024-02-23)</h3>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li>Do not rely on problematic regex (<a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/3551cdd7b2db08b1632841f819d008757d28e8e2\">3551cdd</a>),\r\naddresses <a\r\nhref=\"https://redirect.github.com/medikoo/es5-ext/issues/201\">#201</a></li>\r\n<li>Support ES2015+ function definitions in\r\n<code>function#toStringTokens()</code> (<a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/a52e95736690ad1d465ebcd9791d54570e294602\">a52e957</a>),\r\naddresses <a\r\nhref=\"https://redirect.github.com/medikoo/es5-ext/issues/021\">#021</a></li>\r\n<li>Ensure postinstall script does not crash on Windows, fixes <a\r\nhref=\"https://redirect.github.com/medikoo/es5-ext/issues/181\">#181</a>\r\n(<a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/bf8ed799d57df53096da9d908ff577f305e1366f\">bf8ed79</a>)</li>\r\n</ul>\r\n<h3>Maintenance Improvements</h3>\r\n<ul>\r\n<li>Simplify the manifest message (<a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/7855319f41b9736639cf4555bd2c419f17addf55\">7855319</a>)</li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/f76b03d8c49ce4871f37f428c0e1d3ee6637fcc4\"><code>f76b03d</code></a>\r\nchore: Release v0.10.64</li>\r\n<li><a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/2881acda50de0848b456690769919ed4b86be489\"><code>2881acd</code></a>\r\nchore: Bump dependencies</li>\r\n<li><a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/c2e2bb90c295c4c582445a6f03b2a3ad0b22550a\"><code>c2e2bb9</code></a>\r\nfix: Revert update meant to fix Powershell issue, as it's a\r\nregression</li>\r\n<li><a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/16f2b7253d3d8d499d8cf1d3ca76c585da7f08d3\"><code>16f2b72</code></a>\r\ndocs: Fix date in the changelog</li>\r\n<li><a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/de4e03c4776a303284142f73f3f181a070615817\"><code>de4e03c</code></a>\r\nchore: Release v0.10.63</li>\r\n<li><a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/3fd53b755ec883be8f119c747f0b04130741e456\"><code>3fd53b7</code></a>\r\nchore: Upgrade<code> lint-staged</code> to v13</li>\r\n<li><a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/bf8ed799d57df53096da9d908ff577f305e1366f\"><code>bf8ed79</code></a>\r\nchore: Ensure postinstall script does not crash on Windows</li>\r\n<li><a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/2cbbb0717bd8de6e38fcba1f0d45bc876e7a1951\"><code>2cbbb07</code></a>\r\nchore: Bump dependencies</li>\r\n<li><a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/22d0416ea170000a115609f22a560dfa9193ebb0\"><code>22d0416</code></a>\r\nchore: Bump LICENSE year</li>\r\n<li><a\r\nhref=\"https://github.com/medikoo/es5-ext/commit/a52e95736690ad1d465ebcd9791d54570e294602\"><code>a52e957</code></a>\r\nfix: Support ES2015+ function definitions in\r\n<code>function#toStringTokens()</code></li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/medikoo/es5-ext/compare/v0.10.62...v0.10.64\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=es5-ext&package-manager=npm_and_yarn&previous-version=0.10.62&new-version=0.10.64)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-02-27T11:48:21-08:00",
          "tree_id": "cf32c629f2054cc2c09fc44c47b888f38df1d0d4",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/0f8d9aeec7e5d764f1662b3ce8b026f3b1007113"
        },
        "date": 1709063637109,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 188578,
            "range": "±2.04%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 193996,
            "range": "±2.12%",
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
          "id": "48416e4ded23785856ad5c7ce918858b373f7bb4",
          "message": "Async cache cleanup (#6922)\n\nSmall incremental changes to async storage\r\n\r\n- Remove unnecessary abstraction (`CryptoKeyStore`) around\r\n`AsyncMemoryStorage` class\r\n- Rename `IAsyncMemoryStorage.ts` to `IAsyncStorage.ts` to match actual\r\ninterface name\r\n- Add timeout to indexedDb delete operation",
          "timestamp": "2024-02-27T13:49:38-08:00",
          "tree_id": "3c06079e1c323cbf335ff9de8ecaaec0a2aa1ed4",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/48416e4ded23785856ad5c7ce918858b373f7bb4"
        },
        "date": 1709070910602,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 181614,
            "range": "±1.83%",
            "unit": "ops/sec",
            "extra": "211 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 183111,
            "range": "±1.79%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "7cb6ab6023260ff8e690637cd94be07e49bad0e1",
          "message": "Update \"errors\" doc with the retry info (#6926)\n\nUpdate \"errors\" doc with the retry info.",
          "timestamp": "2024-02-28T14:35:10-05:00",
          "tree_id": "6515ea481fb3e3454c90fc9055da87b796db2bbd",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/7cb6ab6023260ff8e690637cd94be07e49bad0e1"
        },
        "date": 1709149242470,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 209948,
            "range": "±1.83%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 185995,
            "range": "±2.10%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "776509473cbd53ac0fd469bdb0810d6b1eede413",
          "message": "Add 1p and 3p fallback logic to test utils environment variable setup (#6927)\n\nCurrently LabClient test utils search for a .env file in the 3p repo\r\nonly. If the .env file is placed in the msal-javascript-1p directory, it\r\nwon't find them for local testing. This PR prioritizes the higher-level\r\n.env and falls back to the 3p .env file if the test env variables aren't\r\nfound there.",
          "timestamp": "2024-02-28T17:17:16-08:00",
          "tree_id": "e613751a24464698cdad1438f4724da649ab8196",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/776509473cbd53ac0fd469bdb0810d6b1eede413"
        },
        "date": 1709169747848,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 191166,
            "range": "±1.97%",
            "unit": "ops/sec",
            "extra": "215 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 211195,
            "range": "±1.97%",
            "unit": "ops/sec",
            "extra": "215 samples"
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
          "id": "bdefa55b1d4386cd627c8ea4f880b6d9f7b95d04",
          "message": "Export IPerformanceClient & stub (#6929)\n\nExports IPerformanceClient and StubPerformanceClient",
          "timestamp": "2024-03-01T19:14:26Z",
          "tree_id": "dfe8a942609fb43f979fd54b0df8d54c46cc498e",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/bdefa55b1d4386cd627c8ea4f880b6d9f7b95d04"
        },
        "date": 1709320787633,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 207948,
            "range": "±2.07%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 188574,
            "range": "±2.15%",
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
          "id": "dfda8fa0751a1dc924d081ab359a25860b22483f",
          "message": "Remove preflightBrowserEnvironmentCheck from Controller (#6932)\n\nRemoves `preflightBrowserEnvironmentCheck` from IController interface\r\nand moves the implementation to BrowserUtils",
          "timestamp": "2024-03-05T12:13:28-08:00",
          "tree_id": "a39ea995193881e68e666fbd63bf81260ae1341b",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/dfda8fa0751a1dc924d081ab359a25860b22483f"
        },
        "date": 1709669947585,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 196062,
            "range": "±1.97%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 192121,
            "range": "±1.93%",
            "unit": "ops/sec",
            "extra": "222 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "dasau@microsoft.com",
            "name": "Dan Saunders",
            "username": "codexeon"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "59f803b11a4498f5f5eea8c1a03b865c4c55e4d0",
          "message": "Fix compatibility issues with Nested App Auth and msal-react (#6892)\n\nThere were a few bugs that were blocking usage of msal-react in the\r\nNested App Auth code path.\r\n\r\n1. handleRedirectPromise was throwing an error, and msal-react depends\r\non calling this before it sets user authenticated status.\r\n2. The function useMsalAuthentication takes request as an optional\r\nparameter, although Nested App Auth code path was considering it a\r\nrequired parameter. It was throwing exceptions if request was undefined,\r\nand correlation id is not generated until after performance event starts\r\nfor requests.",
          "timestamp": "2024-03-07T09:32:58-08:00",
          "tree_id": "0ce6890f6a7ea93028b1a839af8c330f848dfd64",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/59f803b11a4498f5f5eea8c1a03b865c4c55e4d0"
        },
        "date": 1709833106334,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 194550,
            "range": "±1.94%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 189984,
            "range": "±2.06%",
            "unit": "ops/sec",
            "extra": "225 samples"
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
          "id": "f92fc6a8c21bdb4bbc078d4bb84a04fecf363ad9",
          "message": "Validate that claims and client capabilities are correctly merged (#6923)\n\nApplied the Boy Scout Rule to the ClientCredentialClient and OBO test\r\nfiles to eliminate use of sinon.",
          "timestamp": "2024-03-08T19:51:08-05:00",
          "tree_id": "e7062587ff446b0537e080d0f638a67405faac6a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/f92fc6a8c21bdb4bbc078d4bb84a04fecf363ad9"
        },
        "date": 1709945787789,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 191304,
            "range": "±1.97%",
            "unit": "ops/sec",
            "extra": "225 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 192878,
            "range": "±1.99%",
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
          "id": "b7ae3c3d0e395a63f8d9f39b30cc1a568d4cb90f",
          "message": "Instrument non-auth error name and stack (#6937)\n\n- Instrument non-auth error name and stack in Controllers.\r\n- Add/update telemetry functions to capture non-auth error name and\r\nstack.",
          "timestamp": "2024-03-10T09:29:55-04:00",
          "tree_id": "e077f23a73ed0d4f5d35140af5ef4f93c6e36d3e",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/b7ae3c3d0e395a63f8d9f39b30cc1a568d4cb90f"
        },
        "date": 1710077730535,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 193327,
            "range": "±2.07%",
            "unit": "ops/sec",
            "extra": "225 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 225081,
            "range": "±1.56%",
            "unit": "ops/sec",
            "extra": "235 samples"
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
          "id": "6bd770d16fa11688ad3ea2a42f5ed82c67632553",
          "message": "Fix AcquireTokenSilentAsync sub-measurement instrumentation (#6947)\n\n- Fix AcquireTokenSilentAsync sub-measurement instrumentation.",
          "timestamp": "2024-03-11T18:17:03-04:00",
          "tree_id": "fe87163e1badf8453eb993ecb33abfdfd3caeb68",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/6bd770d16fa11688ad3ea2a42f5ed82c67632553"
        },
        "date": 1710195760142,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 231636,
            "range": "±1.15%",
            "unit": "ops/sec",
            "extra": "235 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 207955,
            "range": "±2.05%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "b3f0e727d3cc2653d517ca512f64688d87166f07",
          "message": "Fix nightly build (#6936)\n\nAdds optional msal-react dependencies to fix nightly build",
          "timestamp": "2024-03-13T13:17:27-07:00",
          "tree_id": "2a6a68e6e51b21720a0b8da250269f74ff591827",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/b3f0e727d3cc2653d517ca512f64688d87166f07"
        },
        "date": 1710361379519,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 192814,
            "range": "±2.08%",
            "unit": "ops/sec",
            "extra": "224 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 189892,
            "range": "±1.81%",
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
          "id": "69df8f629eb149b86479afcbf076b91c76946152",
          "message": "Move build request functions (#6951)\n\n- Move initializeBaseRequest and initializeSilentRequest out of the\r\nInteractionClient classes\r\n- Move implementation for hashString from CryptoOps to BrowserCrypto\r\n\r\nThese changes pave the way for better handling of concurrent iframe\r\nrequests",
          "timestamp": "2024-03-15T11:20:52-07:00",
          "tree_id": "69883ec4cbabd9b5697a9082f78e6a2c9dc7acf6",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/69df8f629eb149b86479afcbf076b91c76946152"
        },
        "date": 1710527180199,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 195257,
            "range": "±1.99%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 191383,
            "range": "±2.18%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "35f8dad9d44cf0da115a5fcdb83ce0fc6eb5224f",
          "message": "Bump follow-redirects from 1.15.5 to 1.15.6 (#6957)\n\nBumps\r\n[follow-redirects](https://github.com/follow-redirects/follow-redirects)\r\nfrom 1.15.5 to 1.15.6.\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/follow-redirects/follow-redirects/commit/35a517c5861d79dc8bff7db8626013d20b711b06\"><code>35a517c</code></a>\r\nRelease version 1.15.6 of the npm package.</li>\r\n<li><a\r\nhref=\"https://github.com/follow-redirects/follow-redirects/commit/c4f847f85176991f95ab9c88af63b1294de8649b\"><code>c4f847f</code></a>\r\nDrop Proxy-Authorization across hosts.</li>\r\n<li><a\r\nhref=\"https://github.com/follow-redirects/follow-redirects/commit/8526b4a1b2ab3a2e4044299377df623a661caa76\"><code>8526b4a</code></a>\r\nUse GitHub for disclosure.</li>\r\n<li>See full diff in <a\r\nhref=\"https://github.com/follow-redirects/follow-redirects/compare/v1.15.5...v1.15.6\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=follow-redirects&package-manager=npm_and_yarn&previous-version=1.15.5&new-version=1.15.6)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-03-18T10:10:51-07:00",
          "tree_id": "60e5ca2f55d8722ab4afef047b861f3a47a166d7",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/35f8dad9d44cf0da115a5fcdb83ce0fc6eb5224f"
        },
        "date": 1710782193982,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190320,
            "range": "±2.14%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 182121,
            "range": "±1.96%",
            "unit": "ops/sec",
            "extra": "220 samples"
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
          "id": "c1221e8452e60fec37b2c7fc1dd1d8fbc80b1d3d",
          "message": "Bump jose from 2.0.6 to 2.0.7 (#6940)\n\nBumps [jose](https://github.com/panva/jose) from 2.0.6 to 2.0.7.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/panva/jose/releases\">jose's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>v2.0.7</h2>\r\n<h3>Fixes</h3>\r\n<ul>\r\n<li>add a maxOutputLength option to zlib inflate (<a\r\nhref=\"https://github.com/panva/jose/commit/02a65794f7873cdaf12e81e80ad076fcdc4a9314\">02a6579</a>),\r\nfixes <a\r\nhref=\"https://github.com/panva/jose/security/advisories/GHSA-hhhv-q57g-882q\">CVE-2024-28176</a></li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/panva/jose/blob/v2.0.7/CHANGELOG.md\">jose's\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h2><a\r\nhref=\"https://github.com/panva/jose/compare/v2.0.6...v2.0.7\">2.0.7</a>\r\n(2024-03-07)</h2>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li>add a maxOutputLength option to zlib inflate (<a\r\nhref=\"https://github.com/panva/jose/commit/02a65794f7873cdaf12e81e80ad076fcdc4a9314\">02a6579</a>)</li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/panva/jose/commit/0fbe2e68c77d3201bafda2592a21cccd7e7b3136\"><code>0fbe2e6</code></a>\r\nchore(release): 2.0.7</li>\r\n<li><a\r\nhref=\"https://github.com/panva/jose/commit/02a65794f7873cdaf12e81e80ad076fcdc4a9314\"><code>02a6579</code></a>\r\nfix: add a maxOutputLength option to zlib inflate</li>\r\n<li>See full diff in <a\r\nhref=\"https://github.com/panva/jose/compare/v2.0.6...v2.0.7\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<details>\r\n<summary>Maintainer changes</summary>\r\n<p>This version was pushed to npm by <a\r\nhref=\"https://www.npmjs.com/~panva\">panva</a>, a new releaser for jose\r\nsince your current version.</p>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=jose&package-manager=npm_and_yarn&previous-version=2.0.6&new-version=2.0.7)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-03-18T10:24:16-07:00",
          "tree_id": "42378e0709ea5057dee8def284bf335b6382075c",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/c1221e8452e60fec37b2c7fc1dd1d8fbc80b1d3d"
        },
        "date": 1710782976904,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 194027,
            "range": "±2.16%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 205797,
            "range": "±1.90%",
            "unit": "ops/sec",
            "extra": "213 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "msaljsbuilds@microsoft.com",
            "name": "MSAL.js Release Automation"
          },
          "committer": {
            "email": "msaljsbuilds@microsoft.com",
            "name": "MSAL.js Release Automation"
          },
          "distinct": true,
          "id": "5bfd698698610fa57d11b2a335d2d11832b93b43",
          "message": "Bump package versions",
          "timestamp": "2024-03-19T18:51:57Z",
          "tree_id": "c7566461e79ab6f9cd31ba8745beae990eaaf2d2",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/5bfd698698610fa57d11b2a335d2d11832b93b43"
        },
        "date": 1710874647392,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 200854,
            "range": "±2.10%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 216320,
            "range": "±1.88%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "e8ec4bd6deb76c563148293202c72e9b42d7f507",
          "message": "Capture telemetry event tree (#6948)\n\n- Capture telemetry event tree.",
          "timestamp": "2024-03-20T08:58:23-04:00",
          "tree_id": "7bfd8b1d56cf9288f83fea1b633e6d4ea31eac8b",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/e8ec4bd6deb76c563148293202c72e9b42d7f507"
        },
        "date": 1710939842456,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 195383,
            "range": "±2.25%",
            "unit": "ops/sec",
            "extra": "219 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 188223,
            "range": "±2.17%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "cba97b5f7a87dc8e55f2cad384ff471931b67f2a",
          "message": "Revert version bump (#6961)\n\nThis PR manually reverts the last version bump from an incomplete\r\nrelease",
          "timestamp": "2024-03-20T12:37:23-07:00",
          "tree_id": "9e5912289578d8110893b25e5f0c2730799d8b65",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/cba97b5f7a87dc8e55f2cad384ff471931b67f2a"
        },
        "date": 1710963791074,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 212477,
            "range": "±1.83%",
            "unit": "ops/sec",
            "extra": "227 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 184569,
            "range": "±1.80%",
            "unit": "ops/sec",
            "extra": "223 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "msaljsbuilds@microsoft.com",
            "name": "MSAL.js Release Automation"
          },
          "committer": {
            "email": "msaljsbuilds@microsoft.com",
            "name": "MSAL.js Release Automation"
          },
          "distinct": true,
          "id": "00c09f5aa79f8c95c49d37dbffab95ca1367f1ad",
          "message": "Bump package versions",
          "timestamp": "2024-03-22T20:32:43Z",
          "tree_id": "d389fd86cb72459b40c527013d027c3169e06e42",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/00c09f5aa79f8c95c49d37dbffab95ca1367f1ad"
        },
        "date": 1711139894256,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190564,
            "range": "±2.09%",
            "unit": "ops/sec",
            "extra": "224 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187038,
            "range": "±1.88%",
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
          "id": "877818b3fcbac3b5ce422b30f82812a051ab5183",
          "message": "Stringify telemetry context (#6984)\n\n- Stringify telemetry context.",
          "timestamp": "2024-03-27T12:39:31-04:00",
          "tree_id": "80a3cc36f7a4b19ee552eaebc8b67646af71b648",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/877818b3fcbac3b5ce422b30f82812a051ab5183"
        },
        "date": 1711557903933,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 187237,
            "range": "±1.98%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187515,
            "range": "±2.10%",
            "unit": "ops/sec",
            "extra": "222 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "msaljsbuilds@microsoft.com",
            "name": "MSAL.js Release Automation"
          },
          "committer": {
            "email": "msaljsbuilds@microsoft.com",
            "name": "MSAL.js Release Automation"
          },
          "distinct": true,
          "id": "26915e5d68c175db4b9b5c2ef089081952752a28",
          "message": "Bump package versions",
          "timestamp": "2024-03-27T18:41:22Z",
          "tree_id": "c8cd5fcf4898ea5eb483717a391fb0a64305cf4a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/26915e5d68c175db4b9b5c2ef089081952752a28"
        },
        "date": 1711565208183,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 188984,
            "range": "±2.00%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 205433,
            "range": "±2.15%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "a726ecf19090f5e0b22ced55b0a622e29abeae61",
          "message": "Bump express from 4.18.2 to 4.19.2 (#6986)\n\nBumps [express](https://github.com/expressjs/express) from 4.18.2 to\r\n4.19.2.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/expressjs/express/releases\">express's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>4.19.2</h2>\r\n<h2>What's Changed</h2>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/0b746953c4bd8e377123527db11f9cd866e39f94\">Improved\r\nfix for open redirect allow list bypass</a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/expressjs/express/compare/4.19.1...4.19.2\">https://github.com/expressjs/express/compare/4.19.1...4.19.2</a></p>\r\n<h2>4.19.1</h2>\r\n<h2>What's Changed</h2>\r\n<ul>\r\n<li>Fix ci after location patch by <a\r\nhref=\"https://github.com/wesleytodd\"><code>@​wesleytodd</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5552\">expressjs/express#5552</a></li>\r\n<li>fixed un-edited version in history.md for 4.19.0 by <a\r\nhref=\"https://github.com/wesleytodd\"><code>@​wesleytodd</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5556\">expressjs/express#5556</a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/expressjs/express/compare/4.19.0...4.19.1\">https://github.com/expressjs/express/compare/4.19.0...4.19.1</a></p>\r\n<h2>4.19.0</h2>\r\n<h2>What's Changed</h2>\r\n<ul>\r\n<li>fix typo in release date by <a\r\nhref=\"https://github.com/UlisesGascon\"><code>@​UlisesGascon</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5527\">expressjs/express#5527</a></li>\r\n<li>docs: nominating <a\r\nhref=\"https://github.com/wesleytodd\"><code>@​wesleytodd</code></a> to be\r\nproject captian by <a\r\nhref=\"https://github.com/wesleytodd\"><code>@​wesleytodd</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5511\">expressjs/express#5511</a></li>\r\n<li>docs: loosen TC activity rules by <a\r\nhref=\"https://github.com/wesleytodd\"><code>@​wesleytodd</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5510\">expressjs/express#5510</a></li>\r\n<li>Add note on how to update docs for new release by <a\r\nhref=\"https://github.com/crandmck\"><code>@​crandmck</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5541\">expressjs/express#5541</a></li>\r\n<li><a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5551/commits/660ccf5fa33dd0baab069e5c8ddd9ffe7d8bbff1\">Prevent\r\nopen redirect allow list bypass due to encodeurl</a></li>\r\n<li>Release 4.19.0 by <a\r\nhref=\"https://github.com/wesleytodd\"><code>@​wesleytodd</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5551\">expressjs/express#5551</a></li>\r\n</ul>\r\n<h2>New Contributors</h2>\r\n<ul>\r\n<li><a href=\"https://github.com/crandmck\"><code>@​crandmck</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5541\">expressjs/express#5541</a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/expressjs/express/compare/4.18.3...4.19.0\">https://github.com/expressjs/express/compare/4.18.3...4.19.0</a></p>\r\n<h2>4.18.3</h2>\r\n<h2>Main Changes</h2>\r\n<ul>\r\n<li>Fix routing requests without method</li>\r\n<li>deps: body-parser@1.20.2\r\n<ul>\r\n<li>Fix strict json error message on Node.js 19+</li>\r\n<li>deps: content-type@~1.0.5</li>\r\n<li>deps: raw-body@2.5.2</li>\r\n</ul>\r\n</li>\r\n</ul>\r\n<h2>Other Changes</h2>\r\n<ul>\r\n<li>Use https: protocol instead of deprecated git: protocol by <a\r\nhref=\"https://github.com/vcsjones\"><code>@​vcsjones</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5032\">expressjs/express#5032</a></li>\r\n<li>build: Node.js@16.18 and Node.js@18.12 by <a\r\nhref=\"https://github.com/abenhamdine\"><code>@​abenhamdine</code></a> in\r\n<a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5034\">expressjs/express#5034</a></li>\r\n<li>ci: update actions/checkout to v3 by <a\r\nhref=\"https://github.com/armujahid\"><code>@​armujahid</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5027\">expressjs/express#5027</a></li>\r\n<li>test: remove unused function arguments in params by <a\r\nhref=\"https://github.com/raksbisht\"><code>@​raksbisht</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5124\">expressjs/express#5124</a></li>\r\n<li>Remove unused originalIndex from acceptParams by <a\r\nhref=\"https://github.com/raksbisht\"><code>@​raksbisht</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5119\">expressjs/express#5119</a></li>\r\n<li>Fixed typos by <a\r\nhref=\"https://github.com/raksbisht\"><code>@​raksbisht</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5117\">expressjs/express#5117</a></li>\r\n<li>examples: remove unused params by <a\r\nhref=\"https://github.com/raksbisht\"><code>@​raksbisht</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5113\">expressjs/express#5113</a></li>\r\n<li>fix: parameter str is not described in JSDoc by <a\r\nhref=\"https://github.com/raksbisht\"><code>@​raksbisht</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5130\">expressjs/express#5130</a></li>\r\n<li>fix: typos in History.md by <a\r\nhref=\"https://github.com/raksbisht\"><code>@​raksbisht</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5131\">expressjs/express#5131</a></li>\r\n<li>build : add Node.js@19.7 by <a\r\nhref=\"https://github.com/abenhamdine\"><code>@​abenhamdine</code></a> in\r\n<a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5028\">expressjs/express#5028</a></li>\r\n<li>test: remove unused function arguments in params by <a\r\nhref=\"https://github.com/raksbisht\"><code>@​raksbisht</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5137\">expressjs/express#5137</a></li>\r\n</ul>\r\n<!-- raw HTML omitted -->\r\n</blockquote>\r\n<p>... (truncated)</p>\r\n</details>\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/expressjs/express/blob/master/History.md\">express's\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h1>4.19.2 / 2024-03-25</h1>\r\n<ul>\r\n<li>Improved fix for open redirect allow list bypass</li>\r\n</ul>\r\n<h1>4.19.1 / 2024-03-20</h1>\r\n<ul>\r\n<li>Allow passing non-strings to res.location with new encoding handling\r\nchecks</li>\r\n</ul>\r\n<h1>4.19.0 / 2024-03-20</h1>\r\n<ul>\r\n<li>Prevent open redirect allow list bypass due to encodeurl</li>\r\n<li>deps: cookie@0.6.0</li>\r\n</ul>\r\n<h1>4.18.3 / 2024-02-29</h1>\r\n<ul>\r\n<li>Fix routing requests without method</li>\r\n<li>deps: body-parser@1.20.2\r\n<ul>\r\n<li>Fix strict json error message on Node.js 19+</li>\r\n<li>deps: content-type@~1.0.5</li>\r\n<li>deps: raw-body@2.5.2</li>\r\n</ul>\r\n</li>\r\n<li>deps: cookie@0.6.0\r\n<ul>\r\n<li>Add <code>partitioned</code> option</li>\r\n</ul>\r\n</li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/04bc62787be974874bc1467b23606c36bc9779ba\"><code>04bc627</code></a>\r\n4.19.2</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/da4d763ff6ba9df6dbd8f1f0b1d05412dda934d5\"><code>da4d763</code></a>\r\nImproved fix for open redirect allow list bypass</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/4f0f6cc67d531431c096ea006c2191b92931bbc3\"><code>4f0f6cc</code></a>\r\n4.19.1</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/a003cfab034fbadb1c78ae337ee8ab389adda217\"><code>a003cfa</code></a>\r\nAllow passing non-strings to res.location with new encoding handling\r\nchecks f...</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/a1fa90fcea7d8e844e1c9938ad095d62669c3abd\"><code>a1fa90f</code></a>\r\nfixed un-edited version in history.md for 4.19.0</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/11f2b1db227fd42c2508c427032c1ec671b306be\"><code>11f2b1d</code></a>\r\nbuild: fix build due to inconsistent supertest behavior in older\r\nversions</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/084e36506a18774f85206a65d8da04dc1107fc1b\"><code>084e365</code></a>\r\n4.19.0</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/0867302ddbde0e9463d0564fea5861feb708c2dd\"><code>0867302</code></a>\r\nPrevent open redirect allow list bypass due to encodeurl</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/567c9c665d0de4c344b8e160146050770233783c\"><code>567c9c6</code></a>\r\nAdd note on how to update docs for new release (<a\r\nhref=\"https://redirect.github.com/expressjs/express/issues/5541\">#5541</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/69a4cf2819c4449ec6ea45649691fb43a528d5d1\"><code>69a4cf2</code></a>\r\ndeps: cookie@0.6.0</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/expressjs/express/compare/4.18.2...4.19.2\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<details>\r\n<summary>Maintainer changes</summary>\r\n<p>This version was pushed to npm by <a\r\nhref=\"https://www.npmjs.com/~wesleytodd\">wesleytodd</a>, a new releaser\r\nfor express since your current version.</p>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=express&package-manager=npm_and_yarn&previous-version=4.18.2&new-version=4.19.2)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-03-27T11:46:26-07:00",
          "tree_id": "4da1d9a26869d7a91af2618736d5991ae9fc07eb",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/a726ecf19090f5e0b22ced55b0a622e29abeae61"
        },
        "date": 1711565519740,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 192588,
            "range": "±2.11%",
            "unit": "ops/sec",
            "extra": "226 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 230227,
            "range": "±1.21%",
            "unit": "ops/sec",
            "extra": "233 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "dzu@energinet.dk",
            "name": "Dzhavat Ushev",
            "username": "dzhavat"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "5ab83ec5b3479f0a9fcb52876991386916ffd249",
          "message": "Update link in Security docs (#6877)\n\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-03-27T14:57:01-07:00",
          "tree_id": "5135b9c296163b7cb5584a13f2ba146d90ba55b9",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/5ab83ec5b3479f0a9fcb52876991386916ffd249"
        },
        "date": 1711576942356,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 193048,
            "range": "±2.01%",
            "unit": "ops/sec",
            "extra": "226 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 189572,
            "range": "±1.86%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "1a0414eec070fa166bb49274c56b585f9fe8e4ee",
          "message": "Migrate ADO Pipelines to OneBranch (#6992)",
          "timestamp": "2024-04-03T15:08:51-07:00",
          "tree_id": "c4a550b0f110092cacdf4cc9816500411f602741",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/1a0414eec070fa166bb49274c56b585f9fe8e4ee"
        },
        "date": 1712182437775,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 194281,
            "range": "±2.06%",
            "unit": "ops/sec",
            "extra": "200 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 193146,
            "range": "±2.20%",
            "unit": "ops/sec",
            "extra": "220 samples"
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
          "id": "8a4aa37af8c511f705071842ad2af35fbd9634c9",
          "message": "Fix for concurrent iframe calls (#6962)\n\nWhen multiple acquireTokenSilent requests are made in parallel there is\r\na chance that they will all need to fallback to the iframe flow. It is\r\nboth unnecessary for more than 1 iframe call to be made and results in a\r\nperf and reliability degradation for all calls. This PR introduces a\r\nmechanism to track in progress iframe calls and cause subsequent\r\nrequests to wait before retrying the cache and/or RT redemption.\r\n\r\nNote: Telemetry dashboards will need to be updated after this change is\r\nreleased to avoid counting awaited iframe calls against our perf metrics\r\nmore than once.\r\n\r\nNote: This PR does not make any changes to ssoSilent - follow up work\r\nshould add ssoSilent calls to the active request tracking variable and\r\nlog warnings when more than 1 ssoSilent requests are made but should\r\n**not** block the calls.",
          "timestamp": "2024-04-03T16:11:10-07:00",
          "tree_id": "c8ea87748f039d326cd5a3073d533ff31405ce50",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/8a4aa37af8c511f705071842ad2af35fbd9634c9"
        },
        "date": 1712186192586,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190137,
            "range": "±2.03%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 188882,
            "range": "±2.05%",
            "unit": "ops/sec",
            "extra": "216 samples"
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
          "id": "4848823559291842bacb5b05d5385c58af50a3ff",
          "message": "Bump vite from 3.2.8 to 3.2.10 (#7003)\n\nBumps [vite](https://github.com/vitejs/vite/tree/HEAD/packages/vite)\r\nfrom 3.2.8 to 3.2.10.\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/vitejs/vite/blob/v3.2.10/packages/vite/CHANGELOG.md\">vite's\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h2><!-- raw HTML omitted -->3.2.10 (2024-03-24)<!-- raw HTML omitted\r\n--></h2>\r\n<h2><!-- raw HTML omitted -->3.2.9 (2024-03-24)<!-- raw HTML omitted\r\n--></h2>\r\n<ul>\r\n<li>fix: port <a\r\nhref=\"https://github.com/vitejs/vite/tree/HEAD/packages/vite/issues/15653\">#15653</a>\r\nto v3 (<a\r\nhref=\"https://github.com/vitejs/vite/tree/HEAD/packages/vite/issues/15655\">#15655</a>)\r\n(<a href=\"https://github.com/vitejs/vite/commit/99080ca\">99080ca</a>),\r\ncloses <a\r\nhref=\"https://redirect.github.com/vitejs/vite/issues/15653\">#15653</a>\r\n<a\r\nhref=\"https://redirect.github.com/vitejs/vite/issues/15655\">#15655</a></li>\r\n<li>fix: port <a\r\nhref=\"https://github.com/vitejs/vite/tree/HEAD/packages/vite/issues/16250\">#16250</a>\r\nto v3 (<a\r\nhref=\"https://github.com/vitejs/vite/tree/HEAD/packages/vite/issues/16253\">#16253</a>)\r\n(<a href=\"https://github.com/vitejs/vite/commit/89c7c64\">89c7c64</a>),\r\ncloses <a\r\nhref=\"https://redirect.github.com/vitejs/vite/issues/16250\">#16250</a>\r\n<a\r\nhref=\"https://redirect.github.com/vitejs/vite/issues/16253\">#16253</a></li>\r\n<li>release: v3.2.8 (<a\r\nhref=\"https://github.com/vitejs/vite/commit/8352b75\">8352b75</a>)</li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/vitejs/vite/commit/1a8728f8dfff9d62ebcd67d65ef1cc4b82042de4\"><code>1a8728f</code></a>\r\nrelease: v3.2.10</li>\r\n<li><a\r\nhref=\"https://github.com/vitejs/vite/commit/5910f13ee2b6eac1d458f65d721c08ca600b18ab\"><code>5910f13</code></a>\r\nrelease: v3.2.9</li>\r\n<li><a\r\nhref=\"https://github.com/vitejs/vite/commit/89c7c645f09d16a38f146ef4a1528f218e844d67\"><code>89c7c64</code></a>\r\nfix: port <a\r\nhref=\"https://github.com/vitejs/vite/tree/HEAD/packages/vite/issues/16250\">#16250</a>\r\nto v3 (<a\r\nhref=\"https://github.com/vitejs/vite/tree/HEAD/packages/vite/issues/16253\">#16253</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/vitejs/vite/commit/8352b7546369b6ec958fe0b828e86eaca4e5cf88\"><code>8352b75</code></a>\r\nrelease: v3.2.8</li>\r\n<li><a\r\nhref=\"https://github.com/vitejs/vite/commit/99080ca3e6c2dcdc3c2d67bb2d143c59e0a329f2\"><code>99080ca</code></a>\r\nfix: port <a\r\nhref=\"https://github.com/vitejs/vite/tree/HEAD/packages/vite/issues/15653\">#15653</a>\r\nto v3 (<a\r\nhref=\"https://github.com/vitejs/vite/tree/HEAD/packages/vite/issues/15655\">#15655</a>)</li>\r\n<li>See full diff in <a\r\nhref=\"https://github.com/vitejs/vite/commits/v3.2.10/packages/vite\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=vite&package-manager=npm_and_yarn&previous-version=3.2.8&new-version=3.2.10)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-04-03T17:24:43-07:00",
          "tree_id": "0210c2b45970aea026300d97d34d579fe62e7cf5",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/4848823559291842bacb5b05d5385c58af50a3ff"
        },
        "date": 1712190605405,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190718,
            "range": "±2.02%",
            "unit": "ops/sec",
            "extra": "214 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 228494,
            "range": "±1.23%",
            "unit": "ops/sec",
            "extra": "212 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "jared@smell.flowers",
            "name": "Jared Miller",
            "username": "shmup"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "c9311d91794b7f4b3ae12b82754b1236746e1eb8",
          "message": "Correct the tokenRequest code examples (#7009)\n\nSimple change to example code, `;` becomes `,` and the Object is happy",
          "timestamp": "2024-04-08T16:58:08-07:00",
          "tree_id": "47b750b1623cf6c8046d384871f9d4031cd8e4f2",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/c9311d91794b7f4b3ae12b82754b1236746e1eb8"
        },
        "date": 1712621014227,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 199628,
            "range": "±2.17%",
            "unit": "ops/sec",
            "extra": "225 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 191834,
            "range": "±2.21%",
            "unit": "ops/sec",
            "extra": "220 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "dasau@microsoft.com",
            "name": "Dan Saunders",
            "username": "codexeon"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "62327356f6cbf31d847223d25b492357393508ed",
          "message": "Nested App Auth: allow empty parameters for loginPopup (#6941)\n\nThis change allows empty parameters for loginPopup by using a default\r\nrequest to match the behavior of StandardController. It also removes the\r\ndependency on crypto.randomUUID() which is not used elsewhere in the\r\nMSAL code base. Use the shared implementation to generate UUID v7\r\ninstead.",
          "timestamp": "2024-04-09T11:47:53-07:00",
          "tree_id": "dbcbd73d859d4cab85e136ae251d3d3262b26abe",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/62327356f6cbf31d847223d25b492357393508ed"
        },
        "date": 1712688812238,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 187461,
            "range": "±1.93%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 188446,
            "range": "±1.96%",
            "unit": "ops/sec",
            "extra": "222 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "lalima.sharda@gmail.com",
            "name": "Lalima Sharda",
            "username": "lalimasharda"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "031e6ecf0c86b75aec01f3d93f41e87dbd030fbc",
          "message": "Added classname for silent token renewal iframe (#6985)\n\nPorting change from v2 PR:\r\nhttps://github.com/AzureAD/microsoft-authentication-library-for-js/pull/6960",
          "timestamp": "2024-04-09T12:44:55-07:00",
          "tree_id": "348a099816406cd3cea930fede5c5644d9429ab4",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/031e6ecf0c86b75aec01f3d93f41e87dbd030fbc"
        },
        "date": 1712692246493,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 197574,
            "range": "±2.29%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 184797,
            "range": "±2.04%",
            "unit": "ops/sec",
            "extra": "223 samples"
          }
        ]
      }
    ]
  }
}