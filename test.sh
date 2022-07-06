#!/usr/bin/bash

libNames=("msal-core" "msal-browser");
varNames=("msalCore" "MSAL_BROWSER")

for i in "${!libNames[@]}"; do
    filePath="lib/${libNames[i]}/package-lock.json";
    git diff --name-only HEAD HEAD~1 $filePath |

    while read name; do
        if [ $filePath = $name ]; then
            currentVar=${varNames[i]};
            printf -v $currentVar true
        fi
    done

    export MSAL_CORE=$msalCore;
done

