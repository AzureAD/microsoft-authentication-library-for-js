window.BENCHMARK_DATA = {
  "lastUpdate": 1728594397371,
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
          "id": "a196470c4cdd43be2999d814317d8e2207c2a25d",
          "message": "Linted all MSAL-Node Docs (#6991)\n\nI saved each file (without making any changes of my own) and they were\r\nautomatically reformatted.",
          "timestamp": "2024-04-09T16:14:29-04:00",
          "tree_id": "c92212b0c58d47e6310a69c51cf928a07b50857e",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/a196470c4cdd43be2999d814317d8e2207c2a25d"
        },
        "date": 1712693995584,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 201044,
            "range": "±2.15%",
            "unit": "ops/sec",
            "extra": "224 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187947,
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
          "id": "d15694644f9cec046032a16267110bf4209dad9d",
          "message": "Fix handleRedirectPromise Memoization (#6998)\n\nWe're doing too many things after checking for an existing promise but\r\nbefore setting the current promise which can create a race condition if\r\nmultiple instances of handleRedirectPromise are invoked.\r\n\r\nTo address this PR sets the promise immediately after checking for one.\r\n\r\nFixes #6893\r\n\r\n---------\r\n\r\nCo-authored-by: Jo Arroyo <joarroyo@microsoft.com>",
          "timestamp": "2024-04-09T13:40:17-07:00",
          "tree_id": "5768984993262e6e3115c7eb907a5a79e6aa2804",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/d15694644f9cec046032a16267110bf4209dad9d"
        },
        "date": 1712695548546,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 186378,
            "range": "±2.12%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 190077,
            "range": "±2.19%",
            "unit": "ops/sec",
            "extra": "224 samples"
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
          "id": "cd48cb747404831026ba7af6bc22cf34ce2cafed",
          "message": "Linted MSAL-Node's API Doc (#7015)\n\nI saved the file (without making any changes of my own) and it was\r\nautomatically reformatted.",
          "timestamp": "2024-04-09T18:00:33-04:00",
          "tree_id": "72842468810818b9f4878c16fc05490a03b926f9",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/cd48cb747404831026ba7af6bc22cf34ce2cafed"
        },
        "date": 1712700354262,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 199260,
            "range": "±2.06%",
            "unit": "ops/sec",
            "extra": "213 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 191664,
            "range": "±1.98%",
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
          "id": "e1900372a8f9b5c7458d830c6d78706bf28d867a",
          "message": "Skip \"login_hint\" opaque claim if domainHint param is set (#7008)\n\nSkip \"login_hint\" opaque claim if domainHint param is set.",
          "timestamp": "2024-04-10T12:10:16-04:00",
          "tree_id": "d1443151204b6ea151d8c62f6e9b3fd74445df7e",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/e1900372a8f9b5c7458d830c6d78706bf28d867a"
        },
        "date": 1712765736422,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 195628,
            "range": "±2.08%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 189918,
            "range": "±1.92%",
            "unit": "ops/sec",
            "extra": "222 samples"
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
          "id": "8f3bad900ac10349c1002c8834bd5b92caed479b",
          "message": "Managed Identity in MSALJS (#6880)\n\nCo-authored-by: Robbie Ginsburg <rgins16@gmail.com>",
          "timestamp": "2024-04-10T15:32:28-04:00",
          "tree_id": "09242e18ac9973901c7c8ec5f71a43572007b290",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/8f3bad900ac10349c1002c8834bd5b92caed479b"
        },
        "date": 1712777869704,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 186532,
            "range": "±1.91%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187736,
            "range": "±1.94%",
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
          "id": "17a0bcb7e0b75ceb881226cd456e24d04252698a",
          "message": "Disable multiple resources E2E tests (#7024)\n\nTemporarily disabling multipleResources E2E tests pending a sample\r\nupdate",
          "timestamp": "2024-04-10T12:59:10-07:00",
          "tree_id": "d5f1b351f6071a59eb2ad77e5abaa31d086aec77",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/17a0bcb7e0b75ceb881226cd456e24d04252698a"
        },
        "date": 1712779475610,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 193376,
            "range": "±2.02%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 185323,
            "range": "±1.91%",
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
          "id": "b7c2309073ab55aa1fb63d3188e5ee0abe0413ac",
          "message": "Capture and instrument cache errors (#7021)\n\n- Add CacheError.\r\n- Capture and throw cache errors as CacheError.\r\n- Instrument the number of tokens in the cache if CacheError occurs.",
          "timestamp": "2024-04-10T17:13:28-04:00",
          "tree_id": "4f5612f6388d7b449714f2002019bf9fac116c6f",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/b7c2309073ab55aa1fb63d3188e5ee0abe0413ac"
        },
        "date": 1712783954642,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 193515,
            "range": "±2.03%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 199297,
            "range": "±2.07%",
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
          "id": "5f57e84f83958d07f5178cd1d0e5af0c3341985c",
          "message": "Node-Extensions workaround npm regression (#7022)\n\nnpm version 10.4.0 introduced a regression where it auto-adds a default\r\ninstall script during publish when a binding.gyp file exists. This\r\ninstall script attempts to recompile binaries upon install. This is\r\nbreaking installation of node-extensions as we ship precompiled binaries\r\nand don't include the .gyp file in the package.\r\n\r\nTo workaround this I've added an explicit install script that simply\r\nexits so npm doesn't add its own.",
          "timestamp": "2024-04-10T15:23:21-07:00",
          "tree_id": "c7f94e250f3c71ad161e7d3267704de804aa4913",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/5f57e84f83958d07f5178cd1d0e5af0c3341985c"
        },
        "date": 1712788122701,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 204707,
            "range": "±2.08%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 188829,
            "range": "±2.02%",
            "unit": "ops/sec",
            "extra": "225 samples"
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
          "id": "03b85a6be980d1a8d02b6adbf69f49e920302c94",
          "message": "Manual browser bump (#7023)\n\nThis PR bumps msal-browser to v3.12.0 so the next release bumps to\r\n3.13.0+ to catch up with 1P package",
          "timestamp": "2024-04-10T17:56:01-07:00",
          "tree_id": "b804ee90b5891161ccbda0f5ab56d3f3f6f20b14",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/03b85a6be980d1a8d02b6adbf69f49e920302c94"
        },
        "date": 1712797289419,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 188453,
            "range": "±1.91%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187504,
            "range": "±1.93%",
            "unit": "ops/sec",
            "extra": "222 samples"
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
          "id": "f5cae2b0cd468f0816667b171c9476bf9fa4c223",
          "message": "Angular17 standalone sample app (#7017)\n\nAdds Angular 17 sample that uses MSAL Angular v3 to\r\nmsal-angular-v3-samples.\r\n\r\nNote: Documentation update for Angular 17 support is in PR #7018",
          "timestamp": "2024-04-11T12:53:40-07:00",
          "tree_id": "bac825ef92181a648156ba0cdfc4120647b7a433",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/f5cae2b0cd468f0816667b171c9476bf9fa4c223"
        },
        "date": 1712865547839,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 183665,
            "range": "±2.26%",
            "unit": "ops/sec",
            "extra": "219 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 190314,
            "range": "±2.01%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "1549ef7bde5a8ffe0c15024bba5169030a422a64",
          "message": "Angular 17 support docs update (#7018)\n\nMSAL Angular documentation update for Angular 17.\r\n\r\nThis PR follows and should be merged after #7017",
          "timestamp": "2024-04-11T13:00:07-07:00",
          "tree_id": "900cf828aaa6340da7aac7c90826232e321d1d39",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/1549ef7bde5a8ffe0c15024bba5169030a422a64"
        },
        "date": 1712865928804,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 194982,
            "range": "±2.17%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 193131,
            "range": "±2.12%",
            "unit": "ops/sec",
            "extra": "210 samples"
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
          "id": "aa362f666894d291bf62a53e9d6ab12a4852b60c",
          "message": "Bump package versions",
          "timestamp": "2024-04-11T21:47:01Z",
          "tree_id": "6690055ceebb325dee54c0b4907076f48a5922cf",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/aa362f666894d291bf62a53e9d6ab12a4852b60c"
        },
        "date": 1712872348511,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 206639,
            "range": "±2.09%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 194055,
            "range": "±2.05%",
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
          "id": "a434d77b2adbb4e191264d35bd764185feb8ff7a",
          "message": "Instrument server error number (#7036)\n\n- Instrument server error number.",
          "timestamp": "2024-04-18T17:53:43-04:00",
          "tree_id": "d2f0d69c775a3c9fd9533f32c93c6afb968b8bb9",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/a434d77b2adbb4e191264d35bd764185feb8ff7a"
        },
        "date": 1713477548519,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 214484,
            "range": "±1.36%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 194811,
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
          "id": "ad8a43f1e3a263b5228e6d09575be48910ff57ca",
          "message": "Bump peaceiris/actions-gh-pages from 3 to 4 (#7028)\n\nBumps\r\n[peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages)\r\nfrom 3 to 4.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/releases\">peaceiris/actions-gh-pages's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>actions-github-pages v4.0.0</h2>\r\n<p>See <a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/blob/v4.0.0/CHANGELOG.md\">CHANGELOG.md</a>\r\nfor more details.</p>\r\n<h2>actions-github-pages v3.9.3</h2>\r\n<p>See <a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/blob/v3.9.3/CHANGELOG.md\">CHANGELOG.md</a>\r\nfor more details.</p>\r\n<h2>actions-github-pages v3.9.2</h2>\r\n<p>See <a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/blob/v3.9.2/CHANGELOG.md\">CHANGELOG.md</a>\r\nfor more details.</p>\r\n<h2>actions-github-pages v3.9.1</h2>\r\n<ul>\r\n<li>update deps</li>\r\n</ul>\r\n<p>See <a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/blob/v3.9.1/CHANGELOG.md\">CHANGELOG.md</a>\r\nfor more details.</p>\r\n<h2>actions-github-pages v3.9.0</h2>\r\n<ul>\r\n<li>deps: bump node12 to node16</li>\r\n<li>deps: bump <code>@​actions/core</code> from 1.6.0 to 1.10.0</li>\r\n</ul>\r\n<p>See <a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/blob/v3.9.0/CHANGELOG.md\">CHANGELOG.md</a>\r\nfor more details.</p>\r\n<h2>actions-github-pages v3.8.0</h2>\r\n<p>See <a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/blob/v3.8.0/CHANGELOG.md\">CHANGELOG.md</a>\r\nfor more details.</p>\r\n<h2>actions-github-pages v3.7.3</h2>\r\n<p>See <a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/blob/v3.7.3/CHANGELOG.md\">CHANGELOG.md</a>\r\nfor more details.</p>\r\n<h2>actions-github-pages v3.7.2</h2>\r\n<p>See <a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/blob/v3.7.2/CHANGELOG.md\">CHANGELOG.md</a>\r\nfor more details.</p>\r\n<h2>actions-github-pages v3.7.1</h2>\r\n<p>See <a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/blob/v3.7.1/CHANGELOG.md\">CHANGELOG.md</a>\r\nfor more details.</p>\r\n<h2>actions-github-pages v3.7.0</h2>\r\n<p>See <a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/blob/v3.7.0/CHANGELOG.md\">CHANGELOG.md</a>\r\nfor more details.</p>\r\n<p>Overviews:</p>\r\n<ul>\r\n<li>Add .nojekyll file by default for all branches (<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/438\">#438</a>)\r\n(079d483), closes <a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/438\">#438</a></li>\r\n<li>Add destination_dir option (<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/403\">#403</a>)\r\n(f30118c), closes <a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/403\">#403</a>\r\n<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/324\">#324</a>\r\n<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/390\">#390</a></li>\r\n<li>Add exclude_assets option (<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/416\">#416</a>)\r\n(0f5c65e), closes <a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/416\">#416</a>\r\n<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/163\">#163</a></li>\r\n<li>exclude_assets supports glob patterns (<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/417\">#417</a>)\r\n(6f45501), closes <a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/417\">#417</a>\r\n<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/163\">#163</a></li>\r\n</ul>\r\n<h2>actions-github-pages v3.6.4</h2>\r\n<p>See <a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/blob/v3.6.4/CHANGELOG.md\">CHANGELOG.md</a>\r\nfor more details.</p>\r\n<h2>actions-github-pages v3.6.3</h2>\r\n<p>See <a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/blob/v3.6.3/CHANGELOG.md\">CHANGELOG.md</a>\r\nfor more details.</p>\r\n<h2>actions-github-pages v3.6.2</h2>\r\n<p>See <a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/blob/v3.6.2/CHANGELOG.md\">CHANGELOG.md</a>\r\nfor more details.</p>\r\n<!-- raw HTML omitted -->\r\n</blockquote>\r\n<p>... (truncated)</p>\r\n</details>\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/blob/main/CHANGELOG.md\">peaceiris/actions-gh-pages's\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h2><a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/compare/v3.9.2...v3.9.3\">3.9.3</a>\r\n(2023-03-30)</h2>\r\n<h3>docs</h3>\r\n<ul>\r\n<li>fix typo, bump hugo version (<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/851\">#851</a>)\r\n(<a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/884a0224fd48faeb3bde89519e9d612d0585a679\">884a022</a>),\r\ncloses <a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/851\">#851</a></li>\r\n</ul>\r\n<h3>fix</h3>\r\n<ul>\r\n<li>fix error handling (<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/841\">#841</a>)\r\n(<a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/32e33dcd3ae1d0cf56ac5a88267de6cbf0359353\">32e33dc</a>),\r\ncloses <a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/841\">#841</a></li>\r\n<li>update known_hosts (<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/871\">#871</a>)\r\n(<a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/31c15f03292ac100ae41a50fd3055e00d1b11a32\">31c15f0</a>),\r\ncloses <a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/871\">#871</a></li>\r\n</ul>\r\n<h2><a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/compare/v3.9.1...v3.9.2\">3.9.2</a>\r\n(2023-01-17)</h2>\r\n<h3>chore</h3>\r\n<ul>\r\n<li>rename cicd (<a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/32c9288f553bbcbf66869cf553c82754431faf03\">32c9288</a>)</li>\r\n<li>replace npm ci with install (<a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/983978086a87d25a1ff678aa1ef4c2acc413784a\">9839780</a>)</li>\r\n</ul>\r\n<h3>ci</h3>\r\n<ul>\r\n<li>add github-actions npm (<a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/5e5dc6d02eeb18001e0a7af6d6fcbabd4fd9e2b7\">5e5dc6d</a>)</li>\r\n<li>enable automerge (<a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/dd7d77895818fd15ebecf20b6bf76028d377e1b6\">dd7d778</a>)</li>\r\n<li>remove dependabot (<a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/7af79a873e9c2b6c37690db94012342fdb90914a\">7af79a8</a>)</li>\r\n<li>remove enabledManagers (<a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/cba22ba760f1c7e62c9ae43167ea68ca9de56506\">cba22ba</a>)</li>\r\n<li>use peaceiris/workflows/setup-node 0.19.1 (<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/818\">#818</a>)\r\n(<a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/416f539fb4263ec46f9bbee251e87cfeae9f85ff\">416f539</a>),\r\ncloses <a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/818\">#818</a></li>\r\n</ul>\r\n<h3>deps</h3>\r\n<ul>\r\n<li>apply npm audit fix (<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/809\">#809</a>)\r\n(<a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/e3aa46d23bbf7f669a6d92c15dda089b2edf4959\">e3aa46d</a>),\r\ncloses <a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/809\">#809</a></li>\r\n</ul>\r\n<h2><a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/compare/v3.9.0...v3.9.1\">3.9.1</a>\r\n(2023-01-05)</h2>\r\n<h3>chore</h3>\r\n<ul>\r\n<li>change cicd label name (<a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/180896524151a5634ff5815a72c59467fc27c874\">1808965</a>)</li>\r\n</ul>\r\n<h3>ci</h3>\r\n<ul>\r\n<li>add Renovate config (<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/802\">#802</a>)\r\n(<a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/072d16c439270cd3a36c3e0977ccbe10f2b2bc55\">072d16c</a>),\r\ncloses <a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/802\">#802</a></li>\r\n<li>bump actions/dependency-review-action from 2 to 3 (<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/799\">#799</a>)\r\n(<a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/e3b45f27007dc55bcdd52f01e38af6f61576ec7f\">e3b45f2</a>),\r\ncloses <a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/799\">#799</a></li>\r\n<li>bump peaceiris/actions-github-app-token from 1.1.4 to 1.1.5 (<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/798\">#798</a>)\r\n(<a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/a5f971f112fd50b6dd28469f23be2618b1ea87e7\">a5f971f</a>),\r\ncloses <a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/798\">#798</a></li>\r\n<li>bump peaceiris/actions-mdbook from 1.1.14 to 1.2.0 (<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/793\">#793</a>)\r\n(<a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/9af6a68dde7720af8fd55364c2c637ca5922a879\">9af6a68</a>),\r\ncloses <a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/793\">#793</a></li>\r\n<li>bump peaceiris/workflows from 0.17.1 to 0.17.2 (<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/794\">#794</a>)\r\n(<a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/087a759f907a127fdee23c8994321ff96f7d9430\">087a759</a>),\r\ncloses <a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/794\">#794</a></li>\r\n</ul>\r\n<!-- raw HTML omitted -->\r\n</blockquote>\r\n<p>... (truncated)</p>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/4f9cc6602d3f66b9c108549d475ec49e8ef4d45e\"><code>4f9cc66</code></a>\r\nchore(release): 4.0.0</li>\r\n<li><a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/9c75028a530dcac84f98f83ac112b3ecc5eec533\"><code>9c75028</code></a>\r\nchore(release): Add build assets</li>\r\n<li><a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/5049354438ced05ab8a5da89ef20fd8efff107c7\"><code>5049354</code></a>\r\nbuild: node 20.11.1</li>\r\n<li><a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/4eb285e828117bca26638192c3ed309c622e7bad\"><code>4eb285e</code></a>\r\nchore: bump node16 to node20 (<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/1067\">#1067</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/cdc09a3baa7eac9b40de1dfa92172d75ca5bca5a\"><code>cdc09a3</code></a>\r\nchore(deps): update dependency <code>@​types/node</code> to v16.18.77\r\n(<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/1065\">#1065</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/d830378ec6ffd7f902a3427b78b7941511f64de3\"><code>d830378</code></a>\r\nchore(deps): update dependency <code>@​types/node</code> to v16.18.76\r\n(<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/1063\">#1063</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/80daa1d14446ef560c4b984b37ac7668a7db0ab4\"><code>80daa1d</code></a>\r\nchore(deps): update dependency <code>@​types/node</code> to v16.18.75\r\n(<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/1061\">#1061</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/108285e909b33bc551c67972cdbdbee53b17a112\"><code>108285e</code></a>\r\nchore(deps): update dependency ts-jest to v29.1.2 (<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/1060\">#1060</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/99c95ff54e31aa8b98a1f45d98910a945931c89c\"><code>99c95ff</code></a>\r\nchore(deps): update dependency <code>@​types/node</code> to v16.18.74\r\n(<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/1058\">#1058</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/commit/1f4653792dc64b25bbf4a3490ae085a487673e55\"><code>1f46537</code></a>\r\nchore(deps): update dependency <code>@​types/node</code> to v16.18.73\r\n(<a\r\nhref=\"https://redirect.github.com/peaceiris/actions-gh-pages/issues/1057\">#1057</a>)</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/peaceiris/actions-gh-pages/compare/v3...v4\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=peaceiris/actions-gh-pages&package-manager=github_actions&previous-version=3&new-version=4)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\n\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-04-19T10:46:24-07:00",
          "tree_id": "7b19ff63743e991de82a933f40f79b8e9711ee12",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/ad8a43f1e3a263b5228e6d09575be48910ff57ca"
        },
        "date": 1713549107246,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 191088,
            "range": "±2.08%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 188692,
            "range": "±1.93%",
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
          "id": "0b7c43af82b5ee92143d5775e3cb610340c4bced",
          "message": "Instrument scenario id for tracking custom user prompts (#7043)\n\nInstrument scenario id for tracking custom user prompts",
          "timestamp": "2024-04-22T11:55:32-04:00",
          "tree_id": "23db676bc9984653206e32dfbb31706faa75da42",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/0b7c43af82b5ee92143d5775e3cb610340c4bced"
        },
        "date": 1713801660693,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 189589,
            "range": "±2.03%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 193629,
            "range": "±2.01%",
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
          "id": "fe55e4c5ce500f008e033065ee05055a03c6bd1e",
          "message": "Bump gh-pages from 3.2.3 to 5.0.0 (#7051)\n\nBumps [gh-pages](https://github.com/tschaub/gh-pages) from 3.2.3 to\r\n5.0.0.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/tschaub/gh-pages/releases\">gh-pages's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>v5.0.0</h2>\r\n<p>Potentially breaking change: the <code>publish</code> method now\r\nalways returns a promise. Previously, it did not return a promise in\r\nsome error cases. This should not impact most users.</p>\r\n<p>Updates to the development dependencies required a minimum Node\r\nversion of 14 for the tests. The library should still work on Node 12,\r\nbut tests are no longer run in CI for version 12. A future major version\r\nof the library may drop support for version 12 altogether.</p>\r\n<h2>What's Changed</h2>\r\n<ul>\r\n<li>Assorted updates by <a\r\nhref=\"https://github.com/tschaub\"><code>@​tschaub</code></a> in <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/452\">tschaub/gh-pages#452</a></li>\r\n<li>Update README to clarify project site configuration requirements\r\nwith tools like CRA, webpack, Vite, etc. by <a\r\nhref=\"https://github.com/Nezteb\"><code>@​Nezteb</code></a> in <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/445\">tschaub/gh-pages#445</a></li>\r\n<li>Bump actions/checkout from 2 to 3 by <a\r\nhref=\"https://github.com/dependabot\"><code>@​dependabot</code></a> in <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/453\">tschaub/gh-pages#453</a></li>\r\n<li>Bump actions/setup-node from 1 to 3 by <a\r\nhref=\"https://github.com/dependabot\"><code>@​dependabot</code></a> in <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/455\">tschaub/gh-pages#455</a></li>\r\n<li>Bump email-addresses from 3.0.1 to 5.0.0 by <a\r\nhref=\"https://github.com/dependabot\"><code>@​dependabot</code></a> in <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/454\">tschaub/gh-pages#454</a></li>\r\n<li>Bump async from 2.6.4 to 3.2.4 by <a\r\nhref=\"https://github.com/dependabot\"><code>@​dependabot</code></a> in <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/459\">tschaub/gh-pages#459</a></li>\r\n<li>Remove quotation marks by <a\r\nhref=\"https://github.com/Vicropht\"><code>@​Vicropht</code></a> in <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/438\">tschaub/gh-pages#438</a></li>\r\n</ul>\r\n<h2>New Contributors</h2>\r\n<ul>\r\n<li><a href=\"https://github.com/Nezteb\"><code>@​Nezteb</code></a> made\r\ntheir first contribution in <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/445\">tschaub/gh-pages#445</a></li>\r\n<li><a href=\"https://github.com/Vicropht\"><code>@​Vicropht</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/438\">tschaub/gh-pages#438</a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/tschaub/gh-pages/compare/v4.0.0...v5.0.0\">https://github.com/tschaub/gh-pages/compare/v4.0.0...v5.0.0</a></p>\r\n<h2>v4.0.0</h2>\r\n<p>This release doesn't include any breaking changes, but due to updated\r\ndevelopment dependencies, tests are no longer run on Node 10.</p>\r\n<h2>What's Changed</h2>\r\n<ul>\r\n<li>Bump minimist from 1.2.5 to 1.2.6 by <a\r\nhref=\"https://github.com/dependabot\"><code>@​dependabot</code></a> in <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/423\">tschaub/gh-pages#423</a></li>\r\n<li>Bump async from 2.6.1 to 2.6.4 by <a\r\nhref=\"https://github.com/dependabot\"><code>@​dependabot</code></a> in <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/427\">tschaub/gh-pages#427</a></li>\r\n<li>Bump path-parse from 1.0.6 to 1.0.7 by <a\r\nhref=\"https://github.com/dependabot\"><code>@​dependabot</code></a> in <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/431\">tschaub/gh-pages#431</a></li>\r\n<li>Bump ansi-regex from 3.0.0 to 3.0.1 by <a\r\nhref=\"https://github.com/dependabot\"><code>@​dependabot</code></a> in <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/430\">tschaub/gh-pages#430</a></li>\r\n<li>Updated dev dependencies and formatting by <a\r\nhref=\"https://github.com/tschaub\"><code>@​tschaub</code></a> in <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/432\">tschaub/gh-pages#432</a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/tschaub/gh-pages/compare/v3.2.3...v4.0.0\">https://github.com/tschaub/gh-pages/compare/v3.2.3...v4.0.0</a></p>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/tschaub/gh-pages/blob/main/changelog.md\">gh-pages's\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h2>v5.0.0</h2>\r\n<p>Potentially breaking change: the <code>publish</code> method now\r\nalways returns a promise. Previously, it did not return a promise in\r\nsome error cases. This should not impact most users.</p>\r\n<p>Updates to the development dependencies required a minimum Node\r\nversion of 14 for the tests. The library should still work on Node 12,\r\nbut tests are no longer run in CI for version 12. A future major version\r\nof the library may drop support for version 12 altogether.</p>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/438\">#438</a> -\r\nRemove quotation marks (<a\r\nhref=\"https://github.com/Vicropht\"><code>@​Vicropht</code></a>)</li>\r\n<li><a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/459\">#459</a> -\r\nBump async from 2.6.4 to 3.2.4 (<a\r\nhref=\"https://github.com/tschaub\"><code>@​tschaub</code></a>)</li>\r\n<li><a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/454\">#454</a> -\r\nBump email-addresses from 3.0.1 to 5.0.0 (<a\r\nhref=\"https://github.com/tschaub\"><code>@​tschaub</code></a>)</li>\r\n<li><a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/455\">#455</a> -\r\nBump actions/setup-node from 1 to 3 (<a\r\nhref=\"https://github.com/tschaub\"><code>@​tschaub</code></a>)</li>\r\n<li><a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/453\">#453</a> -\r\nBump actions/checkout from 2 to 3 (<a\r\nhref=\"https://github.com/tschaub\"><code>@​tschaub</code></a>)</li>\r\n<li><a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/445\">#445</a> -\r\nUpdate README to clarify project site configuration requirements with\r\ntools like CRA, webpack, Vite, etc. (<a\r\nhref=\"https://github.com/Nezteb\"><code>@​Nezteb</code></a>)</li>\r\n<li><a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/452\">#452</a> -\r\nAssorted updates (<a\r\nhref=\"https://github.com/tschaub\"><code>@​tschaub</code></a>)</li>\r\n</ul>\r\n<h2>v4.0.0</h2>\r\n<p>This release doesn't include any breaking changes, but due to updated\r\ndevelopment dependencies, tests are no longer run on Node 10.</p>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/432\">#432</a> -\r\nUpdated dev dependencies and formatting (<a\r\nhref=\"https://github.com/tschaub\"><code>@​tschaub</code></a>)</li>\r\n<li><a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/430\">#430</a> -\r\nBump ansi-regex from 3.0.0 to 3.0.1 (<a\r\nhref=\"https://github.com/tschaub\"><code>@​tschaub</code></a>)</li>\r\n<li><a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/431\">#431</a> -\r\nBump path-parse from 1.0.6 to 1.0.7 (<a\r\nhref=\"https://github.com/tschaub\"><code>@​tschaub</code></a>)</li>\r\n<li><a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/427\">#427</a> -\r\nBump async from 2.6.1 to 2.6.4 (<a\r\nhref=\"https://github.com/tschaub\"><code>@​tschaub</code></a>)</li>\r\n<li><a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/pull/423\">#423</a> -\r\nBump minimist from 1.2.5 to 1.2.6 (<a\r\nhref=\"https://github.com/tschaub\"><code>@​tschaub</code></a>)</li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/tschaub/gh-pages/commit/f729b97ab9b60121ff36853bfcfd6d716f43ac69\"><code>f729b97</code></a>\r\n5.0.0</li>\r\n<li><a\r\nhref=\"https://github.com/tschaub/gh-pages/commit/51534c798c20449826abebb0bd58b9e9ab04e20e\"><code>51534c7</code></a>\r\nLog changes</li>\r\n<li><a\r\nhref=\"https://github.com/tschaub/gh-pages/commit/ace063b81fd3e74467671749c0e60ece1601f292\"><code>ace063b</code></a>\r\nMerge pull request <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/issues/438\">#438</a>\r\nfrom Vicropht/patch-1</li>\r\n<li><a\r\nhref=\"https://github.com/tschaub/gh-pages/commit/58e54be6248d33a283ddb5c6b335d342424956cc\"><code>58e54be</code></a>\r\nMerge pull request <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/issues/459\">#459</a>\r\nfrom tschaub/dependabot/npm_and_yarn/async-3.2.4</li>\r\n<li><a\r\nhref=\"https://github.com/tschaub/gh-pages/commit/2189df392e42e4fa5c4a5f2b9978d068adf084b0\"><code>2189df3</code></a>\r\nBump async from 2.6.4 to 3.2.4</li>\r\n<li><a\r\nhref=\"https://github.com/tschaub/gh-pages/commit/051846ed1c1ce657549170f985bbd0d1975b6a9f\"><code>051846e</code></a>\r\nMerge pull request <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/issues/454\">#454</a>\r\nfrom tschaub/dependabot/npm_and_yarn/email-addresses-...</li>\r\n<li><a\r\nhref=\"https://github.com/tschaub/gh-pages/commit/5c91c678c510b1f232e3c81753103d10f415431c\"><code>5c91c67</code></a>\r\nMerge pull request <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/issues/455\">#455</a>\r\nfrom tschaub/dependabot/github_actions/actions/setup-...</li>\r\n<li><a\r\nhref=\"https://github.com/tschaub/gh-pages/commit/fe0ad832548b3042814e53c9fe7417c32474da20\"><code>fe0ad83</code></a>\r\nMerge pull request <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/issues/453\">#453</a>\r\nfrom tschaub/dependabot/github_actions/actions/checko...</li>\r\n<li><a\r\nhref=\"https://github.com/tschaub/gh-pages/commit/b89287d04677be890a09ac4a699876e5884e245a\"><code>b89287d</code></a>\r\nMerge pull request <a\r\nhref=\"https://redirect.github.com/tschaub/gh-pages/issues/445\">#445</a>\r\nfrom Nezteb/patch-1</li>\r\n<li><a\r\nhref=\"https://github.com/tschaub/gh-pages/commit/e890bd180ca99287f3be62033c64904a5bf39e7a\"><code>e890bd1</code></a>\r\nBump email-addresses from 3.0.1 to 5.0.0</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/tschaub/gh-pages/compare/v3.2.3...v5.0.0\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=gh-pages&package-manager=npm_and_yarn&previous-version=3.2.3&new-version=5.0.0)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-04-23T08:59:26-07:00",
          "tree_id": "3f6f5ccd30dd11d5c04e12b5bb95399137ad32c7",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/fe55e4c5ce500f008e033065ee05055a03c6bd1e"
        },
        "date": 1713888287589,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 188198,
            "range": "±1.93%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 196246,
            "range": "±2.02%",
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
          "id": "236cc4acb053662e108d4c6fa68b873dd1fa7ecc",
          "message": "Managed Identity Documentation Updates (#7035)\n\nUpdated managed identity docs now that the feature is out of alpha and\r\nis available in msal-node v 2.7.0.",
          "timestamp": "2024-04-23T13:52:18-04:00",
          "tree_id": "c217b58b8f92a155638b82f832f5f796d70e6da8",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/236cc4acb053662e108d4c6fa68b873dd1fa7ecc"
        },
        "date": 1713895073854,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 192930,
            "range": "±2.05%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 220642,
            "range": "±0.81%",
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
          "id": "23df98f6747f47f9ba1bb458feba9f183f4a902c",
          "message": "Instrument account type (#7049)\n\n- Instrument account type\r\n- Fix acquireTokenByCode native flow instrumentation",
          "timestamp": "2024-04-23T14:40:57-04:00",
          "tree_id": "f7ef34398acc317e9b876acc54c2f95d18858b6e",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/23df98f6747f47f9ba1bb458feba9f183f4a902c"
        },
        "date": 1713897988421,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 195680,
            "range": "±2.05%",
            "unit": "ops/sec",
            "extra": "224 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 195384,
            "range": "±2.10%",
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
          "id": "c48651089bd476cf44029985eb8bcbb74ad08494",
          "message": "Remove msal-angular2 references (#7054)\n\nThis PR removes references to `msal-angular2` app client ID in docs and\r\nunit tests, replaces with client Id currently used in samples.",
          "timestamp": "2024-04-24T10:04:09-07:00",
          "tree_id": "71678d252670f5d6e1dfbf750068501120c0d8f8",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/c48651089bd476cf44029985eb8bcbb74ad08494"
        },
        "date": 1713978571384,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190997,
            "range": "±1.92%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 195095,
            "range": "±2.03%",
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
          "id": "83747f017257f0625db08bb1e63ada421cc70ac5",
          "message": "Discard empty redirect telemetry events with no error codes (#7058)\n\n- Discard empty redirect telemetry events with no error codes. \r\n- Replace performanceClient with parentMeasurement param to track child\r\nerrors without throwing.",
          "timestamp": "2024-04-26T08:11:22-04:00",
          "tree_id": "05eb2c9617c75119b15cdbb69bfa1f5594a03a7e",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/83747f017257f0625db08bb1e63ada421cc70ac5"
        },
        "date": 1714133816747,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 193078,
            "range": "±1.96%",
            "unit": "ops/sec",
            "extra": "224 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 198528,
            "range": "±2.07%",
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
          "id": "31a7001dc11e9ab9302d8500e8e96779801aad32",
          "message": "Make performanceClient.discardMeasurements() flush aux cache data in addition to measurements (#7061)\n\n- Make `performanceClient.discardMeasurements()` flush aux cache data in\r\naddition to measurements.",
          "timestamp": "2024-04-26T14:52:34-04:00",
          "tree_id": "b48287d9730fc75ecc4138a581aa151c44e086f8",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/31a7001dc11e9ab9302d8500e8e96779801aad32"
        },
        "date": 1714157877789,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 193647,
            "range": "±2.05%",
            "unit": "ops/sec",
            "extra": "217 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 192861,
            "range": "±2.07%",
            "unit": "ops/sec",
            "extra": "217 samples"
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
          "id": "869336ff5f3890fba8563dfa981d87f583c6cd17",
          "message": "Add cache_quota_exceeded error info to errors.md (#7062)\n\nAdd cache_quota_exceeded error info to errors.md",
          "timestamp": "2024-04-26T17:12:42-04:00",
          "tree_id": "dcab6654df4ec158a2959cde586736db85b3daba",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/869336ff5f3890fba8563dfa981d87f583c6cd17"
        },
        "date": 1714166290070,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 194987,
            "range": "±2.08%",
            "unit": "ops/sec",
            "extra": "215 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 192837,
            "range": "±2.05%",
            "unit": "ops/sec",
            "extra": "228 samples"
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
          "id": "8242d67cec8499154bf94a13926b285e495e6752",
          "message": "Add getAccount API to IPublicClientApplication (#7019)\n\nAdd getAccount(accountFilter: AccountFilter) API to\r\nIPublicClientApplication so that it can be called by the PCA returned\r\nfrom PublicClientNext.createPublicClientApplication.",
          "timestamp": "2024-04-26T14:51:36-07:00",
          "tree_id": "de53512e8917f76b59cd4f1c7491cf37b53213ae",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/8242d67cec8499154bf94a13926b285e495e6752"
        },
        "date": 1714168636137,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 213594,
            "range": "±1.98%",
            "unit": "ops/sec",
            "extra": "226 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 194388,
            "range": "±2.18%",
            "unit": "ops/sec",
            "extra": "228 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "91503387+hatched-kade@users.noreply.github.com",
            "name": "Kade Keith",
            "username": "hatched-kade"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "c244947a022c90fbc055b5d1c9c5a98aea181110",
          "message": "Fix `useIsAuthenticated` hook briefly returning false even though the user is authenticated (#7057)\n\nAddresses\r\nhttps://github.com/AzureAD/microsoft-authentication-library-for-js/issues/6918\r\n\r\nThe current `useIsAuthenticated` has an unnecessary `useEffect`, which\r\ncauses it to briefly return `false` in some cases even when an account\r\nis present. See\r\nhttps://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state\r\nand\r\nhttps://react.dev/learn/you-might-not-need-an-effect#caching-expensive-calculations\r\n\r\nThis PR switches to use the `useMemo` recommendation\r\n\r\nI added a unit test that passes now, but fails with the old\r\nimplementation:\r\n```\r\n FAIL  test/hooks/useIsAuthenticated.spec.tsx\r\n  ● withMsal tests › useAuthenticated always returns true if user has an account\r\n\r\n    expect(jest.fn()).toHaveBeenCalledTimes(expected)\r\n\r\n    Expected number of calls: 0\r\n    Received number of calls: 1\r\n\r\n      78 |         expect(await screen.findByText(\"Has accounts\")).toBeInTheDocument();\r\n      79 |         expect(await screen.findByText(\"Is authed\")).toBeInTheDocument();\r\n    > 80 |         expect(invalidAuthStateCallback).toHaveBeenCalledTimes(0);\r\n         |                                          ^\r\n      81 |     });\r\n      82 | });\r\n      83 |\r\n\r\n      at Object.<anonymous> (test/hooks/useIsAuthenticated.spec.tsx:80:42)\r\n```\r\n\r\nI also had to tweak some act / await / async code in other tests,\r\npresumably because now it takes fewer renders for the hook to start\r\nreturning the correct value. Without the tweaks a couple tests were\r\nfailing, and others printed warning about updating state outside of an\r\n`act(...)`.\r\n\r\n---------\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>\r\nCo-authored-by: Jo Arroyo <joarroyo@microsoft.com>",
          "timestamp": "2024-04-26T15:32:09-07:00",
          "tree_id": "4f3ff92a31df4c6b3aa2046dba18dc7ae8c50c6a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/c244947a022c90fbc055b5d1c9c5a98aea181110"
        },
        "date": 1714171063182,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 196544,
            "range": "±2.11%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 194077,
            "range": "±2.14%",
            "unit": "ops/sec",
            "extra": "226 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "51962150+alexqbm@users.noreply.github.com",
            "name": "alexqbm",
            "username": "alexqbm"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "b2bd5ce0ec4545663d93d3083ad284228dd711d3",
          "message": "Add the protocolMode property to the configuration.md code example. (#7053)\n\nIt was missing from the code example.\r\n\r\n---------\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-04-26T15:33:26-07:00",
          "tree_id": "9d2a5bd54809d6c0b5f92c412a789313ef9e5cd7",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/b2bd5ce0ec4545663d93d3083ad284228dd711d3"
        },
        "date": 1714171132957,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 200243,
            "range": "±2.18%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 192775,
            "range": "±1.97%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "b4736b139d70b0b030a0c6b18f78dea4bbbaf2ab",
          "message": "MSAL-Node NetworkModule: Fixed inconsistencies with cancellationToken (timeout) (#7001)\n\n- renamed cancellationToken to timeout\r\n- it can only be used in get requests (region discovery, for example)\r\n- it's not part of the public api",
          "timestamp": "2024-04-29T12:04:50-04:00",
          "tree_id": "b338adf44bc0b8fa0db5afca3c101bf777b8074a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/b4736b139d70b0b030a0c6b18f78dea4bbbaf2ab"
        },
        "date": 1714407011883,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190475,
            "range": "±1.82%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 203766,
            "range": "±2.00%",
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
          "id": "a8f4145661c37ca0673d67451cbf8e9935b4e10b",
          "message": "Add node 22 to e2e test matrix (#7060)\n\n- Adds Node 22 to E2E test matrix\r\n- Updates Readme to declare support for Node 22",
          "timestamp": "2024-04-29T12:50:15-07:00",
          "tree_id": "def678064875992c308980b6f3338830c9b2cb62",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/a8f4145661c37ca0673d67451cbf8e9935b4e10b"
        },
        "date": 1714420543459,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 196544,
            "range": "±2.09%",
            "unit": "ops/sec",
            "extra": "224 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 216911,
            "range": "±1.78%",
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
          "id": "23280a4852a6b978549ec8641997ef471470944b",
          "message": "Export invoke and invokeAsync functions (#7065)\n\n- Export invoke and invokeAsync functions.",
          "timestamp": "2024-04-30T09:05:14-04:00",
          "tree_id": "ea4486f524a9eb5177ab34ef1b2d842b32ff052a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/23280a4852a6b978549ec8641997ef471470944b"
        },
        "date": 1714482652062,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 205596,
            "range": "±1.70%",
            "unit": "ops/sec",
            "extra": "226 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 184495,
            "range": "±2.08%",
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
          "id": "9d7cdecd2388c6cdcd37c2950bf969bc65b8bb08",
          "message": "Add additional logging for NAA initialization (#7064)\n\nAdd additional logging for NAA initialization to help diagnose if\r\nNestAppAuthController is being used for the session, or if it is falling\r\nback to StandardController. Also log exception that occurred in trying\r\nto use Nested App Auth bridge to get further details on failure cases.\r\nThe change also avoids the time spent trying to initialize the bridge if\r\ncaller does not opt-in to supportsNestedAppAuth.",
          "timestamp": "2024-04-30T10:54:12-07:00",
          "tree_id": "71ccee2b8fdc2b043c87a5f22bce17b12ad7add7",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/9d7cdecd2388c6cdcd37c2950bf969bc65b8bb08"
        },
        "date": 1714499977172,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 192084,
            "range": "±1.93%",
            "unit": "ops/sec",
            "extra": "224 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 198864,
            "range": "±2.13%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "1c72e3fcc14341d79d817f349c3e8b1ffa893095",
          "message": "Removed Managed Identity Resource URI Validation (#7059)\n\nRemoved Managed Identity Resource URI Validation. URI's can start with\r\nstrings other than \"https\". \"api://\", for example.\r\n\r\nAfter a discussion with Bogdan, we decided it would be best to remove\r\nthis validation entirely.",
          "timestamp": "2024-04-30T15:07:10-04:00",
          "tree_id": "20cd2e634dd33c00be2e601bcc91f1a853177d3d",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/1c72e3fcc14341d79d817f349c3e8b1ffa893095"
        },
        "date": 1714504367598,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 204336,
            "range": "±2.11%",
            "unit": "ops/sec",
            "extra": "224 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 202335,
            "range": "±2.06%",
            "unit": "ops/sec",
            "extra": "227 samples"
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
          "id": "37633b4245130d70a39c0a4e043c5f8a84eaf2d4",
          "message": "ClientCredential and OBO acquireToken requests with claims will now skip the cache (#6999)\n\nClientCredential and OBO acquireToken requests with claims will now skip\r\nthe cache.\r\n\r\nclaimsBasedCachingEnabled has been marked as deprecated in msal-node.",
          "timestamp": "2024-04-30T16:20:43-04:00",
          "tree_id": "3326cc577500ce0869feef462cae56e7997cb7bb",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/37633b4245130d70a39c0a4e043c5f8a84eaf2d4"
        },
        "date": 1714508767394,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 211950,
            "range": "±1.39%",
            "unit": "ops/sec",
            "extra": "213 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 215515,
            "range": "±1.26%",
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
          "id": "e6d18c5140359145e0142d4ee4854367fd5da078",
          "message": "Client Assertion implementation now accepts an async callback as well as a string argument (#7014)\n\nClient assertion can currently be provided by a developer as a string.\r\nThis PR allows a developer to provide an async callback (which will\r\nresolve to a string) as the client assertion.\r\n\r\nThe client assertion initialization has been removed from\r\nConfidentialClient's constructor and is now initialized inside of\r\nbuildOauthClientConfiguration, called during every acquireToken call.\r\n\r\nNote: Applied Boy-Scout-Rule on UsernamePasswordClient.spec.ts. Only the\r\nlast test in the file is relevant for this review. Now this test file is\r\nup-to-date and mirrors ClientCredentialsClient.spec.ts and\r\nOnBehalfOfClient.spec.ts.",
          "timestamp": "2024-04-30T17:05:14-04:00",
          "tree_id": "97434a933467d5d4cb32aa09d613b028833805c4",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/e6d18c5140359145e0142d4ee4854367fd5da078"
        },
        "date": 1714511448824,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 193199,
            "range": "±2.10%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 192937,
            "range": "±2.15%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "d6a9dfed07f436831ea370dc1120d7ca090481a6",
          "message": "Managed Identity: ManagedIdentityTokenResponse's expires_in is now calculated correctly (#7070)\n\nManagedIdentityTokenResponse's expires_in is now calculated correctly,\r\nand matches the .net implementation",
          "timestamp": "2024-05-01T11:29:11-04:00",
          "tree_id": "34028c0c2cdba18c1b1fa2c7db113850123388c8",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/d6a9dfed07f436831ea370dc1120d7ca090481a6"
        },
        "date": 1714577668806,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 210992,
            "range": "±1.82%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 218518,
            "range": "±1.62%",
            "unit": "ops/sec",
            "extra": "216 samples"
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
          "id": "d918e4ce974e1c41636df50604a9941fbb4a7ad2",
          "message": "Do not register duplicate performance callbacks (#7069)\n\n- Do not register duplicate performance callbacks",
          "timestamp": "2024-05-01T18:21:46-04:00",
          "tree_id": "eb4b32822eb817bc690e97ca17fb372b4842ed0f",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/d918e4ce974e1c41636df50604a9941fbb4a7ad2"
        },
        "date": 1714602425703,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 199313,
            "range": "±2.18%",
            "unit": "ops/sec",
            "extra": "202 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 210729,
            "range": "±1.93%",
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
          "id": "d556aed39a401d45e45c17cd80f545f7cdc5f115",
          "message": "Bump ejs from 3.1.9 to 3.1.10 (#7074)\n\nBumps [ejs](https://github.com/mde/ejs) from 3.1.9 to 3.1.10.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a href=\"https://github.com/mde/ejs/releases\">ejs's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>v3.1.10</h2>\r\n<p>Version 3.1.10</p>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/mde/ejs/commit/d3f807dea9ce904e20a47a661f2310ce9134dc2a\"><code>d3f807d</code></a>\r\nVersion 3.1.10</li>\r\n<li><a\r\nhref=\"https://github.com/mde/ejs/commit/9ee26dde5d7015d9c0e2ff87314cabeac5247c02\"><code>9ee26dd</code></a>\r\nMocha TDD</li>\r\n<li><a\r\nhref=\"https://github.com/mde/ejs/commit/e469741dca7df2eb400199e1cdb74621e3f89aa5\"><code>e469741</code></a>\r\nBasic pollution protection</li>\r\n<li><a\r\nhref=\"https://github.com/mde/ejs/commit/715e9507fa3e6122dc6430fe0f25a6e6ded300c1\"><code>715e950</code></a>\r\nMerge pull request <a\r\nhref=\"https://redirect.github.com/mde/ejs/issues/756\">#756</a> from\r\nJeffrey-mu/main</li>\r\n<li><a\r\nhref=\"https://github.com/mde/ejs/commit/cabe3146ad964a1e98db7742abf435906ca79406\"><code>cabe314</code></a>\r\nInclude advanced usage examples</li>\r\n<li><a\r\nhref=\"https://github.com/mde/ejs/commit/29b076cdbbf3eb1b4323b33299ab6d79391b2c33\"><code>29b076c</code></a>\r\nAdded header</li>\r\n<li><a\r\nhref=\"https://github.com/mde/ejs/commit/11503c79af882e3635b513d57c7f1813792eb127\"><code>11503c7</code></a>\r\nMerge branch 'main' of github.com:mde/ejs into main</li>\r\n<li><a\r\nhref=\"https://github.com/mde/ejs/commit/7690404e2fc1688756938e4d2fc19e0fac77d736\"><code>7690404</code></a>\r\nAdded security banner to README</li>\r\n<li><a\r\nhref=\"https://github.com/mde/ejs/commit/f47d7aedd51a983e4f73045f962b1209096b5800\"><code>f47d7ae</code></a>\r\nUpdate SECURITY.md</li>\r\n<li><a\r\nhref=\"https://github.com/mde/ejs/commit/828cea1687e3db459ab09d2f405d2444c7580b90\"><code>828cea1</code></a>\r\nUpdate SECURITY.md</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/mde/ejs/compare/v3.1.9...v3.1.10\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=ejs&package-manager=npm_and_yarn&previous-version=3.1.9&new-version=3.1.10)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-05-02T10:52:27-07:00",
          "tree_id": "acef9bbec8ccadfda896cff27f60c6cdd4c3fe2a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/d556aed39a401d45e45c17cd80f545f7cdc5f115"
        },
        "date": 1714672683982,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 189651,
            "range": "±1.89%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 208064,
            "range": "±2.03%",
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
          "id": "e5fa16efec03ddf9ee66ebac83b8a958e5b4a384",
          "message": "Fix uncaught exceptions in acquireTokenSilent (#7073)\n\nA recent change to optimize parallel iframed calls resulted in a\r\nregression that logged an uncaught exception to the console in the event\r\nthat a single iframed call was made and failed. This happened because\r\nthe stored promise rejected and didn't have a catch handler registered\r\nbecause there is not a parallel call dependent on this promise.\r\n\r\nThis PR resolves this issue by ensuring that the stored promise never\r\nrejects but rather resolves with a true/false indicating whether the\r\ncall succeeded or failed.\r\n\r\nFixes #7052",
          "timestamp": "2024-05-03T13:57:41-07:00",
          "tree_id": "0b6e8b3f1ca09be1f8d3f4c729ab369b63bd85ac",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/e5fa16efec03ddf9ee66ebac83b8a958e5b4a384"
        },
        "date": 1714770173809,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 194639,
            "range": "±2.27%",
            "unit": "ops/sec",
            "extra": "208 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 197948,
            "range": "±2.15%",
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
          "id": "8ba150d15e17c27269156c2db3fdef72f90e5301",
          "message": "Bump package versions",
          "timestamp": "2024-05-06T23:48:22Z",
          "tree_id": "bc4e2f7872eac10c063c9c7cdb75b4145259fd4e",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/8ba150d15e17c27269156c2db3fdef72f90e5301"
        },
        "date": 1715039626413,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 191163,
            "range": "±2.08%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 199053,
            "range": "±2.25%",
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
          "id": "63664d968fa7204a1ce60b85f50d2f25eee7cc08",
          "message": "Migrate to Lab Vault Cert for E2E Tests (#7085)\n\nThis PR:\r\n- Adds `3p-e2e.yml` which defines a OneBranch pipeline to run 3P MSAL JS\r\nE2E tests to replace existing GitHub workflows\r\n- Updates `gen_env.sh` to use a new PowerShell script called\r\n`gen_env.ps1` that creates and populates a .env file with E2E Test\r\nenvironment variables (Express session secret, ClientID, TenantID and\r\nthe absolute path of the client certificate used to authenticate with\r\nthe Lab App)\r\n- Updates `e2e-test-utils/LabClient` to use a `CertificateCredential`\r\ninstead of `ClientSecretCredential`\r\n- Updates the `b2c-user-flows` Node sample to use a SESSION_SECRET env\r\nvariable instead of the AZURE_CLIENT_SECRET",
          "timestamp": "2024-05-10T17:24:09-07:00",
          "tree_id": "65422d95031960c20f7d07fe7d403a142d2cf1ac",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/63664d968fa7204a1ce60b85f50d2f25eee7cc08"
        },
        "date": 1715387356816,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 193099,
            "range": "±1.92%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 189620,
            "range": "±2.18%",
            "unit": "ops/sec",
            "extra": "187 samples"
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
          "id": "cacfcbaeae54707565be5e9d6530b3982a7080f8",
          "message": "Fixed bug where dev-provided certificate was not being attached to client assertion (#7088)\n\nFixes [acquireTokenByClientCredential broken for clientCertificate\r\n#7082](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/7082)\r\n\r\nApplied boy-scout-rule to `ConfidentialClientApplication.spec.ts`\r\n(contains unit tests). I've been waiting for a good opportunity to do\r\nthis. The ConfidentialClientApplication tests are now in line with the\r\nother test files: All Managed Identity sources, ClientCredentialClient,\r\nOnBehalfOfClient and UsernamePasswordClient.\r\n\r\nCo-authored-by: @ericcan",
          "timestamp": "2024-05-13T10:10:37-04:00",
          "tree_id": "67aa28b6d589b4b07ea807e838d4e5514ffdeec5",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/cacfcbaeae54707565be5e9d6530b3982a7080f8"
        },
        "date": 1715609768594,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 198161,
            "range": "±2.02%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 216220,
            "range": "±1.84%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "385edb372a14a3691466afbdec036d5b80aa3bed",
          "message": "Fix MSAL Angular samples failure path (#7092)\n\nFixes msal-angular v3 samples to all use the same failure path.",
          "timestamp": "2024-05-13T09:49:28-07:00",
          "tree_id": "9d5a0953c1604b60cb87c631c14aea3d8c47028d",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/385edb372a14a3691466afbdec036d5b80aa3bed"
        },
        "date": 1715619296010,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 207920,
            "range": "±1.67%",
            "unit": "ops/sec",
            "extra": "234 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 213620,
            "range": "±0.87%",
            "unit": "ops/sec",
            "extra": "215 samples"
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
          "id": "20b57f416d3c2f5688e32a867d9c740bd2b8353c",
          "message": "Bump next from 13.5.6 to 14.1.1 (#7089)\n\nBumps [next](https://github.com/vercel/next.js) from 13.5.6 to 14.1.1.\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/5f59ee5f197a09275da7a9fa876986f22f4b7711\"><code>5f59ee5</code></a>\r\nv14.1.1</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/f48b90b162c1a27a1ecaa8ae0a452e0a6605c35f\"><code>f48b90b</code></a>\r\neven more</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/7f789f4a6f6a4f89495c770bed74d5e5d0e01d44\"><code>7f789f4</code></a>\r\nmore timeout</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/ab71c4cf782e13d564f48fe15732b9c42a3f6f36\"><code>ab71c4c</code></a>\r\nupdate timeout</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/75f60d92c43187aa5786f88f0fe4e2bfc7d44c7b\"><code>75f60d9</code></a>\r\nupdate trigger release workflow</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/74b3f0f4f3dcc15f35c9b9956755ca7b7b6a6db5\"><code>74b3f0f</code></a>\r\nServer Action tests (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/62655\">#62655</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/a6946b69ccb268015887ea6d6ef39f262e5636b1\"><code>a6946b6</code></a>\r\nBackport metadata fixes (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/62663\">#62663</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/4002f4b33c5a42166e5ad5f9ff4f879195aeb852\"><code>4002f4b</code></a>\r\nFix draft mode invariant (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/62121\">#62121</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/7dbf6f8298daea8e8c5198e9a4e7e758da665a6d\"><code>7dbf6f8</code></a>\r\nfix: babel usage with next/image (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/61835\">#61835</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/3efc842a0a30ffd3a991e45736ac615f336d3103\"><code>3efc842</code></a>\r\nFix next/server apit push alias for ESM pkg (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/61721\">#61721</a>)</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/vercel/next.js/compare/v13.5.6...v14.1.1\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=next&package-manager=npm_and_yarn&previous-version=13.5.6&new-version=14.1.1)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>\r\nCo-authored-by: Hector Morales <hemoral@microsoft.com>",
          "timestamp": "2024-05-13T10:58:01-07:00",
          "tree_id": "4cbde102376da0bb3f2f92f054a839a15fd87a64",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/20b57f416d3c2f5688e32a867d9c740bd2b8353c"
        },
        "date": 1715623403839,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 191791,
            "range": "±2.03%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 189660,
            "range": "±1.94%",
            "unit": "ops/sec",
            "extra": "222 samples"
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
          "id": "9c44a61a6065cd114ca4e2a85b3025f0c07480d5",
          "message": "Bumped msal-node version (#7094)\n\nBumped msal-node version for one-off node release",
          "timestamp": "2024-05-13T14:22:17-04:00",
          "tree_id": "2d80630e2eea0ae0d777f756ddc7674ac6ae5658",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/9c44a61a6065cd114ca4e2a85b3025f0c07480d5"
        },
        "date": 1715624884636,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 194404,
            "range": "±2.08%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 205023,
            "range": "±1.89%",
            "unit": "ops/sec",
            "extra": "238 samples"
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
          "id": "ff3615717427433809408444693335b69623f71a",
          "message": "Use Windows for nightly CodeQL build (#7101)\n\nNode-extensions only builds binaries on Windows. Since the CodeQL\r\npipeline is running on ubuntu it is not reporting coverage for the C++\r\nfiles, this PR changes the pipeline to use Windows instead.",
          "timestamp": "2024-05-14T16:24:32-07:00",
          "tree_id": "495b6f95a9e2a86b43598628e7fe11740ef3737c",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/ff3615717427433809408444693335b69623f71a"
        },
        "date": 1715729439186,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 195761,
            "range": "±1.27%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 189067,
            "range": "±1.16%",
            "unit": "ops/sec",
            "extra": "226 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "nonwiz@pm.me",
            "name": "nonwiz",
            "username": "nonwiz"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "7973bf0708612e20ea9b2cc389a730d3e2bb2ca0",
          "message": "Update README file to fix inconsistent variable naming (#7095)\n\npca is used for PublicClientApplication, and cca (which the other doc)\r\nused for ConfidentialClientApplication.",
          "timestamp": "2024-05-15T13:47:21-04:00",
          "tree_id": "a889b831a0d2f1024064545629e3ba2391db0a2a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/7973bf0708612e20ea9b2cc389a730d3e2bb2ca0"
        },
        "date": 1715795575601,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 188170,
            "range": "±2.06%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 207223,
            "range": "±1.67%",
            "unit": "ops/sec",
            "extra": "226 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "44923480+AxharKhan@users.noreply.github.com",
            "name": "Ashar Ali",
            "username": "AxharKhan"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "92e77fa5f4c845998e4a64cb28985f817d50dd9f",
          "message": "Fixed Typo in MSAL-React B2C Sample (#7091)\n\nChanged sing-in to sign-in\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-05-15T10:51:44-07:00",
          "tree_id": "de73268a95fa7c24aa6e48bd144ef6601cd46730",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/92e77fa5f4c845998e4a64cb28985f817d50dd9f"
        },
        "date": 1715795822025,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190628,
            "range": "±1.97%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 196801,
            "range": "±2.19%",
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
          "id": "4009352aa234c569e415ab38e43e36c1f05f14b6",
          "message": "Add API Extractor Build Step (#7097)\n\nThis PR:\r\n- Adds `@microsoft/api-extractor` as a dependency for all packages with\r\nJS public APIs\r\n- Adds `apiExtractor` script to each library's package.json\r\n- Adds API Extractor section to `contributing.md`\r\n- Adds API extractor configuration and initial reports for each library",
          "timestamp": "2024-05-15T11:28:26-07:00",
          "tree_id": "9bda82da4cf38681a39d107b2a8935909847519c",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/4009352aa234c569e415ab38e43e36c1f05f14b6"
        },
        "date": 1715798044985,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 204090,
            "range": "±2.17%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 182453,
            "range": "±2.10%",
            "unit": "ops/sec",
            "extra": "220 samples"
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
          "id": "613abf4fef58417f7e4c08836383bc75d42ce2ab",
          "message": "`expiresIn` meta data for AT is miscalculated in hydrateCache() (#7102)\n\nFix a bug in `expiresIn` calculation for AT in hydrateCache() API. The\r\ntoken itself is unaffected.",
          "timestamp": "2024-05-16T01:08:44-07:00",
          "tree_id": "791b59d9853dfef9ce8340e5eb8b26f4a761064e",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/613abf4fef58417f7e4c08836383bc75d42ce2ab"
        },
        "date": 1715847245393,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 200568,
            "range": "±2.10%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 188589,
            "range": "±2.02%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "fd256290112488645e0ccd1bf6cf37f267de8e01",
          "message": "Angular18 standalone sample app (#7063)\n\nAngular sample application using MSAL Angular v3 and Angular\r\n18.0.0-rc.1.\r\n\r\nDocumentation updates confirming MSAL Angular's support of Angular 18\r\nwill come in another PR when Angular 18 is released.",
          "timestamp": "2024-05-16T11:09:15-07:00",
          "tree_id": "7abee2d5f5129c7f8cea7335b682a4d00bfb90b2",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/fd256290112488645e0ccd1bf6cf37f267de8e01"
        },
        "date": 1715883290354,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 195015,
            "range": "±1.98%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187240,
            "range": "±2.06%",
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
          "id": "063ef3d71ee04cc75f1670eaf6cc424a061e804d",
          "message": "Update msal-angular v17 README.md (#7108)\n\n- Update msal-angular v17 README.md",
          "timestamp": "2024-05-16T17:34:45-04:00",
          "tree_id": "338f187461b747356e1d4f97425ade663341acb2",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/063ef3d71ee04cc75f1670eaf6cc424a061e804d"
        },
        "date": 1715895613487,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 191761,
            "range": "±1.96%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 198324,
            "range": "±2.11%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "e1c27fa09c32c9bddbd7e63730aa7561553e76fc",
          "message": "MSAL Angular samples e2e-test-utils update (#7109)\n\nUpdates MSAL Angular samples to reference `e2eTestUtils` folder rather\r\nthan version.",
          "timestamp": "2024-05-17T09:38:22-07:00",
          "tree_id": "02f4370695d51f7fb8ad2b6ded428a099542148f",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/e1c27fa09c32c9bddbd7e63730aa7561553e76fc"
        },
        "date": 1715964228567,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 191743,
            "range": "±2.07%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 188996,
            "range": "±1.93%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "8d191431383be7983bec099e961f5f5ab2e0df5f",
          "message": "API for Managed Identity to detect the current environment (#7093)\n\nThis feature is requested by Azure Identity SDK. Please see the\r\ndescription in the linked issue for more info.",
          "timestamp": "2024-05-17T16:34:44-04:00",
          "tree_id": "da3f62e9041d95d6b045f8993f039c49f88ac13c",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/8d191431383be7983bec099e961f5f5ab2e0df5f"
        },
        "date": 1715978422681,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 216024,
            "range": "±1.61%",
            "unit": "ops/sec",
            "extra": "238 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 194208,
            "range": "±2.07%",
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
          "id": "89ff611db3897caf747022ce7c2cf6cf539559d3",
          "message": "Instrument preflight check errors (#7113)\n\n- Instrument preflight check errors.",
          "timestamp": "2024-05-20T17:39:54-04:00",
          "tree_id": "e9702daee6b1d6f067888e301e66b76bd383a929",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/89ff611db3897caf747022ce7c2cf6cf539559d3"
        },
        "date": 1716241520899,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 186720,
            "range": "±1.82%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 198906,
            "range": "±2.07%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "adaa895b6959b420f305828c8e7ac716a860e91a",
          "message": "Support CreatePCA pattern for NAA apps (#7112)\n\nThis PR adds two new public APIs:\r\n\r\n* `createNestablePublicClientApplication` and\r\n`createStandardPublicClientApplication` as exportable functions.\r\n* Moving these functions out of PCA class helps us to eventually clean\r\nup and provide a better size output for NAA only apps.\r\n\r\nThe usage pattern still remains the same:\r\n- Create nestedPCA if the OperatingContext matches\r\n- Fall back to standardPCA as default\r\n\r\n`PublicClientNext` will eventually see removal in any NAA support as we\r\nmake changes. We will add notice that `PCANext` will not be following\r\nsemver in the upcoming releases, so we can experiment with the future\r\nchanges using that class once this pattern is adapted.\r\n\r\n---------\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-05-21T15:04:14-07:00",
          "tree_id": "c97c86b59cc33c6c64cb50f4cb3f98ff72519c82",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/adaa895b6959b420f305828c8e7ac716a860e91a"
        },
        "date": 1716329382150,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 193208,
            "range": "±2.08%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 189191,
            "range": "±2.21%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "0db42395be44d5534861880d2c113dd639caf4c7",
          "message": "Supports caching in NAA apps (#7072)\n\nNAA apps currently always request the bridge for tokens, adding load to\r\nthe host caching hence blocking the deployment on scale. This PR adds\r\nsupport for:\r\n\r\n* Caching NAA app tokens (idToken and accessToken) in the naa app\r\nstorage (based on `cacheConfig`)\r\n* Allows for NAA app to set `initContext` with `accountContext` to look\r\nfor specific account in cache when available.\r\n\r\nMetaOS apps create and delete the NAA apps independent of the session.\r\nHence, we always assume the Bridge will add the account context and only\r\nlook for those tokens. If the account is not found, we always go for the\r\nhub to fetch tokens.\r\n\r\n**Minor additions:**\r\n* AccountManager created to not duplicate account lookup code and make\r\nthem functions (saving size).\r\n* If a token is expired while cache lookup, it is cleaned.\r\n\r\n**Note and TBD:** \r\nSince there is no `logout` and naa app life cycle does not map to\r\nsession life time, cache clean up is not comprehensive. However, this PR\r\nclears the cache when a token is identified as expired. The logout\r\nequivalent cache clearance (if the parent logs out, nested app should\r\nclean up cache) will be handled as a separate use case.\r\n\r\n---------\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-05-22T16:21:04-07:00",
          "tree_id": "c42c9df6eb46834507f741fcb88389462464e5a3",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/0db42395be44d5534861880d2c113dd639caf4c7"
        },
        "date": 1716420390182,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190314,
            "range": "±2.20%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 186010,
            "range": "±2.14%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "1ad0936846ba97cdc5a71da153b3b294e6847017",
          "message": "Angular 18 support changes (#7124)\n\nThis PR:\r\n- Updates MSAL Angular documentation to reflect Angular 18 support\r\n- Updates the `angular18-standalone-sample` to use Angular 18 release\r\nversion",
          "timestamp": "2024-05-24T14:01:50-07:00",
          "tree_id": "782ab25d0bdf510159eee7d709bf5003be62b87c",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/1ad0936846ba97cdc5a71da153b3b294e6847017"
        },
        "date": 1716584837177,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190413,
            "range": "±2.08%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 202428,
            "range": "±2.06%",
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
          "id": "3256445db8f05430d9dd0df50a70b49057cbf39b",
          "message": "Bump axios from 0.21.4 to 1.7.2 (#7125)\n\nBumps [axios](https://github.com/axios/axios) from 0.21.4 to 1.7.2.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/axios/axios/releases\">axios's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>Release v1.7.2</h2>\r\n<h2>Release notes:</h2>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li><strong>fetch:</strong> enhance fetch API detection; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6413\">#6413</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/4f79aef81b7c4644328365bfc33acf0a9ef595bc\">4f79aef</a>)</li>\r\n</ul>\r\n<h3>Contributors to this release</h3>\r\n<ul>\r\n<li><!-- raw HTML omitted --> <a\r\nhref=\"https://github.com/DigitalBrainJS\" title=\"+3/-3\r\n([#6413](https://github.com/axios/axios/issues/6413) )\">Dmitriy\r\nMozgovoy</a></li>\r\n</ul>\r\n<h2>Release v1.7.1</h2>\r\n<h2>Release notes:</h2>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li><strong>fetch:</strong> fixed ReferenceError issue when TextEncoder\r\nis not available in the environment; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6410\">#6410</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/733f15fe5bd2d67e1fadaee82e7913b70d45dc5e\">733f15f</a>)</li>\r\n</ul>\r\n<h3>Contributors to this release</h3>\r\n<ul>\r\n<li><!-- raw HTML omitted --> <a\r\nhref=\"https://github.com/DigitalBrainJS\" title=\"+14/-9\r\n([#6410](https://github.com/axios/axios/issues/6410) )\">Dmitriy\r\nMozgovoy</a></li>\r\n</ul>\r\n<h2>Release v1.7.0</h2>\r\n<h2>Release notes:</h2>\r\n<h3>Features</h3>\r\n<ul>\r\n<li><strong>adapter:</strong> add fetch adapter; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6371\">#6371</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/a3ff99b59d8ec2ab5dd049e68c043617a4072e42\">a3ff99b</a>)</li>\r\n</ul>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li><strong>core/axios:</strong> handle un-writable error stack (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6362\">#6362</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/81e0455b7b57fbaf2be16a73ebe0e6591cc6d8f9\">81e0455</a>)</li>\r\n</ul>\r\n<h3>Contributors to this release</h3>\r\n<ul>\r\n<li><!-- raw HTML omitted --> <a\r\nhref=\"https://github.com/DigitalBrainJS\" title=\"+1015/-127\r\n([#6371](https://github.com/axios/axios/issues/6371) )\">Dmitriy\r\nMozgovoy</a></li>\r\n<li><!-- raw HTML omitted --> <a href=\"https://github.com/jasonsaayman\"\r\ntitle=\"+30/-14 ()\">Jay</a></li>\r\n<li><!-- raw HTML omitted --> <a\r\nhref=\"https://github.com/alexandre-abrioux\" title=\"+56/-6\r\n([#6362](https://github.com/axios/axios/issues/6362) )\">Alexandre\r\nABRIOUX</a></li>\r\n</ul>\r\n<h2>Release v1.7.0-beta.2</h2>\r\n<h2>Release notes:</h2>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li><strong>fetch:</strong> capitalize HTTP method names; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6395\">#6395</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/ad3174a3515c3c2573f4bcb94818d582826f3914\">ad3174a</a>)</li>\r\n<li><strong>fetch:</strong> fix &amp; optimize progress capturing for\r\ncases when the request data has a nullish value or zero data length (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6400\">#6400</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/95a3e8e346cfd6a5548e171f2341df3235d0e26b\">95a3e8e</a>)</li>\r\n<li><strong>fetch:</strong> fix headers getting from a stream response;\r\n(<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6401\">#6401</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/870e0a76f60d0094774a6a63fa606eec52a381af\">870e0a7</a>)</li>\r\n</ul>\r\n<h3>Contributors to this release</h3>\r\n<ul>\r\n<li><!-- raw HTML omitted --> <a\r\nhref=\"https://github.com/DigitalBrainJS\" title=\"+99/-46\r\n([#6405](https://github.com/axios/axios/issues/6405)\r\n[#6404](https://github.com/axios/axios/issues/6404)\r\n[#6401](https://github.com/axios/axios/issues/6401)\r\n[#6400](https://github.com/axios/axios/issues/6400)\r\n[#6395](https://github.com/axios/axios/issues/6395) )\">Dmitriy\r\nMozgovoy</a></li>\r\n</ul>\r\n<h2>Release v1.7.0-beta.1</h2>\r\n<h2>Release notes:</h2>\r\n<!-- raw HTML omitted -->\r\n</blockquote>\r\n<p>... (truncated)</p>\r\n</details>\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/axios/axios/blob/v1.x/CHANGELOG.md\">axios's\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h2><a\r\nhref=\"https://github.com/axios/axios/compare/v1.7.1...v1.7.2\">1.7.2</a>\r\n(2024-05-21)</h2>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li><strong>fetch:</strong> enhance fetch API detection; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6413\">#6413</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/4f79aef81b7c4644328365bfc33acf0a9ef595bc\">4f79aef</a>)</li>\r\n</ul>\r\n<h3>Contributors to this release</h3>\r\n<ul>\r\n<li><!-- raw HTML omitted --> <a\r\nhref=\"https://github.com/DigitalBrainJS\" title=\"+3/-3\r\n([#6413](https://github.com/axios/axios/issues/6413) )\">Dmitriy\r\nMozgovoy</a></li>\r\n</ul>\r\n<h2><a\r\nhref=\"https://github.com/axios/axios/compare/v1.7.0...v1.7.1\">1.7.1</a>\r\n(2024-05-20)</h2>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li><strong>fetch:</strong> fixed ReferenceError issue when TextEncoder\r\nis not available in the environment; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6410\">#6410</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/733f15fe5bd2d67e1fadaee82e7913b70d45dc5e\">733f15f</a>)</li>\r\n</ul>\r\n<h3>Contributors to this release</h3>\r\n<ul>\r\n<li><!-- raw HTML omitted --> <a\r\nhref=\"https://github.com/DigitalBrainJS\" title=\"+14/-9\r\n([#6410](https://github.com/axios/axios/issues/6410) )\">Dmitriy\r\nMozgovoy</a></li>\r\n</ul>\r\n<h1><a\r\nhref=\"https://github.com/axios/axios/compare/v1.7.0-beta.2...v1.7.0\">1.7.0</a>\r\n(2024-05-19)</h1>\r\n<h3>Features</h3>\r\n<ul>\r\n<li><strong>adapter:</strong> add fetch adapter; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6371\">#6371</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/a3ff99b59d8ec2ab5dd049e68c043617a4072e42\">a3ff99b</a>)</li>\r\n</ul>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li><strong>core/axios:</strong> handle un-writable error stack (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6362\">#6362</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/81e0455b7b57fbaf2be16a73ebe0e6591cc6d8f9\">81e0455</a>)</li>\r\n</ul>\r\n<h3>Contributors to this release</h3>\r\n<ul>\r\n<li><!-- raw HTML omitted --> <a\r\nhref=\"https://github.com/DigitalBrainJS\" title=\"+1015/-127\r\n([#6371](https://github.com/axios/axios/issues/6371) )\">Dmitriy\r\nMozgovoy</a></li>\r\n<li><!-- raw HTML omitted --> <a href=\"https://github.com/jasonsaayman\"\r\ntitle=\"+30/-14 ()\">Jay</a></li>\r\n<li><!-- raw HTML omitted --> <a\r\nhref=\"https://github.com/alexandre-abrioux\" title=\"+56/-6\r\n([#6362](https://github.com/axios/axios/issues/6362) )\">Alexandre\r\nABRIOUX</a></li>\r\n</ul>\r\n<h1><a\r\nhref=\"https://github.com/axios/axios/compare/v1.7.0-beta.1...v1.7.0-beta.2\">1.7.0-beta.2</a>\r\n(2024-05-19)</h1>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li><strong>fetch:</strong> capitalize HTTP method names; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6395\">#6395</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/ad3174a3515c3c2573f4bcb94818d582826f3914\">ad3174a</a>)</li>\r\n<li><strong>fetch:</strong> fix &amp; optimize progress capturing for\r\ncases when the request data has a nullish value or zero data length (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6400\">#6400</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/95a3e8e346cfd6a5548e171f2341df3235d0e26b\">95a3e8e</a>)</li>\r\n<li><strong>fetch:</strong> fix headers getting from a stream response;\r\n(<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6401\">#6401</a>)\r\n(<a\r\nhref=\"https://github.com/axios/axios/commit/870e0a76f60d0094774a6a63fa606eec52a381af\">870e0a7</a>)</li>\r\n</ul>\r\n<h3>Contributors to this release</h3>\r\n<!-- raw HTML omitted -->\r\n</blockquote>\r\n<p>... (truncated)</p>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/0e4f9fa29077ebee4499facea6be1492b42e8a26\"><code>0e4f9fa</code></a>\r\nchore(release): v1.7.2 (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6414\">#6414</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/4f79aef81b7c4644328365bfc33acf0a9ef595bc\"><code>4f79aef</code></a>\r\nfix(fetch): enhance fetch API detection; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6413\">#6413</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/67d1373131962d1f1f5b8d91f9a2f80ed3923bc8\"><code>67d1373</code></a>\r\nchore(release): v1.7.1 (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6411\">#6411</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/733f15fe5bd2d67e1fadaee82e7913b70d45dc5e\"><code>733f15f</code></a>\r\nfix(fetch): fixed ReferenceError issue when TextEncoder is not available\r\nin t...</li>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/3041c61adaaac6d2c43eba28c134e7f4d43ab012\"><code>3041c61</code></a>\r\n[Release] v1.7.0 (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6408\">#6408</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/18b13cbaef66d8c266cf681165afe31787420100\"><code>18b13cb</code></a>\r\nchore(docs): add fetch adapter docs; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6407\">#6407</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/e62099bc8b640acf47fba639366bbcd3bf87f831\"><code>e62099b</code></a>\r\nfix(fetch): fixed a possible memory leak in the AbortController for the\r\nstrea...</li>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/b49aa8e3d837c36e4728a9fa8a5e23a1162e96ec\"><code>b49aa8e</code></a>\r\nchore(release): v1.7.0-beta.2 (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6403\">#6403</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/d57f03a77fef1eb3cd9a17e2973c4305e105a42e\"><code>d57f03a</code></a>\r\nchore(ci): bump create-pull-request version to fix a bug; (<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6405\">#6405</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/axios/axios/commit/097b0d18e93d12c53b77741d6bfdc8a1fc11828b\"><code>097b0d1</code></a>\r\nchore(ci): add tag resolution for npm releases based on package version;\r\n(<a\r\nhref=\"https://redirect.github.com/axios/axios/issues/6404\">#6404</a>)</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/axios/axios/compare/v0.21.4...v1.7.2\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=axios&package-manager=npm_and_yarn&previous-version=0.21.4&new-version=1.7.2)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-05-24T14:31:10-07:00",
          "tree_id": "030be7d5b359bf41ac876b3d49c6cf9d818a0839",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/3256445db8f05430d9dd0df50a70b49057cbf39b"
        },
        "date": 1716586596623,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 189023,
            "range": "±2.05%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187202,
            "range": "±2.00%",
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
          "id": "86619c7c51c99b61b2ae3525fc257c7070452e64",
          "message": "Update E2E Test Templates (#7103)\n\nThis PR:\r\n- Updates npm scripts in samples used for E2E testing to standardize the\r\ntest:e2e command\r\n- Updates `3p-e2e.yml` and 1`p-e2e.yml` to use the new unified\r\n`e2e-tests.yml` template instead of each package having it's own e2e\r\ntemplate to reduce duplication and pipeline fix overhead\r\n- Adds stage, branch and repo source logic to correctly handle branch\r\nname substitutions for every combination of 1P and 3P builds",
          "timestamp": "2024-05-28T10:36:35-07:00",
          "tree_id": "c8daf1d8510c13cab9549a4bad02ddc2e2f5f33d",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/86619c7c51c99b61b2ae3525fc257c7070452e64"
        },
        "date": 1716918120227,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 193514,
            "range": "±2.19%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 203401,
            "range": "±2.18%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "28a0441584525fa2e5e992f66adcdf71c9057ea1",
          "message": "Bump package versions",
          "timestamp": "2024-05-28T21:37:27Z",
          "tree_id": "e591a9287d17126360be6dc7d55f70ebd259a461",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/28a0441584525fa2e5e992f66adcdf71c9057ea1"
        },
        "date": 1716932581267,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 196187,
            "range": "±2.02%",
            "unit": "ops/sec",
            "extra": "225 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 186909,
            "range": "±1.98%",
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
          "id": "9b142268171dc1a68fd747d998d19a6ee1f2718a",
          "message": "Update api reports post-release (#7129)\n\nThis PR updates API reports post-release",
          "timestamp": "2024-05-29T10:00:14-07:00",
          "tree_id": "41cc438a6aee4268e4fbbb1721951a0208abec8d",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/9b142268171dc1a68fd747d998d19a6ee1f2718a"
        },
        "date": 1717002330194,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 189376,
            "range": "±2.04%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 210516,
            "range": "±1.60%",
            "unit": "ops/sec",
            "extra": "205 samples"
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
          "id": "159d9da3a94293dc1c26a039f375586680f50fd4",
          "message": "Add debug variables parameter to 1p-e2e pipeline (#7131)\n\nAdds a parameter that adds a step that prints certain key configuration\r\nvariables for debugging purposes",
          "timestamp": "2024-05-29T13:55:12-07:00",
          "tree_id": "de80136a8c28945e882ad7b168fcb510e3a068e4",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/159d9da3a94293dc1c26a039f375586680f50fd4"
        },
        "date": 1717016447662,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 189934,
            "range": "±2.10%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 223786,
            "range": "±0.64%",
            "unit": "ops/sec",
            "extra": "238 samples"
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
          "id": "4d3c84b3f5b633b269e46e03382fa8d834886ab0",
          "message": "Instrument pre-redirect flow (#7134)\n\n- Instrument pre-redirect flow.",
          "timestamp": "2024-05-30T12:45:15-04:00",
          "tree_id": "33168ce0be81a5db4f3f482d37162b0e9ddf7d3d",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/4d3c84b3f5b633b269e46e03382fa8d834886ab0"
        },
        "date": 1717087841769,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 183320,
            "range": "±1.93%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 188640,
            "range": "±2.22%",
            "unit": "ops/sec",
            "extra": "222 samples"
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
          "id": "69e58c3131ab6b84def41e26ec33846d6d8c14f1",
          "message": "Update regional-authorities.md (#7078)\n\n@trwalke and @Robbie-Microsoft - please review.\r\n\r\n---------\r\n\r\nCo-authored-by: Peter <34331512+pmaytak@users.noreply.github.com>",
          "timestamp": "2024-06-03T08:19:45-07:00",
          "tree_id": "66a9717012b5314c839c896bd900cb5344c92e61",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/69e58c3131ab6b84def41e26ec33846d6d8c14f1"
        },
        "date": 1717428312136,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 199525,
            "range": "±2.00%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 192946,
            "range": "±2.05%",
            "unit": "ops/sec",
            "extra": "222 samples"
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
          "id": "8e4b664577672409573431df264307fb4864564d",
          "message": "Fix MSAL Angular MsalInterceptor bug matching to query string (#7137)\n\nThis PR addresses a bug where the `MsalInterceptor` could match the\r\nprotectedResource to the query string part of the URL instead of the\r\nhost name and port part of the URL. It also refactors the code\r\nsurrounding relative URLs.\r\n\r\nThis addresses issue #7111",
          "timestamp": "2024-06-03T09:50:33-07:00",
          "tree_id": "1991ba22c0bca8659809e699a23b9d93f1c790e5",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/8e4b664577672409573431df264307fb4864564d"
        },
        "date": 1717433758007,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 188430,
            "range": "±1.99%",
            "unit": "ops/sec",
            "extra": "225 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187994,
            "range": "±2.01%",
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
          "id": "46f6e8a2175ac7e555d165a1ce395209799845c9",
          "message": "Bump package versions",
          "timestamp": "2024-06-04T00:10:13Z",
          "tree_id": "114b2ea31b6b4cfd74cc5eed1aef2fff2c4bc766",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/46f6e8a2175ac7e555d165a1ce395209799845c9"
        },
        "date": 1717460137799,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 189540,
            "range": "±2.06%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 197783,
            "range": "±1.98%",
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
          "id": "cc18b42d4ffaf80b72262d0efee2d157ab9f7a1c",
          "message": "Remove outdated TS Sample (#7149)",
          "timestamp": "2024-06-06T13:13:59-07:00",
          "tree_id": "1f21c7ff38cff8061cde83ae3eda2d8d39cdc0fb",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/cc18b42d4ffaf80b72262d0efee2d157ab9f7a1c"
        },
        "date": 1717705178139,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 186749,
            "range": "±2.18%",
            "unit": "ops/sec",
            "extra": "219 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 184167,
            "range": "±2.18%",
            "unit": "ops/sec",
            "extra": "222 samples"
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
          "id": "3ee9c68d1a80bf7652e41b58ae1bf87ff64a727e",
          "message": "Implementation Based on Feature Request (#7151)",
          "timestamp": "2024-06-07T12:00:59-04:00",
          "tree_id": "7a9cc7b24969fb9f68cc3e554985a59de92ca316",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/3ee9c68d1a80bf7652e41b58ae1bf87ff64a727e"
        },
        "date": 1717776381516,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 193745,
            "range": "±1.95%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187059,
            "range": "±2.00%",
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
          "id": "3893cce8de08594155125c3c1db140ec69a7da07",
          "message": "Update gatsby and angular samples (#7150)\n\nThis PR updates the version for Gatsby in the gatsby-sample app to patch\r\na `sharp` vulnerability and makes some required updates to angular\r\nsample dependencies",
          "timestamp": "2024-06-07T10:43:27-07:00",
          "tree_id": "efe34e80f2973e2d45b224c0ff393dbdaa3b8898",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/3893cce8de08594155125c3c1db140ec69a7da07"
        },
        "date": 1717782855276,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 183144,
            "range": "±2.06%",
            "unit": "ops/sec",
            "extra": "219 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 183536,
            "range": "±2.28%",
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
          "id": "7563498a9c0b6aee57957da3615434159d626c5f",
          "message": "Update package-lock (#7152)",
          "timestamp": "2024-06-07T15:47:07-07:00",
          "tree_id": "024851eeeee582175789a476c5a8cdc970e2119d",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/7563498a9c0b6aee57957da3615434159d626c5f"
        },
        "date": 1717800748333,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 192530,
            "range": "±2.04%",
            "unit": "ops/sec",
            "extra": "225 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 190821,
            "range": "±1.96%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "25aefea3e9f4ee814a6e8ab597d91b6806eecba6",
          "message": "Support pop as optional for full framed apps (#7119)\n\n- This PR signs the POP tokens only if the reqCnf is not passed in as a\r\nrequest parameter. This is to enable any clients that choose to sign\r\ntheir tokens. However, please consider this an advanced feature only.\r\n- This PR also addresses the native flow bug where cnf is to be sent a\r\nstring instead of a hash!\r\n- Removes reqCnfHash in the ReqCnfData since we do not use it. It is\r\nonly internal, so this should not be a breaking change.\r\n\r\n---------\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>\r\nCo-authored-by: Lalima Sharda <lalimasharda@microsoft.com>\r\nCo-authored-by: Hector Morales <hemoral@microsoft.com>",
          "timestamp": "2024-06-10T12:15:44-07:00",
          "tree_id": "ce6763c3a94c902dbbd4df55c7f69f53853164a3",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/25aefea3e9f4ee814a6e8ab597d91b6806eecba6"
        },
        "date": 1718047292846,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 213734,
            "range": "±0.76%",
            "unit": "ops/sec",
            "extra": "239 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 206928,
            "range": "±0.63%",
            "unit": "ops/sec",
            "extra": "235 samples"
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
          "id": "5685c8cff1f0334ad77268759ccf828c71db419b",
          "message": "Update lab request scope (#7155)\n\nUpdate lab client app token request scopes",
          "timestamp": "2024-06-10T15:09:14-07:00",
          "tree_id": "e2c4dac7b3225bb2ea5ce85adc6c8cc84f0d222b",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/5685c8cff1f0334ad77268759ccf828c71db419b"
        },
        "date": 1718057688173,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 194562,
            "range": "±2.05%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 185645,
            "range": "±1.87%",
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
          "id": "1b0fc2023be87c0eb2af7e6c52152eea289b9089",
          "message": "Bump package versions",
          "timestamp": "2024-06-10T22:31:49Z",
          "tree_id": "3301d08ea737f36a7e2b0cda5dfe73a169fbfa07",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/1b0fc2023be87c0eb2af7e6c52152eea289b9089"
        },
        "date": 1718059036011,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 186929,
            "range": "±1.88%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187861,
            "range": "±1.96%",
            "unit": "ops/sec",
            "extra": "221 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "jshrico@gmail.com",
            "name": "Josh",
            "username": "joshhhz"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "152785dfe94a264906d5512801be192e2c86e9dd",
          "message": "Update Angular Samples README.md (#7143)\n\nFix typo in Angular Samples README.md\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-06-13T11:36:12-07:00",
          "tree_id": "f35fafa6877f06ebc8906899f636bb969ff75f64",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/152785dfe94a264906d5512801be192e2c86e9dd"
        },
        "date": 1718304110182,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 188000,
            "range": "±2.16%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 215503,
            "range": "±0.99%",
            "unit": "ops/sec",
            "extra": "236 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "127046736+shaouari-Dev@users.noreply.github.com",
            "name": "shaouari-Dev",
            "username": "shaouari-Dev"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "a8f04307fde93b5bd46363f3b5375263594f12ae",
          "message": "fix : msal-browser acquireTokenSilentAsync memory leak (#7154)\n\nThis pull request addresses a memory leak issue in the MSAL-Browser\r\nlibrary.\r\n\r\nThe issue was originally identified in Zone.js for Angular 16, where the\r\nuse of arrow functions in the visibilitychange event listeners caused\r\nproblems. Specifically, Zone.js cannot compare the arrow functions when\r\nadding and removing the event listeners, which leads to the tasks not\r\nbeing properly removed and resulting in a more important memory leaks\r\nover time.",
          "timestamp": "2024-06-14T10:02:47-07:00",
          "tree_id": "fef587f1f9296822fd29aad7fa538637b49c4bd7",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/a8f04307fde93b5bd46363f3b5375263594f12ae"
        },
        "date": 1718384889617,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 199892,
            "range": "±2.04%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 198117,
            "range": "±2.02%",
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
          "id": "ef11c8804a9e3c1d330fafc672a18100148dc84e",
          "message": "Relax loadExternalTokens requirements to allow loading without id_token (#7165)\n\nRefactors `loadExternalTokens` to allow loading of any combination of\r\ntokens. Previously id_token was required in order to load access and/or\r\nrefresh tokens, now client_info or an AccountInfo object can be used\r\ninstead.\r\n\r\n---------\r\n\r\nCo-authored-by: Sameera Gajjarapu <sameera.gajjarapu@microsoft.com>",
          "timestamp": "2024-06-18T13:15:04-07:00",
          "tree_id": "fe9ffebe1ba25b56f35ae2df2117cf43c0b7d6bf",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/ef11c8804a9e3c1d330fafc672a18100148dc84e"
        },
        "date": 1718742037078,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 187984,
            "range": "±1.98%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 193609,
            "range": "±2.10%",
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
          "id": "0a905a98bb3926ae8d0e34446ba740177c99a359",
          "message": "Fix extraQueryParameters being dropped from request (#7166)\n\nIn cases where a field included in extraQueryParameters already exists\r\non the query string it was being deleted from the object which prevented\r\nit from being used on the next request i.e. removed on /authorize, no\r\nlonger exists on /token. This caused a bug in Pairwise broker and NAA\r\nflows ultimately resulting in the server throwing an\r\n\"unauthorized_client\" error.\r\n\r\nThis PR fixes this bug.\r\n\r\nNote: Objects in JavaScript are passed by reference which is why the\r\noriginal implementation caused this bug. There are other places in the\r\ncode where we similarly edit an object that has been passed in. A\r\nseparate work item has been created to address those other instances in\r\na separate PR & turn on a lint rule to prevent this pattern in the\r\nfuture.",
          "timestamp": "2024-06-18T13:26:23-07:00",
          "tree_id": "054b098c96492f468f131ed9621c76e6684f07e1",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/0a905a98bb3926ae8d0e34446ba740177c99a359"
        },
        "date": 1718742704332,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190078,
            "range": "±1.90%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 192462,
            "range": "±2.02%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "362442e1681867ca90ddf860d82e115436b8b1a6",
          "message": "Update typo in NAA unsupported error (#7168)\n\nUpdate typo in NAA unsupported error",
          "timestamp": "2024-06-18T14:07:27-07:00",
          "tree_id": "68c10cd3d1cc5b122b6015682edc281367116dc8",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/362442e1681867ca90ddf860d82e115436b8b1a6"
        },
        "date": 1718745180936,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 196530,
            "range": "±1.87%",
            "unit": "ops/sec",
            "extra": "228 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 192749,
            "range": "±2.18%",
            "unit": "ops/sec",
            "extra": "224 samples"
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
          "id": "348301bd86ad0fbd87ed8e464b29acb619867bd4",
          "message": "Managed Identity - Reformatted ManagedIdentityTokenResponse + adjusted unit tests (#7167)\n\nUpdated msal-common ResponseHandler's validateTokenResponse function to\r\naccount for undefined portions of a network error. It now accounts for\r\n[different error\r\nformats](https://microsoft.sharepoint.com/teams/ADAL/_layouts/15/Doc.aspx?sourcedoc={0339bdd6-b5e5-4d94-b4c9-ea47127f5023}&action=edit&wd=target%28ID4S%2FMSALs%2FTechnical%2FMSI.one%7Ca2a57687-9a17-4c9e-86d1-60aa32ab5005%2FMSI%20Errors%20%20Exceptions%7C41fe3612-4fac-475d-9667-4a114aebeeda%2F%29&wdorigin=NavigationUrl)\r\nfrom all Managed Identity sources.\r\n\r\nCreated new unit tests + overhauled existing Managed Identity unit\r\ntests.\r\n\r\nManual testing was completed for all Managed Identity sources except\r\nService Fabric.",
          "timestamp": "2024-06-25T16:25:35-04:00",
          "tree_id": "df221b0593a1d2619460a7326daf0ada7b2bb34b",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/348301bd86ad0fbd87ed8e464b29acb619867bd4"
        },
        "date": 1719347469345,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 191297,
            "range": "±2.17%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 193231,
            "range": "±2.14%",
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
          "id": "2b6041320cc8bcf007dd2e6bab41745c81057aec",
          "message": "Update package-lock (#7176)\n\nThis PR updates package-lock to fix build issues",
          "timestamp": "2024-06-26T09:46:24-07:00",
          "tree_id": "c373e468b4e58cf3586968709ddeae7d12c8db5e",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/2b6041320cc8bcf007dd2e6bab41745c81057aec"
        },
        "date": 1719420707053,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190965,
            "range": "±2.10%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 188891,
            "range": "±2.17%",
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
          "id": "586aa65856854e025661086fab47c782e1e8c753",
          "message": "Add main field to package.json (#7184)\n\nAdds main field to package.json to unblock usage with consumers that\r\ndon't understand the \"exports\" field & don't support ESM",
          "timestamp": "2024-07-01T10:34:32-07:00",
          "tree_id": "9dcfde34285f96074b0088c87bebd14a29bc0a7c",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/586aa65856854e025661086fab47c782e1e8c753"
        },
        "date": 1719855596220,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 187078,
            "range": "±2.06%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187324,
            "range": "±2.08%",
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
          "id": "be05b0571b240c9053ea84dff5551bbce5d1f05b",
          "message": "Bump package versions",
          "timestamp": "2024-07-01T19:19:43Z",
          "tree_id": "76f4d6f65506e08a145fb1261b00073ad570664e",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/be05b0571b240c9053ea84dff5551bbce5d1f05b"
        },
        "date": 1719861909173,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 196946,
            "range": "±1.94%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 191213,
            "range": "±2.11%",
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
          "id": "6339ce72fd790ed59aaf1b428b0a4d537e5a5fbc",
          "message": "Add correlation id param to initialize and clearTokensAndKeysWithClaims APIs to streamline telemetry data analysis (#7190)\n\n- Add correlation id param to initialize and\r\nclearTokensAndKeysWithClaims APIs to streamline telemetry data analysis",
          "timestamp": "2024-07-09T12:52:31-04:00",
          "tree_id": "8f025afaae13d909922a0535f01c9f504385a750",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/6339ce72fd790ed59aaf1b428b0a4d537e5a5fbc"
        },
        "date": 1720544268452,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 189750,
            "range": "±2.28%",
            "unit": "ops/sec",
            "extra": "199 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187923,
            "range": "±1.91%",
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
          "id": "1a15eb9c61f1b884ccb10aece26e84e5a1e0ae4e",
          "message": "Use SNI certs (#7188)\n\nMoving to SNI certs instead of pinned certs for LabClient token\r\nacquisition",
          "timestamp": "2024-07-09T13:30:49-07:00",
          "tree_id": "468105db7cd72e44c1dd7438d2b85fe01d0d2f7f",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/1a15eb9c61f1b884ccb10aece26e84e5a1e0ae4e"
        },
        "date": 1720557381962,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 189850,
            "range": "±2.28%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 189901,
            "range": "±2.13%",
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
          "id": "b07a985e8fc2e92faf1134e40f706f2f7d57acca",
          "message": "Add missing param to PCA.initialize (#7194)\n\n- Add missing param to PCA.initialize",
          "timestamp": "2024-07-10T10:45:26-04:00",
          "tree_id": "96451ef6be7223e43d72f131349a7fa79d321fcf",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/b07a985e8fc2e92faf1134e40f706f2f7d57acca"
        },
        "date": 1720623060181,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 192422,
            "range": "±2.12%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 204996,
            "range": "±2.01%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "2adfb68294d29f35a3afcd6571a199e64c6e99b3",
          "message": "Remove onRedirectNavigate callback function in native ATRedirect calls (#7193)\n\nWe cannot pass functions in Message Channel",
          "timestamp": "2024-07-11T09:36:08-07:00",
          "tree_id": "bcb89a7082d9d8b559069991fcdfd55dfbda3f59",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/2adfb68294d29f35a3afcd6571a199e64c6e99b3"
        },
        "date": 1720716097475,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 192281,
            "range": "±2.15%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 189794,
            "range": "±2.03%",
            "unit": "ops/sec",
            "extra": "222 samples"
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
          "id": "2ff18f23f0631507ccbf966478b152b02c9d25af",
          "message": "Deprecated SHA-1 Thumbprints and Added SHA-256 support in Auth Flow with Certificate (#7185)\n\nSHA-1 thumbprints have been deprecated. It's now up to the developer to\r\npass in a SHA-256 thumbprint. A warning will be shown to the dev that\r\nstates the deprecation.\r\n\r\nThis is a quick-fix that puts the burden of providing a SHA-2 thumbprint\r\non the developer.\r\n\r\nManual testing has been completed.",
          "timestamp": "2024-07-12T13:40:17-04:00",
          "tree_id": "320273be0922ec3bc02534b7dcd87e535d5d35b9",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/2ff18f23f0631507ccbf966478b152b02c9d25af"
        },
        "date": 1720806347360,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 194244,
            "range": "±2.12%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187351,
            "range": "±2.08%",
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
          "id": "0ba711a47f526c99fa371dbd1bb81f8d9abe3f3e",
          "message": "Bump package versions",
          "timestamp": "2024-07-12T19:57:27Z",
          "tree_id": "276dcdd6b6a0769831d16edcb2b86c5928cdcb50",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/0ba711a47f526c99fa371dbd1bb81f8d9abe3f3e"
        },
        "date": 1720814567763,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 191988,
            "range": "±2.11%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 190545,
            "range": "±2.01%",
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
          "id": "aa24330717b5e1f2f98c9d534d3766caefbaa452",
          "message": "Create default tenant profile without idToken (#7197)\n\nAccount lookup doesn't work at all if the cached accounts don't have a\r\ntenant profile, which can happen if there is no id token yet. This PR\r\nupdates account generation to build a default tenant profile when an\r\nidToken is not present",
          "timestamp": "2024-07-15T16:30:10-07:00",
          "tree_id": "ce9fc1f38c15f8befc282b1fbaaf31e9b03d3f81",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/aa24330717b5e1f2f98c9d534d3766caefbaa452"
        },
        "date": 1721086531512,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190791,
            "range": "±2.00%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 186630,
            "range": "±1.97%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "5eabb42fe253ca40be6ded4158e63da2b8a2c6ec",
          "message": "SHA-256 thumbprints now use PSS padding (#7200)\n\nSHA-256 thumbprints now use PSS padding.\r\nSHA-1 thumbprints still use RSA padding.\r\n\r\nManually tested with `thumbprint` and `thumbprintSha256` passed into\r\n`clientCertificate`.",
          "timestamp": "2024-07-16T12:46:33-04:00",
          "tree_id": "da90817b8c49385c3d458a0bcb47957f75d6d4d8",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/5eabb42fe253ca40be6ded4158e63da2b8a2c6ec"
        },
        "date": 1721148729099,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 198231,
            "range": "±2.13%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 210931,
            "range": "±1.12%",
            "unit": "ops/sec",
            "extra": "235 samples"
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
          "id": "22651b30bce9244cce2d7ffcfa1a81e4c44be133",
          "message": "Bump package versions",
          "timestamp": "2024-07-16T18:23:41Z",
          "tree_id": "04f919eeb19ab20dd32c61f8c80c8306e660da52",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/22651b30bce9244cce2d7ffcfa1a81e4c44be133"
        },
        "date": 1721154551423,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 193826,
            "range": "±2.10%",
            "unit": "ops/sec",
            "extra": "225 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 189188,
            "range": "±2.04%",
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
          "id": "8130884783e88e6923b6e6c2361050334874b4f7",
          "message": "Track MSAL SKU for broker flows (#7182)\n\n- Track MSAL SKU for broker flows\r\n- Enable server telemetry platform fields propagation \r\n- Propagate broker error to server telemetry",
          "timestamp": "2024-07-17T16:53:23-04:00",
          "tree_id": "d2c273cb7828adad6418de61af312bc0e5619805",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/8130884783e88e6923b6e6c2361050334874b4f7"
        },
        "date": 1721249927277,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 194417,
            "range": "±2.14%",
            "unit": "ops/sec",
            "extra": "224 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 191129,
            "range": "±1.98%",
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
          "id": "97fb781d1b10f8da533d28cf37f86e52cafbe842",
          "message": "Track MSAL node SKU for broker flows (#7213)\n\n- Track MSAL node SKU for broker flows.\r\n- Move SKU instrumentation to common",
          "timestamp": "2024-07-19T16:12:20-04:00",
          "tree_id": "a62769f423e742aeff61ff74cb6fa694404f3491",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/97fb781d1b10f8da533d28cf37f86e52cafbe842"
        },
        "date": 1721420266909,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 188975,
            "range": "±2.15%",
            "unit": "ops/sec",
            "extra": "212 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 180137,
            "range": "±2.06%",
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
          "id": "99f8152a15ba356dba35ea424c670086bf8d776f",
          "message": "Add debug parameter to E2E test template usages (#7203)\n\nThis PR adds a new debug parameter to 3p-triggered E2E test pipelines",
          "timestamp": "2024-07-22T13:57:41-07:00",
          "tree_id": "3df004f229c8811557cf6214750fb02a5312736d",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/99f8152a15ba356dba35ea424c670086bf8d776f"
        },
        "date": 1721682194049,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 193062,
            "range": "±2.01%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 195420,
            "range": "±2.09%",
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
          "id": "cba1fe0a48b29f0ac7c6b60a07d7f9f524b92839",
          "message": "Bump package versions",
          "timestamp": "2024-07-23T14:20:49Z",
          "tree_id": "5ad9831715e854d2bfb4b590fa1b34dd33114acd",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/cba1fe0a48b29f0ac7c6b60a07d7f9f524b92839"
        },
        "date": 1721744781204,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190694,
            "range": "±1.98%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 192268,
            "range": "±2.05%",
            "unit": "ops/sec",
            "extra": "223 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "167471362+ejahja@users.noreply.github.com",
            "name": "ejahja",
            "username": "ejahja"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "f6ac592be2397bedd3f2cea3e3efbbf495c4f3b0",
          "message": "Update roadmap.md (#7223)\n\nRemoved outdated information, and added upcoming angular support",
          "timestamp": "2024-07-31T14:45:57-07:00",
          "tree_id": "bdd9481bd4992d6da9e735df1f807a1c0dad8082",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/f6ac592be2397bedd3f2cea3e3efbbf495c4f3b0"
        },
        "date": 1722462684842,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 193027,
            "range": "±1.94%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 195256,
            "range": "±2.17%",
            "unit": "ops/sec",
            "extra": "223 samples"
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
          "id": "0d6b81f0e4ef143e9d42f117cbe5440d04281fd7",
          "message": "Created MI FIC Sample (#7210)\n\nManaged Identity as a Federated Identity Credential is not a third-party\r\noffering at this time. This sample is for internal use only and will be\r\nused for internal testing.",
          "timestamp": "2024-08-07T13:20:26-04:00",
          "tree_id": "c34bf441e12a0268626dd44b178db14ea792fe87",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/0d6b81f0e4ef143e9d42f117cbe5440d04281fd7"
        },
        "date": 1723051557496,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 187371,
            "range": "±2.01%",
            "unit": "ops/sec",
            "extra": "224 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 199094,
            "range": "±2.14%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "e25f9176738be11615e6d64f8f33c4b518fd9ba1",
          "message": "Retry for invalid_grant errors - Silent Iframe (#7218)\n\nFirst of 3 PRs addressing need for retry for backup auth service.\r\n\r\n---------\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-08-07T11:03:55-07:00",
          "tree_id": "7f3062f85a3c5ef6d1f9aa1835187e259676c7c1",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/e25f9176738be11615e6d64f8f33c4b518fd9ba1"
        },
        "date": 1723054158721,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 188244,
            "range": "±1.86%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 189759,
            "range": "±2.05%",
            "unit": "ops/sec",
            "extra": "222 samples"
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
          "id": "a1d44e69da075f9d4434d9598751d232999a2bf6",
          "message": "Remove Managed Identity Service Fabric Sample (#7204)\n\nThis sample is out of date. The instructions in the README for setting\r\nup a Service Fabric need to be reworked. We're removing this sample\r\nuntil Service Fabric is more stable and we can come up with consistent\r\ninstructions for setting one up.",
          "timestamp": "2024-08-07T14:44:54-04:00",
          "tree_id": "74b8677600889b20fca408ecf33799497a75969a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/a1d44e69da075f9d4434d9598751d232999a2bf6"
        },
        "date": 1723056647358,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 235838,
            "range": "±1.28%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 244883,
            "range": "±1.09%",
            "unit": "ops/sec",
            "extra": "237 samples"
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
          "id": "4cb0d1cae4b219b0f01bc59473ae21e9e2ead7eb",
          "message": "Retry for invalid_grant errors - Popup (#7216)\n\nPR 2 of 3 addressing need for retry for backup auth service.\r\n\r\n---------\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-08-07T12:52:27-07:00",
          "tree_id": "ea7fd2363bc9d3adff3d4bd736f4a75a916a6c59",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/4cb0d1cae4b219b0f01bc59473ae21e9e2ead7eb"
        },
        "date": 1723060680366,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 192087,
            "range": "±2.16%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 190598,
            "range": "±2.08%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "317f8350462b6264f55949831507a96190343056",
          "message": "Updated Managed Identity IMDS Sample (#7205)\n\nUpdated sample to be consistent with upcoming `Managed Identity\r\nFederated Identity Credentials` sample.",
          "timestamp": "2024-08-07T17:17:03-04:00",
          "tree_id": "b034840cb2cb1ce038d671207551d8896477e942",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/317f8350462b6264f55949831507a96190343056"
        },
        "date": 1723065754067,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 189236,
            "range": "±2.10%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 190854,
            "range": "±2.05%",
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
          "id": "5551818416bf593226e55235af81c16a11cfb3cf",
          "message": "Fix node e2e prompt=consent tests (#7238)\n\n- Fix node e2e prompt=consent tests",
          "timestamp": "2024-08-07T19:03:25-04:00",
          "tree_id": "966a9e9bf27e96bac7e92f9e7e69bd0ac76bb2c5",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/5551818416bf593226e55235af81c16a11cfb3cf"
        },
        "date": 1723072128149,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 187915,
            "range": "±1.97%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 192707,
            "range": "±2.05%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "9b44cb454bd645284362f8ad6b0d98b9bf0a717a",
          "message": "Retry for invalid_grant errors - Redirect (#7231)\n\nPR 3 of 3 addressing need for retry for backup auth service.\r\n\r\n---------\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-08-07T17:05:39-07:00",
          "tree_id": "74420f9579dff64d1c07642d960efdad73d991e5",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/9b44cb454bd645284362f8ad6b0d98b9bf0a717a"
        },
        "date": 1723075860926,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 191310,
            "range": "±1.83%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 188725,
            "range": "±2.17%",
            "unit": "ops/sec",
            "extra": "222 samples"
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
          "id": "4592e9ff0b3ba55fe3a5e722cc4591f884be0462",
          "message": "clientSecret can now (once again) be provided as undefined (#7209)\n\nFixed a regression accidentally introduced in [Implemented SHA2\r\nCertificate\r\nFunctionality](https://github.com/AzureAD/microsoft-authentication-library-for-js/pull/7192).\r\n`clientSecret` can now (once again) be provided as `undefined`.\r\n\r\nadded unit test",
          "timestamp": "2024-08-08T12:41:10-04:00",
          "tree_id": "72571002d8e292cac8d436a9b6e4d811a93952e0",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/4592e9ff0b3ba55fe3a5e722cc4591f884be0462"
        },
        "date": 1723135606341,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 191667,
            "range": "±2.19%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 190227,
            "range": "±2.13%",
            "unit": "ops/sec",
            "extra": "222 samples"
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
          "id": "630605c310a7e9f4ab2b57011af021ea34c0e418",
          "message": "Managed Identity - Added file-based detection for Azure Arc (#7225)\n\nIf an Azure Arc Managed Identity's \"IDENTITY_ENDPOINT\" and\r\n\"IMDS_ENDPOINT\" environment variables are undefined, the Managed\r\nIdentity can still be determined to be an instance of Azure Arc if it\r\nhas a \"himds\" executable in the specified path for Windows or Linux.\r\n\r\nManual tests were successful on both Windows and Linux.",
          "timestamp": "2024-08-09T13:31:13-04:00",
          "tree_id": "6c7d583f5dbdd49732318ada862500a121e07ec9",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/630605c310a7e9f4ab2b57011af021ea34c0e418"
        },
        "date": 1723225005845,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 195369,
            "range": "±2.06%",
            "unit": "ops/sec",
            "extra": "219 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 207034,
            "range": "±1.79%",
            "unit": "ops/sec",
            "extra": "216 samples"
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
          "id": "022805b1ed8b5067b3a7e850d9e867e2ce46e70c",
          "message": "Use high precision TS for NAA message time (#7243)\n\n- Use high precision TS for NAA message time to avoid clock skew.",
          "timestamp": "2024-08-12T11:50:45-04:00",
          "tree_id": "3244d2348d10caa99d2c4398ee5615cf2e80dcff",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/022805b1ed8b5067b3a7e850d9e867e2ce46e70c"
        },
        "date": 1723478172039,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 195144,
            "range": "±2.08%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 193388,
            "range": "±2.18%",
            "unit": "ops/sec",
            "extra": "215 samples"
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
          "id": "82c287a87f5d99eed55a4a45a42c29dc3ce69007",
          "message": "added collectCoverage param to jest.config.cjs (#7245)",
          "timestamp": "2024-08-12T11:02:44-07:00",
          "tree_id": "8d709acb011268c092f21e5a7c3f33d8ed91b3d5",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/82c287a87f5d99eed55a4a45a42c29dc3ce69007"
        },
        "date": 1723486081796,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 189414,
            "range": "±2.21%",
            "unit": "ops/sec",
            "extra": "215 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 190235,
            "range": "±2.09%",
            "unit": "ops/sec",
            "extra": "217 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "me@tylerleonhardt.com",
            "name": "Tyler James Leonhardt",
            "username": "TylerLeonhardt"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "3c8bde64f806e183bb5dbb6be1f0c3c9f0f54829",
          "message": "Send the error template back when there's an error response (#7247)\n\nWithout this, the redirect in the browser resolves when the server is\r\nclosed which makes it unclear, in the browser, that there was an error.\r\nThis renders the errorTemplate already passed in.\r\n\r\n---------\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-08-12T13:22:00-07:00",
          "tree_id": "9f177a85ab30787ddd132a51c7650d97280e780a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/3c8bde64f806e183bb5dbb6be1f0c3c9f0f54829"
        },
        "date": 1723494443655,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 192726,
            "range": "±2.03%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 192411,
            "range": "±2.21%",
            "unit": "ops/sec",
            "extra": "217 samples"
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
          "id": "b5881854de70deded04da11f6b50cb3067e49c32",
          "message": "Update retry for invalid_grant errors (#7249)\n\nThis PR:\r\n- Updates `RedirectClient` and `BrowserCacheManager` and tests to use\r\nthe client ID instead of the correlation ID when caching retry value.\r\n- Cleans up error logic in `SilentIframeClient` and `PopupClient`.",
          "timestamp": "2024-08-12T15:08:54-07:00",
          "tree_id": "30733a23cf6c086b4529ce53ef779aff7056c38a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/b5881854de70deded04da11f6b50cb3067e49c32"
        },
        "date": 1723500867840,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 198233,
            "range": "±1.99%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 203157,
            "range": "±2.15%",
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
          "id": "8ad6d1d47aab7259e9bcad6b0c194fa20bf5c207",
          "message": "onRedirectNavigate deprecation fix (#7251)\n\nThis PR has two fixes:\r\n1. Deprecating onRedirectNavigate on RedirectRequest requires additional\r\nchanges on StandardController to ensure telemetry measurements are also\r\nbeing taken when onRedirectNavigate is set on the configuration. Tests\r\nare added in PublicClientApplication.\r\n2. Temporary redirect request cache must also be cleared in the event of\r\na back button being clicked during the redirect flow. Assertion added to\r\nexisting test in RedirectClient.",
          "timestamp": "2024-08-13T16:20:21-07:00",
          "tree_id": "5eebc35ecd4b1bd465f74b52df1f25335fd0b686",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/8ad6d1d47aab7259e9bcad6b0c194fa20bf5c207"
        },
        "date": 1723591544117,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 196536,
            "range": "±2.06%",
            "unit": "ops/sec",
            "extra": "226 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 219328,
            "range": "±1.98%",
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
          "id": "2923f266a8d1c969cb1b2f894af65e8323e72612",
          "message": "Post release (#7253)",
          "timestamp": "2024-08-13T16:47:06-07:00",
          "tree_id": "bdf082a5f20189c5d81b8a5fb98d279c3ca66c83",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/2923f266a8d1c969cb1b2f894af65e8323e72612"
        },
        "date": 1723593151054,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190586,
            "range": "±1.92%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 195198,
            "range": "±2.06%",
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
          "id": "5477a2eec3101ef7d4da253760bf97ae639659a5",
          "message": "Revert 'Use high precision TS for NAA message time (#7243)' (#7262)\n\nReverting because:\r\n1. Office parser for `sendTime` is expecting a whole number = mills\r\nsince epoch\r\n2. `sendTime` should be system time, and is used by native to identify\r\nhow long the request took from being initiated to being handled",
          "timestamp": "2024-08-19T13:48:33-04:00",
          "tree_id": "3f3225804d8ee80ca8115958466dd45f67a1517c",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/5477a2eec3101ef7d4da253760bf97ae639659a5"
        },
        "date": 1724090044089,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 188628,
            "range": "±2.03%",
            "unit": "ops/sec",
            "extra": "224 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 196481,
            "range": "±2.14%",
            "unit": "ops/sec",
            "extra": "221 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "me@tylerleonhardt.com",
            "name": "Tyler James Leonhardt",
            "username": "TylerLeonhardt"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "11e86776167826ebd789e77d873ff6ea42030b1b",
          "message": "Use 127.0.0.1 when spinning up local loopback server (#7268)\n\n1. Security: 127.0.0.1 binds the server to the local machine only,\r\nmaking it inaccessible from external networks. 0.0.0.0 binds the server\r\nto all available network interfaces, potentially exposing it to external\r\naccess.\r\n2. Performance: Binding to 127.0.0.1 can be more efficient as it\r\nrestricts traffic to the local machine, avoiding unnecessary network\r\noverhead.\r\n3. Simplicity: Using 127.0.0.1 ensures that only local applications can\r\nconnect, simplifying debugging and reducing the risk of unintended\r\naccess.",
          "timestamp": "2024-08-26T10:11:55-07:00",
          "tree_id": "86f06233f4409bb430b12a3f7fc8e96ecdf2fa75",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/11e86776167826ebd789e77d873ff6ea42030b1b"
        },
        "date": 1724692634269,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 203360,
            "range": "±2.15%",
            "unit": "ops/sec",
            "extra": "214 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 191246,
            "range": "±2.03%",
            "unit": "ops/sec",
            "extra": "213 samples"
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
          "id": "a7d6315a17daf27bb0887fc03a3039a7ba6f57eb",
          "message": "Remove retries for popup and redirect (#7270)\n\nThis PR:\r\n- Fixes error condition in SilentIframeClient\r\n- Removes retries in PopupClient and associated PerformanceEvents\r\n- Removes retries in RedirectClient and associated changes in\r\nStandardController, BrowserCacheManager, and RedirectHandler",
          "timestamp": "2024-08-28T11:53:18-07:00",
          "tree_id": "225cfae6939c67f1ab77816124c6239d52c9f82a",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/a7d6315a17daf27bb0887fc03a3039a7ba6f57eb"
        },
        "date": 1724871535593,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 228717,
            "range": "±1.24%",
            "unit": "ops/sec",
            "extra": "235 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 191046,
            "range": "±1.95%",
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
          "id": "59cf46daab55118ca16fdce264d0b7f1201b0b69",
          "message": "Post-release August 28 2024 (#7281)",
          "timestamp": "2024-08-29T11:05:02-07:00",
          "tree_id": "c794659bd3a1e9d6134fee614ff79b5ab8cc6f2f",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/59cf46daab55118ca16fdce264d0b7f1201b0b69"
        },
        "date": 1724955031827,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 208850,
            "range": "±2.11%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 188814,
            "range": "±1.73%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "90d4f6f0cf5ca4ca1ba695ec889761700784ffce",
          "message": "changed UX selectors to id and name for e2e tests (#7260)\n\nMoving all their UX identifiers from id to class names. This PR\r\naddresses this change for our e2e tests to identify UX elements by ids\r\nas well as class names where applicable.",
          "timestamp": "2024-08-30T12:07:39-07:00",
          "tree_id": "2172481216fdc63c70be9644ebbadd78132c6cc1",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/90d4f6f0cf5ca4ca1ba695ec889761700784ffce"
        },
        "date": 1725045177552,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 188748,
            "range": "±2.00%",
            "unit": "ops/sec",
            "extra": "214 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 186560,
            "range": "±2.16%",
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
          "id": "7c12d6d3e574a45c0f5d4a81d79c7a39f6195da5",
          "message": "Post-release Sept 03 2024 (#7290)",
          "timestamp": "2024-09-03T15:17:55-07:00",
          "tree_id": "279d321a2072b3693c0b67eb0b0a6770afcdc923",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/7c12d6d3e574a45c0f5d4a81d79c7a39f6195da5"
        },
        "date": 1725402203089,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 194069,
            "range": "±2.16%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 183861,
            "range": "±1.89%",
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
          "id": "5cd28fe0905672556b3bc60d951ff3c8361d0d95",
          "message": "Add __initializeNestedAppAuth function for Nested App Auth (#7289)\n\nAdd a function call to `__initializeNestedAppAuth` that can be used to\r\nsetup Nested App Auth dependencies such as the bridge. It is an optional\r\nfunction, and may only be needed in some implementations.",
          "timestamp": "2024-09-05T12:16:06-07:00",
          "tree_id": "2501075ae05282ad6cead26b9991b575c18718c4",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/5cd28fe0905672556b3bc60d951ff3c8361d0d95"
        },
        "date": 1725564101733,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 191751,
            "range": "±2.02%",
            "unit": "ops/sec",
            "extra": "230 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 182471,
            "range": "±2.11%",
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
          "id": "5c0759850335576de6ce18bd451187c5c9718799",
          "message": "Add clientLibrary and clientLibraryVersion parameters to NAA request (#7297)\n\nAdd clientLibrary and clientLibraryVersion parameters to NAA request for\r\ndiagnostic purpose.",
          "timestamp": "2024-09-09T14:33:56-07:00",
          "tree_id": "ab9e7a9aa909ad60d205a5c7d21b14650094fae3",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/5c0759850335576de6ce18bd451187c5c9718799"
        },
        "date": 1725917969852,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 192763,
            "range": "±2.29%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 189353,
            "range": "±1.98%",
            "unit": "ops/sec",
            "extra": "222 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "jason8399@gmail.com",
            "name": "JasonPan",
            "username": "jason8399"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e07b676e9f8f54190349f94e7c40113d377781a4",
          "message": "Fix type for vue 3 sample  (#7291)\n\nAssign type annotation to Vue 3 sample to fix #6706\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-09-10T09:36:40-07:00",
          "tree_id": "8ba8693884ef84289550bce15d4399415d594f20",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/e07b676e9f8f54190349f94e7c40113d377781a4"
        },
        "date": 1725986539442,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 177155,
            "range": "±1.96%",
            "unit": "ops/sec",
            "extra": "218 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 184357,
            "range": "±2.21%",
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
          "id": "55e26e0bea0f9b4b001beb587d6bfebf5980fc9b",
          "message": "Bump webpack from 5.93.0 to 5.94.0 (#7282)\n\nBumps [webpack](https://github.com/webpack/webpack) from 5.93.0 to\r\n5.94.0.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/webpack/webpack/releases\">webpack's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>v5.94.0</h2>\r\n<h2>Bug Fixes</h2>\r\n<ul>\r\n<li>Added runtime condition for harmony reexport checked</li>\r\n<li>Handle properly\r\n<code>data</code>/<code>http</code>/<code>https</code> protocols in\r\nsource maps</li>\r\n<li>Make <code>bigint</code> optimistic when browserslist not found</li>\r\n<li>Move <code>@​types/eslint-scope</code> to dev deps</li>\r\n<li>Related in asset stats is now always an array when no related\r\nfound</li>\r\n<li>Handle ASI for export declarations</li>\r\n<li>Mangle destruction incorrect with export named default properly</li>\r\n<li>Fixed unexpected asi generation with sequence expression</li>\r\n<li>Fixed a lot of types</li>\r\n</ul>\r\n<h2>New Features</h2>\r\n<ul>\r\n<li>Added new external type &quot;module-import&quot;</li>\r\n<li>Support <code>webpackIgnore</code> for <code>new URL()</code>\r\nconstruction</li>\r\n<li>[CSS] <code>@import</code> pathinfo support</li>\r\n</ul>\r\n<h2>Security</h2>\r\n<ul>\r\n<li>Fixed DOM clobbering in auto public path</li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/webpack/webpack/commit/eabf85d8580dfcb876b56957ba5488222a4f7873\"><code>eabf85d</code></a>\r\nchore(release): 5.94.0</li>\r\n<li><a\r\nhref=\"https://github.com/webpack/webpack/commit/955e057abc6cc83cbc3fa1e1ef67a49758bf5a61\"><code>955e057</code></a>\r\nsecurity: fix DOM clobbering in auto public path</li>\r\n<li><a\r\nhref=\"https://github.com/webpack/webpack/commit/98223873625a029b9903d5ec6c0235b8f9fb5a66\"><code>9822387</code></a>\r\ntest: fix</li>\r\n<li><a\r\nhref=\"https://github.com/webpack/webpack/commit/cbb86ede32ab53d8eade6efee30da2463f0082ec\"><code>cbb86ed</code></a>\r\ntest: fix</li>\r\n<li><a\r\nhref=\"https://github.com/webpack/webpack/commit/5ac3d7f2cdce6da63a8dfb07e9dbbd95756bf7a2\"><code>5ac3d7f</code></a>\r\nfix: unexpected asi generation with sequence expression</li>\r\n<li><a\r\nhref=\"https://github.com/webpack/webpack/commit/2411661bd1bedf1b2efc23c76d595c189425d39f\"><code>2411661</code></a>\r\nsecurity: fix DOM clobbering in auto public path</li>\r\n<li><a\r\nhref=\"https://github.com/webpack/webpack/commit/b8c03d47726a57e0dc6ba58b4f96f0e81b168268\"><code>b8c03d4</code></a>\r\nfix: unexpected asi generation with sequence expression</li>\r\n<li><a\r\nhref=\"https://github.com/webpack/webpack/commit/f46a03ccbc2b96ff3552642fea0d7402f7880865\"><code>f46a03c</code></a>\r\nrevert: do not use heuristic fallback for &quot;module-import&quot;</li>\r\n<li><a\r\nhref=\"https://github.com/webpack/webpack/commit/60f189871a4cdc5d595663d6babadac74f2f6a7d\"><code>60f1898</code></a>\r\nfix: do not use heuristic fallback for &quot;module-import&quot;</li>\r\n<li><a\r\nhref=\"https://github.com/webpack/webpack/commit/66306aa45659ef4e8dac8226798931c228fdb204\"><code>66306aa</code></a>\r\nRevert &quot;fix: module-import get fallback from\r\nexternalsPresets&quot;</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/webpack/webpack/compare/v5.93.0...v5.94.0\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=webpack&package-manager=npm_and_yarn&previous-version=5.93.0&new-version=5.94.0)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-09-10T09:39:03-07:00",
          "tree_id": "01a90e450dfce242db2b7934fb9c0b103ca14f67",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/55e26e0bea0f9b4b001beb587d6bfebf5980fc9b"
        },
        "date": 1725986674585,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 196696,
            "range": "±2.06%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 203267,
            "range": "±2.14%",
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
          "id": "4eafa38c2fc860a1fd1115b8625b61ca77f95595",
          "message": "Bump body-parser from 1.20.2 to 1.20.3 (#7302)\n\nBumps [body-parser](https://github.com/expressjs/body-parser) from\r\n1.20.2 to 1.20.3.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/expressjs/body-parser/releases\">body-parser's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>1.20.3</h2>\r\n<h2>What's Changed</h2>\r\n<h3>Important</h3>\r\n<ul>\r\n<li>deps: qs@6.13.0</li>\r\n<li>add <code>depth</code> option to customize the depth level in the\r\nparser</li>\r\n<li><strong>IMPORTANT:</strong> The default <code>depth</code> level for\r\nparsing URL-encoded data is now <code>32</code> (previously was\r\n<code>Infinity</code>). <a\r\nhref=\"https://github.com/expressjs/body-parser/blob/17529513673e39ba79886a7ce3363320cf1c0c50/README.md#depth\">Documentation</a></li>\r\n</ul>\r\n<h3>Other changes</h3>\r\n<ul>\r\n<li>chore: add support for OSSF scorecard reporting by <a\r\nhref=\"https://github.com/inigomarquinez\"><code>@​inigomarquinez</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/expressjs/body-parser/pull/522\">expressjs/body-parser#522</a></li>\r\n<li>ci: fix errors in ci github action for node 8 and 9 by <a\r\nhref=\"https://github.com/inigomarquinez\"><code>@​inigomarquinez</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/expressjs/body-parser/pull/523\">expressjs/body-parser#523</a></li>\r\n<li>fix: pin to node@22.4.1 by <a\r\nhref=\"https://github.com/wesleytodd\"><code>@​wesleytodd</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/body-parser/pull/527\">expressjs/body-parser#527</a></li>\r\n<li>deps: qs@6.12.3 by <a\r\nhref=\"https://github.com/melikhov-dev\"><code>@​melikhov-dev</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/expressjs/body-parser/pull/521\">expressjs/body-parser#521</a></li>\r\n<li>Add OSSF Scorecard badge by <a\r\nhref=\"https://github.com/bjohansebas\"><code>@​bjohansebas</code></a> in\r\n<a\r\nhref=\"https://redirect.github.com/expressjs/body-parser/pull/531\">expressjs/body-parser#531</a></li>\r\n<li>Linter by <a\r\nhref=\"https://github.com/UlisesGascon\"><code>@​UlisesGascon</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/expressjs/body-parser/pull/534\">expressjs/body-parser#534</a></li>\r\n<li>Release: 1.20.3 by <a\r\nhref=\"https://github.com/UlisesGascon\"><code>@​UlisesGascon</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/expressjs/body-parser/pull/535\">expressjs/body-parser#535</a></li>\r\n</ul>\r\n<h2>New Contributors</h2>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/inigomarquinez\"><code>@​inigomarquinez</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/expressjs/body-parser/pull/522\">expressjs/body-parser#522</a></li>\r\n<li><a\r\nhref=\"https://github.com/melikhov-dev\"><code>@​melikhov-dev</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/expressjs/body-parser/pull/521\">expressjs/body-parser#521</a></li>\r\n<li><a\r\nhref=\"https://github.com/bjohansebas\"><code>@​bjohansebas</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/expressjs/body-parser/pull/531\">expressjs/body-parser#531</a></li>\r\n<li><a\r\nhref=\"https://github.com/UlisesGascon\"><code>@​UlisesGascon</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/expressjs/body-parser/pull/534\">expressjs/body-parser#534</a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/expressjs/body-parser/compare/1.20.2...1.20.3\">https://github.com/expressjs/body-parser/compare/1.20.2...1.20.3</a></p>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/expressjs/body-parser/blob/master/HISTORY.md\">body-parser's\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h1>1.20.3 / 2024-09-10</h1>\r\n<ul>\r\n<li>deps: qs@6.13.0</li>\r\n<li>add <code>depth</code> option to customize the depth level in the\r\nparser</li>\r\n<li>IMPORTANT: The default <code>depth</code> level for parsing\r\nURL-encoded data is now <code>32</code> (previously was\r\n<code>Infinity</code>)</li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/expressjs/body-parser/commit/17529513673e39ba79886a7ce3363320cf1c0c50\"><code>1752951</code></a>\r\n1.20.3</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/body-parser/commit/39744cfe2ac4fb37a19ed7c43e3a74332f428e17\"><code>39744cf</code></a>\r\nchore: linter (<a\r\nhref=\"https://redirect.github.com/expressjs/body-parser/issues/534\">#534</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/body-parser/commit/b2695c4450f06ba3b0ccf48d872a229bb41c9bce\"><code>b2695c4</code></a>\r\nMerge commit from fork</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/body-parser/commit/ade0f3f82f91086d6cd2ed2cb4b0aff448fbc2e5\"><code>ade0f3f</code></a>\r\nadd scorecard to readme (<a\r\nhref=\"https://redirect.github.com/expressjs/body-parser/issues/531\">#531</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/body-parser/commit/99a1bd62456f932004b84767d6393bc261f75d36\"><code>99a1bd6</code></a>\r\ndeps: qs@6.12.3 (<a\r\nhref=\"https://redirect.github.com/expressjs/body-parser/issues/521\">#521</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/body-parser/commit/947859160527c7aaaa20da79e2c3ba542baaaf66\"><code>9478591</code></a>\r\nfix: pin to node@22.4.1</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/body-parser/commit/83db46a1e5512135ce01ed90b9132ee16a2657a8\"><code>83db46a</code></a>\r\nci: fix errors in ci github action for node 8 and 9 (<a\r\nhref=\"https://redirect.github.com/expressjs/body-parser/issues/523\">#523</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/body-parser/commit/9d4e2125b580b055b2a3aa140df9b8fce363af46\"><code>9d4e212</code></a>\r\nchore: add support for OSSF scorecard reporting (<a\r\nhref=\"https://redirect.github.com/expressjs/body-parser/issues/522\">#522</a>)</li>\r\n<li>See full diff in <a\r\nhref=\"https://github.com/expressjs/body-parser/compare/1.20.2...1.20.3\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<details>\r\n<summary>Maintainer changes</summary>\r\n<p>This version was pushed to npm by <a\r\nhref=\"https://www.npmjs.com/~ulisesgascon\">ulisesgascon</a>, a new\r\nreleaser for body-parser since your current version.</p>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=body-parser&package-manager=npm_and_yarn&previous-version=1.20.2&new-version=1.20.3)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-09-10T09:51:10-07:00",
          "tree_id": "77bc84e166c77906671eba6e6fd2a4c1c4ca3153",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/4eafa38c2fc860a1fd1115b8625b61ca77f95595"
        },
        "date": 1725987406961,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 188283,
            "range": "±2.20%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 209523,
            "range": "±1.87%",
            "unit": "ops/sec",
            "extra": "224 samples"
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
          "id": "d80a5ce2c6edfd6c6e67febc4ae8ef80752786f0",
          "message": "Bump micromatch from 4.0.7 to 4.0.8 (#7283)\n\nBumps [micromatch](https://github.com/micromatch/micromatch) from 4.0.7\r\nto 4.0.8.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/micromatch/micromatch/releases\">micromatch's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>4.0.8</h2>\r\n<p>Ultimate release that fixes both CVE-2024-4067 and CVE-2024-4068. We\r\nconsider the issues low-priority, so even if you see automated scanners\r\nsaying otherwise, don't be scared.</p>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/micromatch/micromatch/blob/master/CHANGELOG.md\">micromatch's\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h2>[4.0.8] - 2024-08-22</h2>\r\n<ul>\r\n<li>backported CVE-2024-4067 fix (from v4.0.6) over to 4.x branch</li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/micromatch/micromatch/commit/8bd704ec0d9894693d35da425d827819916be920\"><code>8bd704e</code></a>\r\n4.0.8</li>\r\n<li><a\r\nhref=\"https://github.com/micromatch/micromatch/commit/a0e68416a44da10f3e4e30845ab95af4fd286d5a\"><code>a0e6841</code></a>\r\nrun verb to generate README documentation</li>\r\n<li><a\r\nhref=\"https://github.com/micromatch/micromatch/commit/4ec288484f6e8cccf597ad3d43529c31d0f7a02a\"><code>4ec2884</code></a>\r\nMerge branch 'v4' into hauserkristof-feature/v4.0.8</li>\r\n<li><a\r\nhref=\"https://github.com/micromatch/micromatch/commit/03aa8052171e878897eee5d7bb2ae0ae83ec2ade\"><code>03aa805</code></a>\r\nMerge pull request <a\r\nhref=\"https://redirect.github.com/micromatch/micromatch/issues/266\">#266</a>\r\nfrom hauserkristof/feature/v4.0.8</li>\r\n<li><a\r\nhref=\"https://github.com/micromatch/micromatch/commit/814f5f70efcd100ca9d29198867812a3d6ab91a8\"><code>814f5f7</code></a>\r\nlint</li>\r\n<li><a\r\nhref=\"https://github.com/micromatch/micromatch/commit/67fcce6a1077c2faf5ad0c5f998fa70202cc5dae\"><code>67fcce6</code></a>\r\nfix: CHANGELOG about braces &amp; CVE-2024-4068, v4.0.5</li>\r\n<li><a\r\nhref=\"https://github.com/micromatch/micromatch/commit/113f2e3fa7cb30b429eda7c4c38475a8e8ba1b30\"><code>113f2e3</code></a>\r\nfix: CVE numbers in CHANGELOG</li>\r\n<li><a\r\nhref=\"https://github.com/micromatch/micromatch/commit/d9dbd9a266686f44afb38da26fe016f96d1ec04f\"><code>d9dbd9a</code></a>\r\nfeat: updated CHANGELOG</li>\r\n<li><a\r\nhref=\"https://github.com/micromatch/micromatch/commit/2ab13157f416679f54e3a32b1425e184bd16749e\"><code>2ab1315</code></a>\r\nfix: use actions/setup-node@v4</li>\r\n<li><a\r\nhref=\"https://github.com/micromatch/micromatch/commit/1406ea38f3e24b29f4d4f46908d5cffcb3e6c4ce\"><code>1406ea3</code></a>\r\nfeat: rework test to work on macos with node 10,12 and 14</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/micromatch/micromatch/compare/4.0.7...4.0.8\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=micromatch&package-manager=npm_and_yarn&previous-version=4.0.7&new-version=4.0.8)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-09-10T11:03:22-07:00",
          "tree_id": "c450c902e5683e0dea4b53243120799263a47db0",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/d80a5ce2c6edfd6c6e67febc4ae8ef80752786f0"
        },
        "date": 1725991731740,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 191258,
            "range": "±2.21%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 188776,
            "range": "±1.95%",
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
          "id": "1883b5e79501ada5c717923a826da72e0edcb454",
          "message": "Add optional \"instanceAware\" config auth param (#7259)\n\nThis PR addresses a scenario when an app uses\r\n[instance_aware](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/instance-aware.md)\r\nflag to perform an additional endpoint discovery using cloud instance\r\nhost name provided by the identity provider before making a request to\r\nthe /token endpoint. This may cause a mismatch between a configured\r\nauthority and an account environment.\r\n\r\nFor example, a Gov user is authenticated with acquire token redirect\r\nAPI. User is redirected from \"https://login.microsoftonline.com/common\"\r\n(set as an authority in the config) to\r\n\"https://login.microsoftonline.us/common\" by the identity provider. The\r\nresponse account environment is then set to \"login.microsoftonline.us\"\r\nthat does not match the configured one, making MSAL.js throw an\r\n[authority_mismatch\r\nerror](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/69df8f629eb149b86479afcbf076b91c76946152/lib/msal-browser/src/interaction_client/BaseInteractionClient.ts#L229)\r\nfor any consequent API call that provides an account object.\r\n\r\nTo fix that a new `instanceAware` auth config param is introduced that\r\nenables consistent auth metadata resolution across API calls.",
          "timestamp": "2024-09-10T21:23:54-04:00",
          "tree_id": "1743f43f384e387fb3596311d1de284e2b3c2685",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/1883b5e79501ada5c717923a826da72e0edcb454"
        },
        "date": 1726018160338,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 192987,
            "range": "±1.99%",
            "unit": "ops/sec",
            "extra": "224 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 193973,
            "range": "±1.94%",
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
          "id": "22d3070a860fc6b301589af9cefa0cecbb6f4e14",
          "message": "msal-node Device Code flow unit test - replaced sinon with jest (#7285)\n\nAll sinon functionality in msal-node's device code flow unit test file\r\nhas been replaced with jest.\r\n\r\nSinon is no longer a dependency of msal-node.",
          "timestamp": "2024-09-11T15:32:18-04:00",
          "tree_id": "bdf84626c87d905a132fadceccac9639dbedef7e",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/22d3070a860fc6b301589af9cefa0cecbb6f4e14"
        },
        "date": 1726083460732,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 191959,
            "range": "±2.09%",
            "unit": "ops/sec",
            "extra": "225 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 190248,
            "range": "±2.03%",
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
          "id": "fe1f5db605c10508f92ab661c5f59f6573d251a2",
          "message": "Bump package versions",
          "timestamp": "2024-09-17T14:33:59Z",
          "tree_id": "14a3c9c2c46f97774fdf647c4f2314ae910e82c1",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/fe1f5db605c10508f92ab661c5f59f6573d251a2"
        },
        "date": 1726583970658,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 193471,
            "range": "±2.10%",
            "unit": "ops/sec",
            "extra": "224 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 198571,
            "range": "±2.13%",
            "unit": "ops/sec",
            "extra": "233 samples"
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
          "id": "22d3070a860fc6b301589af9cefa0cecbb6f4e14",
          "message": "msal-node Device Code flow unit test - replaced sinon with jest (#7285)\n\nAll sinon functionality in msal-node's device code flow unit test file\r\nhas been replaced with jest.\r\n\r\nSinon is no longer a dependency of msal-node.",
          "timestamp": "2024-09-11T15:32:18-04:00",
          "tree_id": "bdf84626c87d905a132fadceccac9639dbedef7e",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/22d3070a860fc6b301589af9cefa0cecbb6f4e14"
        },
        "date": 1726603179485,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 186735,
            "range": "±2.04%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187385,
            "range": "±2.16%",
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
          "id": "6877726fa3c655824d4e44f064b4b045e64964fc",
          "message": "Allow passing popup parent for multi-window flows (#7313) (#7317)\n\nOutlook has multi-window scenarios where MSAL code is running in the\r\nmain window, but being rendered into a popup window. This is interfering\r\nwith MSAL popup token flows, because the click/user interaction is being\r\ndone in the popup window, but the call to MSAL acquireTokenPopup is\r\nbeing done in the separate main window, and so when MSAL goes to call\r\n`window.open`, the browser is blocking the popup as the interaction did\r\nnot occur in the same window and `popup_window_error` is returned.\r\n\r\nThe proposed fix is to add a `popupWindowParent` parameter to the\r\n`PopupRequest` interface, which MSAL will use instead of `window` when\r\ninvoking `window.open`. This makes the browser happy that the popup is\r\nbeing opened and parented to the same window where the interaction\r\noccurred. It also fixes UI parenting/z-index issues with the MSAL popup.\r\n\r\nIf a `popupWindowParent` is not specified, then today's behaviour is\r\npreserved, and `window` is used.\r\n\r\ncc @Salaman\r\n\r\n---------\r\n\r\nCo-authored-by: Chris Paslawski <salaman@users.noreply.github.com>",
          "timestamp": "2024-09-18T10:32:43-07:00",
          "tree_id": "57ca34dfa8778a3b7f7fe82ffe07f5322a3dbe68",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/6877726fa3c655824d4e44f064b4b045e64964fc"
        },
        "date": 1726681085768,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 198243,
            "range": "±2.15%",
            "unit": "ops/sec",
            "extra": "214 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 207186,
            "range": "±1.91%",
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
          "id": "330e8073dc16e7a83fce0460feecb2aef24ac4a6",
          "message": "Use windows pools for e2e tests (#7310)\n\nMakes pool type configurable at the pipeline and template level for E2E\r\ntests and changes default to windows pool",
          "timestamp": "2024-09-19T10:51:14-07:00",
          "tree_id": "18408b7f93ee865ba67a9bd0640b9ec099a34286",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/330e8073dc16e7a83fce0460feecb2aef24ac4a6"
        },
        "date": 1726768597144,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 192602,
            "range": "±2.27%",
            "unit": "ops/sec",
            "extra": "207 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 186101,
            "range": "±2.12%",
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
          "id": "5a68dbbcf015629316b842c1ea577718fd15dca7",
          "message": "Fix type resolution when using moduleResolution node16 (#7284)\n\nType resolution is broken for node16 resolution type due to several\r\nissues, this PR:\r\n\r\n- Updates all relative imports to include .js file extension, as\r\nrequired by node16 resolution\r\n- Includes type declaration files from lib folder in package publish\r\n- Adds package.json file to `lib` folder to indicate contents are\r\ncommonjs\r\n- Updates package exports field to point to the appropriate type\r\ndeclaration files for ESM or CJS\r\n- Adds browser and node subpaths to msal-common export to separate\r\nnode-only and browser-only features\r\n\r\nFixes #6781 #6487 #6269\r\n\r\n---------\r\n\r\nCo-authored-by: Hector Morales <hemoral@microsoft.com>",
          "timestamp": "2024-09-19T11:52:54-07:00",
          "tree_id": "3bc36991163dc1ee15e1f498c0e59691330aa8d3",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/5a68dbbcf015629316b842c1ea577718fd15dca7"
        },
        "date": 1726772319272,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 208106,
            "range": "±1.46%",
            "unit": "ops/sec",
            "extra": "235 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 184643,
            "range": "±2.23%",
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
          "id": "1111b2cb77d7ae26dd0b57719953f7d1fb3c3de9",
          "message": "Update CODEOWNERS (#7321)",
          "timestamp": "2024-09-19T16:00:44-07:00",
          "tree_id": "ff11d20a0a97b2b7a80b5c97720789d2ee9b5ae5",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/1111b2cb77d7ae26dd0b57719953f7d1fb3c3de9"
        },
        "date": 1726787182026,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 194787,
            "range": "±1.97%",
            "unit": "ops/sec",
            "extra": "223 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 189391,
            "range": "±2.12%",
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
          "id": "7891e792a3afbd4e642ec90dd8660e20ff26a381",
          "message": "Bump package versions",
          "timestamp": "2024-09-19T23:52:58Z",
          "tree_id": "13269d822dd698d68f89b7f012774181d81bab38",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/7891e792a3afbd4e642ec90dd8660e20ff26a381"
        },
        "date": 1726790306669,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 187321,
            "range": "±2.16%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187378,
            "range": "±2.38%",
            "unit": "ops/sec",
            "extra": "206 samples"
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
          "id": "decb0f16eebf7c11c8f033dc936f4a271af567a6",
          "message": "Bump vite from 3.2.10 to 3.2.11 (#7315)\n\nBumps [vite](https://github.com/vitejs/vite/tree/HEAD/packages/vite)\r\nfrom 3.2.10 to 3.2.11.\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/vitejs/vite/blob/v3.2.11/packages/vite/CHANGELOG.md\">vite's\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h2><!-- raw HTML omitted -->3.2.11 (2024-09-17)<!-- raw HTML omitted\r\n--></h2>\r\n<ul>\r\n<li>fix: backport <a\r\nhref=\"https://github.com/vitejs/vite/tree/HEAD/packages/vite/issues/18112\">#18112</a>,\r\nfs raw query (<a\r\nhref=\"https://github.com/vitejs/vite/commit/a6da450\">a6da450</a>),\r\ncloses <a\r\nhref=\"https://redirect.github.com/vitejs/vite/issues/18112\">#18112</a></li>\r\n<li>fix: backport <a\r\nhref=\"https://github.com/vitejs/vite/tree/HEAD/packages/vite/issues/18115\">#18115</a>,\r\nDOM Clobbering in (<a\r\nhref=\"https://github.com/vitejs/vite/commit/2ddd854\">2ddd854</a>),\r\ncloses <a\r\nhref=\"https://redirect.github.com/vitejs/vite/issues/18115\">#18115</a></li>\r\n<li>fix(importAnalysis): backport <a\r\nhref=\"https://github.com/vitejs/vite/tree/HEAD/packages/vite/issues/13712\">#13712</a>,\r\nstrip url base before passing as safeModulePaths (<a\r\nhref=\"https://github.com/vitejs/vite/commit/5d1d81e\">5d1d81e</a>),\r\ncloses <a\r\nhref=\"https://redirect.github.com/vitejs/vite/issues/13712\">#13712</a></li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/vitejs/vite/commit/45b8644543f1adfb9c02bf88461278d9f7119642\"><code>45b8644</code></a>\r\nrelease: v3.2.11</li>\r\n<li><a\r\nhref=\"https://github.com/vitejs/vite/commit/5d1d81ec839bb7070c2b4c78ed2f42bb65ca88b4\"><code>5d1d81e</code></a>\r\nfix(importAnalysis): backport <a\r\nhref=\"https://github.com/vitejs/vite/tree/HEAD/packages/vite/issues/13712\">#13712</a>,\r\nstrip url base before passing as safeMo...</li>\r\n<li><a\r\nhref=\"https://github.com/vitejs/vite/commit/2ddd8541ec3b2d2e5b698749e0f2362ef28056bd\"><code>2ddd854</code></a>\r\nfix: backport <a\r\nhref=\"https://github.com/vitejs/vite/tree/HEAD/packages/vite/issues/18115\">#18115</a>,\r\nDOM Clobbering in</li>\r\n<li><a\r\nhref=\"https://github.com/vitejs/vite/commit/a6da45082b6e73ddfdcdcc06bb5414f976a388d6\"><code>a6da450</code></a>\r\nfix: backport <a\r\nhref=\"https://github.com/vitejs/vite/tree/HEAD/packages/vite/issues/18112\">#18112</a>,\r\nfs raw query</li>\r\n<li>See full diff in <a\r\nhref=\"https://github.com/vitejs/vite/commits/v3.2.11/packages/vite\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=vite&package-manager=npm_and_yarn&previous-version=3.2.10&new-version=3.2.11)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-09-20T10:29:41-07:00",
          "tree_id": "ac82c1ac36dfa81e1efa478bf526efd7fe03fe22",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/decb0f16eebf7c11c8f033dc936f4a271af567a6"
        },
        "date": 1726853698951,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 189663,
            "range": "±2.13%",
            "unit": "ops/sec",
            "extra": "215 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 188779,
            "range": "±2.04%",
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
          "id": "c789378f702ae72f30b0fae8cbd0e5ea6402be56",
          "message": "Bump express from 4.19.2 to 4.20.0 (#7308)\n\nBumps [express](https://github.com/expressjs/express) from 4.19.2 to\r\n4.20.0.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/expressjs/express/releases\">express's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>4.20.0</h2>\r\n<h2>What's Changed</h2>\r\n<h3>Important</h3>\r\n<ul>\r\n<li>IMPORTANT: The default <code>depth</code> level for parsing\r\nURL-encoded data is now <code>32</code> (previously was\r\n<code>Infinity</code>)</li>\r\n<li>Remove link renderization in html while using\r\n<code>res.redirect</code></li>\r\n</ul>\r\n<h3>Other Changes</h3>\r\n<ul>\r\n<li>4.19.2 Staging by <a\r\nhref=\"https://github.com/wesleytodd\"><code>@​wesleytodd</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5561\">expressjs/express#5561</a></li>\r\n<li>remove duplicate location test for data uri by <a\r\nhref=\"https://github.com/wesleytodd\"><code>@​wesleytodd</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5562\">expressjs/express#5562</a></li>\r\n<li>feat: document beta releases expectations by <a\r\nhref=\"https://github.com/marco-ippolito\"><code>@​marco-ippolito</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5565\">expressjs/express#5565</a></li>\r\n<li>Cut down on duplicated CI runs by <a\r\nhref=\"https://github.com/jonchurch\"><code>@​jonchurch</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5564\">expressjs/express#5564</a></li>\r\n<li>Add a Threat Model by <a\r\nhref=\"https://github.com/UlisesGascon\"><code>@​UlisesGascon</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5526\">expressjs/express#5526</a></li>\r\n<li>Assign captain of encodeurl by <a\r\nhref=\"https://github.com/blakeembrey\"><code>@​blakeembrey</code></a> in\r\n<a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5579\">expressjs/express#5579</a></li>\r\n<li>Nominate jonchurch as repo captain for <code>http-errors</code>,\r\n<code>expressjs.com</code>, <code>morgan</code>, <code>cors</code>,\r\n<code>body-parser</code> by <a\r\nhref=\"https://github.com/jonchurch\"><code>@​jonchurch</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5587\">expressjs/express#5587</a></li>\r\n<li>docs: update Security.md by <a\r\nhref=\"https://github.com/inigomarquinez\"><code>@​inigomarquinez</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5590\">expressjs/express#5590</a></li>\r\n<li>docs: update triage nomination policy by <a\r\nhref=\"https://github.com/UlisesGascon\"><code>@​UlisesGascon</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5600\">expressjs/express#5600</a></li>\r\n<li>Add CodeQL (SAST) by <a\r\nhref=\"https://github.com/UlisesGascon\"><code>@​UlisesGascon</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5433\">expressjs/express#5433</a></li>\r\n<li>docs: add UlisesGascon as triage initiative captain by <a\r\nhref=\"https://github.com/UlisesGascon\"><code>@​UlisesGascon</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5605\">expressjs/express#5605</a></li>\r\n<li>deps: encodeurl@~2.0.0 by <a\r\nhref=\"https://github.com/blakeembrey\"><code>@​blakeembrey</code></a> in\r\n<a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5569\">expressjs/express#5569</a></li>\r\n<li>skip QUERY method test by <a\r\nhref=\"https://github.com/jonchurch\"><code>@​jonchurch</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5628\">expressjs/express#5628</a></li>\r\n<li>ignore ETAG query test on 21 and 22, reuse skip util by <a\r\nhref=\"https://github.com/jonchurch\"><code>@​jonchurch</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5639\">expressjs/express#5639</a></li>\r\n<li>add support Node.js@22 in the CI by <a\r\nhref=\"https://github.com/mertcanaltin\"><code>@​mertcanaltin</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5627\">expressjs/express#5627</a></li>\r\n<li>doc: add table of contents, tc/triager lists to readme by <a\r\nhref=\"https://github.com/mertcanaltin\"><code>@​mertcanaltin</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5619\">expressjs/express#5619</a></li>\r\n<li>List and sort all projects, add captains by <a\r\nhref=\"https://github.com/blakeembrey\"><code>@​blakeembrey</code></a> in\r\n<a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5653\">expressjs/express#5653</a></li>\r\n<li>docs: add <a\r\nhref=\"https://github.com/UlisesGascon\"><code>@​UlisesGascon</code></a>\r\nas captain for cookie-parser by <a\r\nhref=\"https://github.com/UlisesGascon\"><code>@​UlisesGascon</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5666\">expressjs/express#5666</a></li>\r\n<li>✨ bring back query tests for node 21 by <a\r\nhref=\"https://github.com/ctcpip\"><code>@​ctcpip</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5690\">expressjs/express#5690</a></li>\r\n<li>[v4] Deprecate <code>res.clearCookie</code> accepting\r\n<code>options.maxAge</code> and <code>options.expires</code> by <a\r\nhref=\"https://github.com/jonchurch\"><code>@​jonchurch</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5672\">expressjs/express#5672</a></li>\r\n<li>skip QUERY tests for Node 21 only, still not supported by <a\r\nhref=\"https://github.com/jonchurch\"><code>@​jonchurch</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5695\">expressjs/express#5695</a></li>\r\n<li>📝 update people, add ctcpip to TC by <a\r\nhref=\"https://github.com/ctcpip\"><code>@​ctcpip</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5683\">expressjs/express#5683</a></li>\r\n<li>remove minor version pinning from ci by <a\r\nhref=\"https://github.com/jonchurch\"><code>@​jonchurch</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5722\">expressjs/express#5722</a></li>\r\n<li>Fix link variable use in attribution section of CODE OF CONDUCT by\r\n<a href=\"https://github.com/IamLizu\"><code>@​IamLizu</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5762\">expressjs/express#5762</a></li>\r\n<li>Replace Appveyor windows testing with GHA by <a\r\nhref=\"https://github.com/jonchurch\"><code>@​jonchurch</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5599\">expressjs/express#5599</a></li>\r\n<li>Add OSSF Scorecard badge by <a\r\nhref=\"https://github.com/UlisesGascon\"><code>@​UlisesGascon</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5436\">expressjs/express#5436</a></li>\r\n<li>update scorecard link by <a\r\nhref=\"https://github.com/bjohansebas\"><code>@​bjohansebas</code></a> in\r\n<a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5814\">expressjs/express#5814</a></li>\r\n<li>Nominate <a\r\nhref=\"https://github.com/IamLizu\"><code>@​IamLizu</code></a> to the\r\ntriage team by <a\r\nhref=\"https://github.com/UlisesGascon\"><code>@​UlisesGascon</code></a>\r\nin <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5836\">expressjs/express#5836</a></li>\r\n<li>deps: path-to-regexp@0.1.8 by <a\r\nhref=\"https://github.com/blakeembrey\"><code>@​blakeembrey</code></a> in\r\n<a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5603\">expressjs/express#5603</a></li>\r\n<li>docs: specify new instructions for <code>question</code> and\r\n<code>discuss</code> by <a\r\nhref=\"https://github.com/IamLizu\"><code>@​IamLizu</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5835\">expressjs/express#5835</a></li>\r\n<li>4.x: Upgrade <code>merge-descriptors</code> dependency by <a\r\nhref=\"https://github.com/RobinTail\"><code>@​RobinTail</code></a> in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5781\">expressjs/express#5781</a></li>\r\n<li>path-to-regexp@0.1.10 by <a\r\nhref=\"https://github.com/blakeembrey\"><code>@​blakeembrey</code></a> in\r\n<a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5902\">expressjs/express#5902</a></li>\r\n</ul>\r\n<h2>New Contributors</h2>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/marco-ippolito\"><code>@​marco-ippolito</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5565\">expressjs/express#5565</a></li>\r\n<li><a\r\nhref=\"https://github.com/inigomarquinez\"><code>@​inigomarquinez</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5590\">expressjs/express#5590</a></li>\r\n<li><a\r\nhref=\"https://github.com/mertcanaltin\"><code>@​mertcanaltin</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5627\">expressjs/express#5627</a></li>\r\n<li><a href=\"https://github.com/ctcpip\"><code>@​ctcpip</code></a> made\r\ntheir first contribution in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5690\">expressjs/express#5690</a></li>\r\n<li><a\r\nhref=\"https://github.com/bjohansebas\"><code>@​bjohansebas</code></a>\r\nmade their first contribution in <a\r\nhref=\"https://redirect.github.com/expressjs/express/pull/5814\">expressjs/express#5814</a></li>\r\n</ul>\r\n<p><strong>Full Changelog</strong>: <a\r\nhref=\"https://github.com/expressjs/express/compare/4.19.1...4.20.0\">https://github.com/expressjs/express/compare/4.19.1...4.20.0</a></p>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/expressjs/express/blob/master/History.md\">express's\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h1>4.20.0 / 2024-09-10</h1>\r\n<ul>\r\n<li>deps: serve-static@0.16.0\r\n<ul>\r\n<li>Remove link renderization in html while redirecting</li>\r\n</ul>\r\n</li>\r\n<li>deps: send@0.19.0\r\n<ul>\r\n<li>Remove link renderization in html while redirecting</li>\r\n</ul>\r\n</li>\r\n<li>deps: body-parser@0.6.0\r\n<ul>\r\n<li>add <code>depth</code> option to customize the depth level in the\r\nparser</li>\r\n<li>IMPORTANT: The default <code>depth</code> level for parsing\r\nURL-encoded data is now <code>32</code> (previously was\r\n<code>Infinity</code>)</li>\r\n</ul>\r\n</li>\r\n<li>Remove link renderization in html while using\r\n<code>res.redirect</code></li>\r\n<li>deps: path-to-regexp@0.1.10\r\n<ul>\r\n<li>Adds support for named matching groups in the routes using a\r\nregex</li>\r\n<li>Adds backtracking protection to parameters without regexes\r\ndefined</li>\r\n</ul>\r\n</li>\r\n<li>deps: encodeurl@~2.0.0\r\n<ul>\r\n<li>Removes encoding of <code>\\</code>, <code>|</code>, and\r\n<code>^</code> to align better with URL spec</li>\r\n</ul>\r\n</li>\r\n<li>Deprecate passing <code>options.maxAge</code> and\r\n<code>options.expires</code> to <code>res.clearCookie</code>\r\n<ul>\r\n<li>Will be ignored in v5, clearCookie will set a cookie with an expires\r\nin the past to instruct clients to delete the cookie</li>\r\n</ul>\r\n</li>\r\n</ul>\r\n</blockquote>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/21df421ebc7a5249bb31101da666bbf22adc3f18\"><code>21df421</code></a>\r\n4.20.0</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/4c9ddc1c47bf579e55c2fe837d76a952e9fd8959\"><code>4c9ddc1</code></a>\r\nfeat: upgrade to serve-static@0.16.0</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/9ebe5d500d22cbb2b8aaa73446866b084c747971\"><code>9ebe5d5</code></a>\r\nfeat: upgrade to send@0.19.0 (<a\r\nhref=\"https://redirect.github.com/expressjs/express/issues/5928\">#5928</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/ec4a01b6b8814d7b007f36a3023f4dbafdbc3d09\"><code>ec4a01b</code></a>\r\nfeat: upgrade to body-parser@1.20.3 (<a\r\nhref=\"https://redirect.github.com/expressjs/express/issues/5926\">#5926</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/54271f69b511fea198471e6ff3400ab805d6b553\"><code>54271f6</code></a>\r\nfix: don't render redirect values in anchor href</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/125bb742a38cd97938a3932b47cc301e41c31f5d\"><code>125bb74</code></a>\r\npath-to-regexp@0.1.10 (<a\r\nhref=\"https://redirect.github.com/expressjs/express/issues/5902\">#5902</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/2a980ad16052e53b398c9953fea50e3daa0b495c\"><code>2a980ad</code></a>\r\nmerge-descriptors@1.0.3 (<a\r\nhref=\"https://redirect.github.com/expressjs/express/issues/5781\">#5781</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/a3e7e05e0a435b7b4be25bd38d8d0ca19a773ca9\"><code>a3e7e05</code></a>\r\ndocs: specify new instructions for <code>question</code> and\r\n<code>discuss</code></li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/c5addb9a17c5b4c9fccdd2c04153a30595e03385\"><code>c5addb9</code></a>\r\ndeps: path-to-regexp@0.1.8 (<a\r\nhref=\"https://redirect.github.com/expressjs/express/issues/5603\">#5603</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/expressjs/express/commit/e35380a39d94937e3d0f7119e0efbc7cd69d003f\"><code>e35380a</code></a>\r\ndocs: add <a\r\nhref=\"https://github.com/IamLizu\"><code>@​IamLizu</code></a> to the\r\ntriage team (<a\r\nhref=\"https://redirect.github.com/expressjs/express/issues/5836\">#5836</a>)</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/expressjs/express/compare/4.19.2...4.20.0\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=express&package-manager=npm_and_yarn&previous-version=4.19.2&new-version=4.20.0)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-09-20T11:52:15-07:00",
          "tree_id": "6c97c1c64cfb9077d5fd6abe725e22eb638c322f",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/c789378f702ae72f30b0fae8cbd0e5ea6402be56"
        },
        "date": 1726858644224,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 210095,
            "range": "±1.06%",
            "unit": "ops/sec",
            "extra": "200 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 190419,
            "range": "±2.11%",
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
          "id": "b5bac46dd867cb8904e96800f1e6ab1e26bc7b8b",
          "message": "Bump next from 14.2.5 to 14.2.10 (#7320)\n\nBumps [next](https://github.com/vercel/next.js) from 14.2.5 to 14.2.10.\r\n<details>\r\n<summary>Release notes</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/vercel/next.js/releases\">next's\r\nreleases</a>.</em></p>\r\n<blockquote>\r\n<h2>v14.2.10</h2>\r\n<blockquote>\r\n<p>[!NOTE]<br />\r\nThis release is backporting bug fixes. It does <strong>not</strong>\r\ninclude all pending features/changes on canary.</p>\r\n</blockquote>\r\n<h3>Core Changes</h3>\r\n<ul>\r\n<li>Remove invalid fallback revalidate value (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/pull/69990\">vercel/next.js#69990</a>)</li>\r\n<li>Revert server action optimization (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/pull/69925\">vercel/next.js#69925</a>)</li>\r\n<li>Add ability to customize Cache-Control (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/69802\">#69802</a>)</li>\r\n</ul>\r\n<h3>Credits</h3>\r\n<p>Huge thanks to <a\r\nhref=\"https://github.com/huozhi\"><code>@​huozhi</code></a> and <a\r\nhref=\"https://github.com/ijjk\"><code>@​ijjk</code></a> for helping!</p>\r\n<h2>v14.2.9</h2>\r\n<blockquote>\r\n<p>[!NOTE]<br />\r\nThis release is backporting bug fixes. It does <strong>not</strong>\r\ninclude all pending features/changes on canary.</p>\r\n</blockquote>\r\n<h3>Core Changes</h3>\r\n<ul>\r\n<li>Revert &quot;Fix esm property def in flight loader (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/66990\">#66990</a>)&quot;\r\n(<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/69749\">#69749</a>)</li>\r\n<li>Disable experimental.optimizeServer by default to fix failed server\r\naction (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/69788\">#69788</a>)</li>\r\n<li>Fix middleware fallback: false case (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/69799\">#69799</a>)</li>\r\n<li>Fix status code for /_not-found route (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/64058\">#64058</a>)\r\n(<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/69808\">#69808</a>)</li>\r\n<li>Fix metadata prop merging (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/69807\">#69807</a>)</li>\r\n<li>create-next-app: fix font file corruption when using import alias\r\n(<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/69806\">#69806</a>)</li>\r\n</ul>\r\n<h3>Credits</h3>\r\n<p>Huge thanks to <a\r\nhref=\"https://github.com/huozhi\"><code>@​huozhi</code></a>, <a\r\nhref=\"https://github.com/ztanner\"><code>@​ztanner</code></a>, <a\r\nhref=\"https://github.com/ijjk\"><code>@​ijjk</code></a>, and <a\r\nhref=\"https://github.com/lubieowoce\"><code>@​lubieowoce</code></a> for\r\nhelping!</p>\r\n<h2>v14.2.8</h2>\r\n<h2>What's Changed</h2>\r\n<blockquote>\r\n<p>[!NOTE]<br />\r\nThis release is backporting bug fixes and minor improvements. It does\r\n<strong>not</strong> include all pending features/changes on canary.</p>\r\n</blockquote>\r\n<h3>Support <code>esmExternals</code> in app directory</h3>\r\n<ul>\r\n<li>Support esm externals in app router (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/65041\">#65041</a>)</li>\r\n<li>Turbopack: Allow client components from foreign code in app routes\r\n(<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/64751\">#64751</a>)</li>\r\n<li>Turbopack: add support for esm externals in app dir (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/64918\">#64918</a>)</li>\r\n<li>other related PRs: <a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/66990\">#66990</a>\r\n<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/66727\">#66727</a>\r\n<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/66286\">#66286</a>\r\n<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/65519\">#65519</a></li>\r\n</ul>\r\n<h3>Reading cookies set in middleware in components and actions</h3>\r\n<ul>\r\n<li>initialize ALS with cookies in middleware (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/65008\">#65008</a>)</li>\r\n<li>fix middleware cookie initialization (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/65820\">#65820</a>)</li>\r\n<li>ensure cookies set in middleware can be read in a server action (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/67924\">#67924</a>)</li>\r\n<li>fix: merged middleware cookies should preserve options (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/67956\">#67956</a>)</li>\r\n</ul>\r\n<!-- raw HTML omitted -->\r\n</blockquote>\r\n<p>... (truncated)</p>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/937651fede26a1cdd8a83aa4636719e466fa7f20\"><code>937651f</code></a>\r\nv14.2.10</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/7ed7f125e07ef0517a331009ed7e32691ba403d3\"><code>7ed7f12</code></a>\r\nRemove invalid fallback revalidate value (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/69990\">#69990</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/99de0573009208e584d10a810ed84c4b6cf9b4fe\"><code>99de057</code></a>\r\nRevert server action optimization (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/69925\">#69925</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/24647b9a3a6f0b914423c95a59cd6fcc81caa778\"><code>24647b9</code></a>\r\nAdd ability to customize Cache-Control (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/69802\">#69802</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/6fa8982f8eb766663fd1e11e43621e53fd8e016c\"><code>6fa8982</code></a>\r\nv14.2.9</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/7998745f37ce0ccd8c9cee28c613869a364a1737\"><code>7998745</code></a>\r\ntest: lock ts type check (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/69889\">#69889</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/4bd3849ccde073cc4c64e0ebfb1ec1b6d5a3ca00\"><code>4bd3849</code></a>\r\ncreate-next-app: fix font file corruption when using import alias (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/69806\">#69806</a>)</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/375680103bbcf581a9b552e06ea2070def4a4936\"><code>3756801</code></a>\r\ntest: check most possible combination of CNA flags</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/9a72ad6e618ba81601ff15359f29f72cce45b878\"><code>9a72ad6</code></a>\r\nunpin CNA tests from 14.2.3</li>\r\n<li><a\r\nhref=\"https://github.com/vercel/next.js/commit/747d365004e722b7806ba4560edd4d85b51cb67e\"><code>747d365</code></a>\r\nFix metadata prop merging (<a\r\nhref=\"https://redirect.github.com/vercel/next.js/issues/69807\">#69807</a>)</li>\r\n<li>Additional commits viewable in <a\r\nhref=\"https://github.com/vercel/next.js/compare/v14.2.5...v14.2.10\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=next&package-manager=npm_and_yarn&previous-version=14.2.5&new-version=14.2.10)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-09-20T13:54:44-07:00",
          "tree_id": "0780b1115b36ecf0d1eb26142bdacef548438aa3",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/b5bac46dd867cb8904e96800f1e6ab1e26bc7b8b"
        },
        "date": 1726866012888,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 207408,
            "range": "±2.07%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 186923,
            "range": "±2.18%",
            "unit": "ops/sec",
            "extra": "221 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "bill.voltmer@elationtech.us",
            "name": "billvolt",
            "username": "billvolt"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "2e9c0d3affe5e6bd1f643caa0e3224aad7335d4a",
          "message": "Correct cut & paste error in build instruction -- build browser & common  (#7237)\n\nThe comment inside did not match the comment above. The instructions are\r\nmeant to build both browser and common.\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-09-20T13:56:31-07:00",
          "tree_id": "e974ef1a86d580237723f241dbb91e462c3892ca",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/2e9c0d3affe5e6bd1f643caa0e3224aad7335d4a"
        },
        "date": 1726866120256,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 184178,
            "range": "±2.14%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 191823,
            "range": "±2.14%",
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
          "id": "fafaada5ecfee546f33cbc196b71c06008ebf0a9",
          "message": "Bump rollup from 3.29.4 to 3.29.5 (#7332)\n\nBumps [rollup](https://github.com/rollup/rollup) from 3.29.4 to 3.29.5.\r\n<details>\r\n<summary>Changelog</summary>\r\n<p><em>Sourced from <a\r\nhref=\"https://github.com/rollup/rollup/blob/master/CHANGELOG.md\">rollup's\r\nchangelog</a>.</em></p>\r\n<blockquote>\r\n<h1>rollup changelog</h1>\r\n<h2>4.22.4</h2>\r\n<p><em>2024-09-21</em></p>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li>Fix a vulnerability in generated code that affects IIFE, UMD and CJS\r\nbundles when run in a browser context (<a\r\nhref=\"https://redirect.github.com/rollup/rollup/issues/5671\">#5671</a>)</li>\r\n</ul>\r\n<h3>Pull Requests</h3>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/rollup/rollup/pull/5670\">#5670</a>:\r\nrefactor: Use object.prototype to check for reserved properties (<a\r\nhref=\"https://github.com/YuHyeonWook\"><code>@​YuHyeonWook</code></a>)</li>\r\n<li><a\r\nhref=\"https://redirect.github.com/rollup/rollup/pull/5671\">#5671</a>:\r\nFix DOM Clobbering CVE (<a\r\nhref=\"https://github.com/lukastaegert\"><code>@​lukastaegert</code></a>)</li>\r\n</ul>\r\n<h2>4.22.3</h2>\r\n<p><em>2024-09-21</em></p>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li>Ensure that mutations in modules without side effects are observed\r\nwhile properly handling transitive dependencies (<a\r\nhref=\"https://redirect.github.com/rollup/rollup/issues/5669\">#5669</a>)</li>\r\n</ul>\r\n<h3>Pull Requests</h3>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/rollup/rollup/pull/5669\">#5669</a>:\r\nEnsure impure dependencies of pure modules are added (<a\r\nhref=\"https://github.com/lukastaegert\"><code>@​lukastaegert</code></a>)</li>\r\n</ul>\r\n<h2>4.22.2</h2>\r\n<p><em>2024-09-20</em></p>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li>Revert fix for side effect free modules until other issues are\r\ninvestigated (<a\r\nhref=\"https://redirect.github.com/rollup/rollup/issues/5667\">#5667</a>)</li>\r\n</ul>\r\n<h3>Pull Requests</h3>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/rollup/rollup/pull/5667\">#5667</a>:\r\nPartially revert <a\r\nhref=\"https://redirect.github.com/rollup/rollup/issues/5658\">#5658</a>\r\nand re-apply <a\r\nhref=\"https://redirect.github.com/rollup/rollup/issues/5644\">#5644</a>\r\n(<a\r\nhref=\"https://github.com/lukastaegert\"><code>@​lukastaegert</code></a>)</li>\r\n</ul>\r\n<h2>4.22.1</h2>\r\n<p><em>2024-09-20</em></p>\r\n<h3>Bug Fixes</h3>\r\n<ul>\r\n<li>Revert <a\r\nhref=\"https://redirect.github.com/rollup/rollup/issues/5644\">#5644</a>\r\n&quot;stable chunk hashes&quot; while issues are being investigated</li>\r\n</ul>\r\n<h3>Pull Requests</h3>\r\n<ul>\r\n<li><a\r\nhref=\"https://redirect.github.com/rollup/rollup/pull/5663\">#5663</a>:\r\nchore(deps): update dependency inquirer to v11 (<a\r\nhref=\"https://github.com/renovate\"><code>@​renovate</code></a>[bot], <a\r\nhref=\"https://github.com/lukastaegert\"><code>@​lukastaegert</code></a>)</li>\r\n</ul>\r\n<!-- raw HTML omitted -->\r\n</blockquote>\r\n<p>... (truncated)</p>\r\n</details>\r\n<details>\r\n<summary>Commits</summary>\r\n<ul>\r\n<li><a\r\nhref=\"https://github.com/rollup/rollup/commit/dfd233d3a9feb18aa69b49b6c1da0248a4f1c6e3\"><code>dfd233d</code></a>\r\n3.29.5</li>\r\n<li><a\r\nhref=\"https://github.com/rollup/rollup/commit/2ef77c00ec2635d42697cff2c0567ccc8db34fb4\"><code>2ef77c0</code></a>\r\nFix DOM Clobbering CVE</li>\r\n<li>See full diff in <a\r\nhref=\"https://github.com/rollup/rollup/compare/v3.29.4...v3.29.5\">compare\r\nview</a></li>\r\n</ul>\r\n</details>\r\n<br />\r\n\r\n\r\n[![Dependabot compatibility\r\nscore](https://dependabot-badges.githubapp.com/badges/compatibility_score?dependency-name=rollup&package-manager=npm_and_yarn&previous-version=3.29.4&new-version=3.29.5)](https://docs.github.com/en/github/managing-security-vulnerabilities/about-dependabot-security-updates#about-compatibility-scores)\r\n\r\nDependabot will resolve any conflicts with this PR as long as you don't\r\nalter it yourself. You can also trigger a rebase manually by commenting\r\n`@dependabot rebase`.\r\n\r\n[//]: # (dependabot-automerge-start)\r\n[//]: # (dependabot-automerge-end)\r\n\r\n---\r\n\r\n<details>\r\n<summary>Dependabot commands and options</summary>\r\n<br />\r\n\r\nYou can trigger Dependabot actions by commenting on this PR:\r\n- `@dependabot rebase` will rebase this PR\r\n- `@dependabot recreate` will recreate this PR, overwriting any edits\r\nthat have been made to it\r\n- `@dependabot merge` will merge this PR after your CI passes on it\r\n- `@dependabot squash and merge` will squash and merge this PR after\r\nyour CI passes on it\r\n- `@dependabot cancel merge` will cancel a previously requested merge\r\nand block automerging\r\n- `@dependabot reopen` will reopen this PR if it is closed\r\n- `@dependabot close` will close this PR and stop Dependabot recreating\r\nit. You can achieve the same result by closing it manually\r\n- `@dependabot show <dependency name> ignore conditions` will show all\r\nof the ignore conditions of the specified dependency\r\n- `@dependabot ignore this major version` will close this PR and stop\r\nDependabot creating any more for this major version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this minor version` will close this PR and stop\r\nDependabot creating any more for this minor version (unless you reopen\r\nthe PR or upgrade to it yourself)\r\n- `@dependabot ignore this dependency` will close this PR and stop\r\nDependabot creating any more for this dependency (unless you reopen the\r\nPR or upgrade to it yourself)\r\nYou can disable automated security fix PRs for this repo from the\r\n[Security Alerts\r\npage](https://github.com/AzureAD/microsoft-authentication-library-for-js/network/alerts).\r\n\r\n</details>\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2024-09-24T09:30:33-07:00",
          "tree_id": "f44c560cd45d062a5875406eb6afc9cc924ed7c3",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/fafaada5ecfee546f33cbc196b71c06008ebf0a9"
        },
        "date": 1727195761211,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 183943,
            "range": "±1.94%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 187715,
            "range": "±2.17%",
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
          "id": "471ea55bc801ee5ddd8c85c6c7c69c2e5d669a24",
          "message": "Mute no_server_response error when back navigation is detected (#7342)\n\n- Mute no_server_response error when back navigation is detected. This\r\nchange addresses an issue with `handleRedirectPromise` that instruments\r\n\"no_server_response\" error code when user navigates back to the app page\r\nfrom account picker UX.",
          "timestamp": "2024-09-27T07:54:38-04:00",
          "tree_id": "e2257eab994b41ff5c51043be9434c35c61b2399",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/471ea55bc801ee5ddd8c85c6c7c69c2e5d669a24"
        },
        "date": 1727438414872,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 184853,
            "range": "±2.25%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 194189,
            "range": "±2.26%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "2c0ac76ffa1de5de9fbb499e2fc4585bcde11bf9",
          "message": "Hackathon: msal-browser - Replaced sinon with jest (#7337)\n\nI used automated tooling to replace sinon with jest in all the\r\nmsal-browser tests. The tooling did not work for\r\n`PublicClientApplication.ts`, I had to do that one by hand. I re-ran\r\nevery test in msal-browser and confirmed that they all still run\r\nsuccessfully.",
          "timestamp": "2024-09-27T14:24:27-04:00",
          "tree_id": "19e2c6269ce3013f48fcbbae08caf97f64d19a1e",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/2c0ac76ffa1de5de9fbb499e2fc4585bcde11bf9"
        },
        "date": 1727461802431,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 213052,
            "range": "±1.03%",
            "unit": "ops/sec",
            "extra": "213 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 209359,
            "range": "±1.08%",
            "unit": "ops/sec",
            "extra": "236 samples"
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
          "id": "b29b5b156948a750258b485f060c1068ff6cf80f",
          "message": "Hackathon: msal-common - Replaced sinon with jest (#7341)\n\nI used automated tooling to replace sinon with jest in all the\r\nmsal-common tests. I re-ran every test in msal-common and confirmed that\r\nthey all still run successfully.",
          "timestamp": "2024-09-27T15:05:01-04:00",
          "tree_id": "81969cd747253414767fd8615345f54c95ead01d",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/b29b5b156948a750258b485f060c1068ff6cf80f"
        },
        "date": 1727464218320,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190809,
            "range": "±2.22%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 192762,
            "range": "±2.23%",
            "unit": "ops/sec",
            "extra": "205 samples"
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
          "id": "68d29bbe660d6c637aad035ef2b321f793997480",
          "message": "Implemented functionality to skip the cache for MI when claims are provided (#7207)\n\nRe-used functionality from ClientCredential flow.\r\n\r\nThis PR originally contained code to deprecate client assertion strings.\r\nThat will now be a separate PR.",
          "timestamp": "2024-09-30T17:15:04-04:00",
          "tree_id": "c7b77768b14d4e4af8b4591517cca8ce0afabc17",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/68d29bbe660d6c637aad035ef2b321f793997480"
        },
        "date": 1727731234687,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 201000,
            "range": "±2.13%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 188494,
            "range": "±2.24%",
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
          "id": "704a8de9cc2d622534dee1a79dc19b0a8a52fe91",
          "message": "Allow pop params for brokered flows (#7335)\n\nAdds POP params in request types to allow acquisition of POP tokens from\r\nMSAL Runtime brokered flows",
          "timestamp": "2024-10-01T13:19:43-07:00",
          "tree_id": "a6ea529f1fb10858cf4c8a5a3051bc200300b882",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/704a8de9cc2d622534dee1a79dc19b0a8a52fe91"
        },
        "date": 1727814311274,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 197172,
            "range": "±2.17%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 186462,
            "range": "±2.14%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "f820022bbb103f036e12a8ee2485f044fc98d092",
          "message": "Bump package versions",
          "timestamp": "2024-10-03T00:44:29Z",
          "tree_id": "fd4f7d214b66bb870e34d111f683f82a8e5a0b94",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/f820022bbb103f036e12a8ee2485f044fc98d092"
        },
        "date": 1727916594743,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 196629,
            "range": "±2.20%",
            "unit": "ops/sec",
            "extra": "213 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 191012,
            "range": "±2.10%",
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
          "id": "ed4e1f393fe7ee39d23d8d4d135e59da81e99dcd",
          "message": "Replace E2E test MSA account (#7358)",
          "timestamp": "2024-10-03T13:47:44-07:00",
          "tree_id": "990b0d4dc68ad8047688414587f1e666f704427d",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/ed4e1f393fe7ee39d23d8d4d135e59da81e99dcd"
        },
        "date": 1727988809190,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 184045,
            "range": "±2.14%",
            "unit": "ops/sec",
            "extra": "219 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 183042,
            "range": "±2.27%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "f85b567557737e965f30a5a961bafdb177b0dfa2",
          "message": "msal-node e2e tests: cert_path -> certificate_path (#7357)\n\n@azure/identity's `new DefaultAzureCredential()` expects\r\n`AZURE_CLIENT_CERTIFICATE_PATH` instead of `AZURE_CLIENT_CERT_PATH`.\r\n\r\n[Corresponding 1-P\r\nPR](https://identitydivision.visualstudio.com/IDDP/_git/msal-javascript-1p/pullrequest/14791)",
          "timestamp": "2024-10-04T16:45:54-04:00",
          "tree_id": "928b6733ae6a2e13053d56d4af8729d00aa09be0",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/f85b567557737e965f30a5a961bafdb177b0dfa2"
        },
        "date": 1728075082224,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190699,
            "range": "±2.14%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 195364,
            "range": "±2.12%",
            "unit": "ops/sec",
            "extra": "220 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "shylasummers@users.noreply.github.com",
            "name": "shylasummers",
            "username": "shylasummers"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "243b68bcb1d9fb90adbfcfe4c17773a32881ed3c",
          "message": "Fixing window unavailable bugs for PCA and PBA (#7355)\n\nCurrently, the PCA constructor in 1P and some functions for PCA (both 1P\r\nand 3P) and PBA throw when the window is unavailable. This creates\r\nproblems with server-side rendering. Additionally, some functions that\r\nshould throw a non_browser_environment error when the window is\r\nunavailable (such as the acquireToken functions) throw a different\r\nerror.\r\n\r\nThis PR makes changes to prevent the PCA and PBA constructor and certain\r\nfunctions from throwing solely due to the window being unavailable and\r\nto ensure that the non_browser_environment error is thrown when\r\nappropriate. It also adds corresponding unit tests.\r\n\r\n---------\r\n\r\nCo-authored-by: Hector Morales <hemoral@microsoft.com>",
          "timestamp": "2024-10-07T13:45:26-07:00",
          "tree_id": "b92dfe8b916d6951a411d3baa21c9b5e3b9a13c4",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/243b68bcb1d9fb90adbfcfe4c17773a32881ed3c"
        },
        "date": 1728334262368,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 207608,
            "range": "±1.68%",
            "unit": "ops/sec",
            "extra": "227 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 189600,
            "range": "±2.15%",
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
          "id": "367915c86375e27d7aad8ecf777d2c0573a25b58",
          "message": "Add filters to the event callbacks (#7351)\n\nAdds optional filter param to event callbacks to allow invoking\r\ncallbacks only for given event types. This is important for Pairwise\r\nbrokering scenarios to ensure we don't raise events twice or incorrectly",
          "timestamp": "2024-10-07T14:52:40-07:00",
          "tree_id": "99cd44fea0b2fb86710ffe5a1c51c5fa431b8363",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/367915c86375e27d7aad8ecf777d2c0573a25b58"
        },
        "date": 1728338291895,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 189721,
            "range": "±2.13%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 193602,
            "range": "±2.14%",
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
          "id": "34c39709d1eedf3e051d80a978e94fe8f75b44cf",
          "message": "PoP Support for Node when brokered (#7360)\n\nFixes PoP support for Node when using the native broker",
          "timestamp": "2024-10-07T17:04:14-07:00",
          "tree_id": "ac2effaa29d32777f29f641eabfcaa994c758b8f",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/34c39709d1eedf3e051d80a978e94fe8f75b44cf"
        },
        "date": 1728346179575,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 192036,
            "range": "±2.18%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 191457,
            "range": "±2.20%",
            "unit": "ops/sec",
            "extra": "219 samples"
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
          "id": "5879cf36cfd1d4ec0b044e548f74656c1dde092a",
          "message": "Bump package versions",
          "timestamp": "2024-10-08T16:52:50Z",
          "tree_id": "f8932f0674a0bf1d42e792c41df09fe72596a1b4",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/5879cf36cfd1d4ec0b044e548f74656c1dde092a"
        },
        "date": 1728406706383,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 188599,
            "range": "±2.22%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 186508,
            "range": "±2.18%",
            "unit": "ops/sec",
            "extra": "220 samples"
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
          "id": "9ff67274116c0509b9d9eaa956c4a35617a6cb38",
          "message": "Cache fixes for NAA flow (#7363)\n\nThis PR should respect cache policy if set on the request and add tests\r\nfor cache pull NAA requests\r\n\r\n---------\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-10-08T13:20:02-07:00",
          "tree_id": "35061c276148dba6202b1f3a458287c6d35f5692",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/9ff67274116c0509b9d9eaa956c4a35617a6cb38"
        },
        "date": 1728419133055,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 212717,
            "range": "±2.01%",
            "unit": "ops/sec",
            "extra": "221 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 190258,
            "range": "±2.14%",
            "unit": "ops/sec",
            "extra": "221 samples"
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
          "id": "c8e74c3aaa87326ccce36eab041e2b25c600aeea",
          "message": "Bump package versions",
          "timestamp": "2024-10-08T20:47:08Z",
          "tree_id": "87a2c7eab92276c79d7efb6b416ccf3c1a00c488",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/c8e74c3aaa87326ccce36eab041e2b25c600aeea"
        },
        "date": 1728420758132,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 186733,
            "range": "±2.17%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 194566,
            "range": "±2.03%",
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
          "id": "de0b1a5537ad1a6d863ea7b333c410dc3afe6862",
          "message": "Update issue templates (#7372)\n\n- Adds note to issue templates asking internal folks to reach out over\r\nTeams instead\r\n- Removes deprecated libs from issue templates",
          "timestamp": "2024-10-10T09:37:15-07:00",
          "tree_id": "19e70caf112f26f8febb27d7de44939ce93e42dd",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/de0b1a5537ad1a6d863ea7b333c410dc3afe6862"
        },
        "date": 1728578562995,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 190611,
            "range": "±2.00%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 195557,
            "range": "±2.11%",
            "unit": "ops/sec",
            "extra": "227 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "38800918+mabeshark@users.noreply.github.com",
            "name": "mabeshark",
            "username": "mabeshark"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "8382062cf5d660dae4f52b3d711877f016dd9973",
          "message": "Fix typo (#7277)\n\nFix typo\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-10-10T13:55:32-07:00",
          "tree_id": "4eac1f5bb449f8a5ac5e3a1a173c80112d7cbfa7",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/8382062cf5d660dae4f52b3d711877f016dd9973"
        },
        "date": 1728594071378,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 211134,
            "range": "±2.06%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 225838,
            "range": "±1.48%",
            "unit": "ops/sec",
            "extra": "234 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "bill.voltmer@elationtech.us",
            "name": "billvolt",
            "username": "billvolt"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "eee013a3914ccde39c5c27ded4ae5bf6c511a0f0",
          "message": "Update MSAL.js ADFS documentation to describe requirement for Cross Origin Resource Sharing (CORS) headers (#7235)\n\nMSAL.js requires CORS. AAD provides CORS headers, but ADFS 2019 does not\r\ndo so by default. Describe CORS requirement for use with ADFS.\r\n\r\n---------\r\n\r\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-10-10T13:58:11-07:00",
          "tree_id": "3c0b69c1279c5144e85ed6654c7c7469a603e3e5",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/eee013a3914ccde39c5c27ded4ae5bf6c511a0f0"
        },
        "date": 1728594202009,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 191729,
            "range": "±1.93%",
            "unit": "ops/sec",
            "extra": "222 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 191124,
            "range": "±2.14%",
            "unit": "ops/sec",
            "extra": "207 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "1012917+kendaleiv@users.noreply.github.com",
            "name": "Ken Dale",
            "username": "kendaleiv"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "deca3c87bf2a00c7760d2c8199e5672099e0eff4",
          "message": "Spelling update in certificate-credentials.md (#7248)\n\nCo-authored-by: Thomas Norling <thomas.norling@microsoft.com>",
          "timestamp": "2024-10-10T14:01:05-07:00",
          "tree_id": "a4b983c47e8fbfa4e29b128c83de4bf571d8450f",
          "url": "https://github.com/AzureAD/microsoft-authentication-library-for-js/commit/deca3c87bf2a00c7760d2c8199e5672099e0eff4"
        },
        "date": 1728594395304,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache",
            "value": 208770,
            "range": "±1.73%",
            "unit": "ops/sec",
            "extra": "220 samples"
          },
          {
            "name": "ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache",
            "value": 206787,
            "range": "±2.03%",
            "unit": "ops/sec",
            "extra": "222 samples"
          }
        ]
      }
    ]
  }
}