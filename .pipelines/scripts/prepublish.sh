#!/usr/bin/bash

libNames=("msal-core" "msal-common" "msal-browser" "msal-node" "msal-angular" "msal-react" "node-token-validation");

declare -A publishFlagNames;

publishFlagNames["msal-core"]=PUBLISH_MSAL_CORE;
publishFlagNames["msal-common"]=PUBLISH_MSAL_COMMON;
publishFlagNames["msal-browser"]=PUBLISH_MSAL_BROWSER;
publishFlagNames["msal-node"]=PUBLISH_MSAL_NODE;
publishFlagNames["msal-angular"]=PUBLISH_MSAL_ANGULAR;
publishFlagNames["msal-react"]=PUBLISH_MSAL_REACT;
publishFlagNames["node-token-validation"]=PUBLISH_NODE_TOKEN_VALIDATION;

# Iterate each library directory name
for i in "${libNames[@]}"; do
    libPath="../../lib/${i}/package.json"
    # Git diff --name-only prints the file name in the input path given that
    # that file has changed between the two commits referenced and
    # --exit-code sets the successful or failed result into $?
    # so if there are changes to a library's package.json, $? will have a 1 (success),
    # no changes means $? is 0, therefore library won't be release unless it's dependent
    # packages have been updated (dependent logic is out of scope for this script)
    git diff --exit-code --name-only HEAD HEAD~1 $libPath 

    if [ $? -eq 1 ]
    then
        echo "${i} publish flag set to TRUE";
        varName=${publishFlagNames[$i]};
        declare $varName;
        printf -v "$varName" '%b' true;
        export ${varName};
    else
     echo "${i} publish flag set to FALSE";
        varName=${publishFlagNames[$i]};
        declare $varName;
        printf -v "$varName" '%b' false;
        export ${varName};
    fi
done