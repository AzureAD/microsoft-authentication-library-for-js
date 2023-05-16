#!/usr/bin/bash

libNames=("msal-common" "msal-browser" "msal-node" "msal-angular" "msal-react");

declare -A publishFlagNames;

publishFlagNames["msal-common"]=publishMsalCommon;
publishFlagNames["msal-browser"]=publishMsalBrowser;
publishFlagNames["msal-node"]=publishMsalNode;
publishFlagNames["msal-angular"]=publishMsalAngular;
publishFlagNames["msal-react"]=publishMsalReact;

# Iterate each library directory name
for i in "${libNames[@]}"; do
    libPath="./lib/${i}"
    node checkIfPackageShouldBePublished.js $libPath

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

# Same for extensions

libPath="./extensions/msal-node-extensions"
varName=publishMsalNodeExtensions;

node checkIfPackageShouldBePublished.js $libPath

if [ $? -eq 1 ]
then
    echo "msal-node-extensions publish flag set to TRUE";
    echo "##vso[task.setvariable variable=${varName};isoutput=true]true"
else
    echo "msal-node-extensions publish flag set to FALSE";
    echo "##vso[task.setvariable variable=${varName};isoutput=true]false"
fi

