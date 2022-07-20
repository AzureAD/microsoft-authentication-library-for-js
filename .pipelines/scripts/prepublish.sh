#!/usr/bin/bash

libNames=("msal-core" "msal-common" "msal-browser" "msal-node" "msal-angular" "msal-react" "node-token-validation");

declare -A publishFlagNames;

publishFlagNames["msal-core"]=publishMsalCore;
publishFlagNames["msal-common"]=publishMsalCommon;
publishFlagNames["msal-browser"]=publishMsalBrowser;
publishFlagNames["msal-node"]=publishMsalNode;
publishFlagNames["msal-angular"]=publishMsalAngular;
publishFlagNames["msal-react"]=publishMsalReact;
publishFlagNames["node-token-validation"]=publishNodeTokenValidation;

# Iterate each library directory name
for i in "${libNames[@]}"; do
    libPath="../../lib/${i}/package.json"
    # Git diff --name-only prints the file name in the input path given that
    # that file has changed between the two commits referenced and
    # --exit-code sets the successful or failed result into $?
    # so if there are changes to a library's package.json, $? will have a 1 (success),
    # no changes means $? is 0, therefore library won't be release unless it's dependent
    # packages have been updated (dependent logic is out of scope for this script)
    git diff --exit-code --name-only HEAD 44b53ab0c1c7bc24c17787877e6027075e34f01b $libPath 

    if [ $? -eq 1 ]
    then
        echo "${i} publish flag set to TRUE";
        varName=${publishFlagNames[$i]};
        echo "##vso[task.setvariable variable=${varName};isoutput=true]true"
    else
     echo "${i} publish flag set to FALSE";
        varName=${publishFlagNames[$i]};
        echo "##vso[task.setvariable variable=${varName};isoutput=true]false"
    fi
done