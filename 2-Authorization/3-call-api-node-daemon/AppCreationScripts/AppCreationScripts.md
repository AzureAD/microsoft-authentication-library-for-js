# Registering sample apps with the Microsoft identity platform and updating configuration files using PowerShell

## Overview

### Quick summary

1. Run the script to create your Azure AD application and configure the code of the sample application accordingly.

   ```PowerShell
   cd .\AppCreationScripts\
   .\Configure.ps1 -TenantId "your test tenant's id" -AzureEnvironmentName "[Optional] - Azure environment, defaults to 'Global'"
   ```

### More details

- [Goal of the provided scripts](#goal-of-the-provided-scripts)
  - [Presentation of the scripts](#presentation-of-the-scripts)
  - [Usage pattern for tests and DevOps scenarios](#usage-pattern-for-tests-and-DevOps-scenarios)
- [How to use the app creation scripts?](#how-to-use-the-app-creation-scripts)
  - [Pre-requisites](#pre-requisites)
  - [Run the script and start running](#run-the-script-and-start-running)
  - [Four ways to run the script](#four-ways-to-run-the-script)
    - [Option 1 (interactive)](#option-1-interactive)
    - [Option 2 (Interactive, but create apps in a specified tenant)](#option-3-Interactive-but-create-apps-in-a-specified-tenant)
  - [Running the script on Azure Sovereign clouds](#running-the-script-on-Azure-Sovereign-clouds)

## Goal of the provided scripts

### Presentation of the scripts

This sample comes with two PowerShell scripts, which automate the creation of the Azure Active Directory applications, and the configuration of the code for this sample. Once you run them, you will only need to build the solution and you are good to test.

These scripts are:

- `Configure.ps1` which:
  - creates Azure AD applications and their related objects (permissions, dependencies, secrets, app roles),
  - changes the configuration files in the sample projects.
  - creates a summary file named `createdApps.html` in the folder from which you ran the script, and containing, for each Azure AD application it created:
    - the identifier of the application
    - the AppId of the application
    - the url of its registration in the [Azure portal](https://portal.azure.com).

- `Cleanup.ps1` which cleans-up the Azure AD objects created by `Configure.ps1`. Note that this script does not revert the changes done in the configuration files, though. You will need to undo the change from source control (from Visual Studio, or from the command line using, for instance, `git reset`).

> :information_source: If the sample supports using certificates instead of client secrets, this folder will contain an additional set of scripts: `Configure-WithCertificates.ps1` and `Cleanup-WithCertificates.ps1`. You can use them in the same way to register app(s) that use certificates instead of client secrets.

### Usage pattern for tests and DevOps scenarios

The `Configure.ps1` will stop if it tries to create an Azure AD application which already exists in the tenant. For this, if you are using the script to try/test the sample, or in DevOps scenarios, you might want to run `Cleanup.ps1` just before `Configure.ps1`. This is what is shown in the steps below.

## How to use the app creation scripts?

### Pre-requisites

1. PowerShell 7 or later (see: [installing PowerShell](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell))
1. Open PowerShell (On Windows, press  `Windows-R` and type `PowerShell` in the search window)

### (Optionally) install Microsoft.Graph.Applications PowerShell modules

The scripts install the required PowerShell module (Microsoft.Graph.Applications) for the current user if needed. However, if you want to install if for all users on the machine, you can follow the following steps:

1. If you have never done it already, in the PowerShell window, install the Microsoft.Graph.Applications PowerShell modules. For this:

   1. Open PowerShell
   2. Type:

      ```PowerShell
      Install-Module Microsoft.Graph.Applications
      ```

      or if you want the modules to be installed for the current user only, run:

      ```PowerShell
      Install-Module Microsoft.Graph.Applications -Scope CurrentUser
      ```

### Run the script and start running

1. Go to the `AppCreationScripts` sub-folder. From the folder where you cloned the repo,

    ```PowerShell
    cd AppCreationScripts
    ```

1. Run the scripts. See below for the [four options](#four-ways-to-run-the-script) to do that.
1. Open the Visual Studio solution, and in the solution's context menu, choose **Set Startup Projects**.
1. select **Start** for the projects

You're done!

### Two ways to run the script

We advise four ways of running the script:

- Interactive: you will be prompted for credentials, and the scripts decide in which tenant to create the objects,
- Interactive in specific tenant: you will provide the tenant in which you want to create the objects and then you will be prompted for credentials, and the scripts will create the objects,

Here are the details on how to do this.

#### Option 1 (interactive)

- Just run ``.\Configure.ps1``, and you will be prompted to sign-in (email address, password, and if needed MFA).
- The script will be run as the signed-in user and will use the tenant in which the user is defined.

Note that the script will choose the tenant in which to create the applications, based on the user. Also to run the `Cleanup.ps1` script, you will need to re-sign-in.

#### Option 2 (Interactive, but create apps in a specified tenant)

  if you want to create the apps in a particular tenant, you can use the following option:
  
- Open the [Azure portal](https://portal.azure.com)
- Select the Azure Active directory you are interested in (in the combo-box below your name on the top right of the browser window)
- Find the "Active Directory" object in this tenant
- Go to **Properties** and copy the content of the **Directory Id** property
- Then use the full syntax to run the scripts:

```PowerShell
$tenantId = "yourTenantIdGuid"
. .\Cleanup.ps1 -TenantId $tenantId
. .\Configure.ps1 -TenantId $tenantId
```

### Running the script on Azure Sovereign clouds

All the four options listed above can be used on any Azure Sovereign clouds. By default, the script targets `AzureCloud`, but it can be changed using the parameter `-AzureEnvironmentName`.

The acceptable values for this parameter are:

- AzureCloud
- AzureChinaCloud
- AzureUSGovernment

Example:

 ```PowerShell
 . .\Cleanup.ps1 -AzureEnvironmentName "AzureUSGovernment"
 . .\Configure.ps1 -AzureEnvironmentName "AzureUSGovernment"
 ```
