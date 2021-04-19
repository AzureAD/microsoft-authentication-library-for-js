# Microsoft Identity SDK Versioning and Servicing FAQ

We have adopted the semantic versioning flow that is industry standard for OSS projects. It gives the maximum amount of control on what risk you take with what versions. If you know how semantic versioning works with node.js, java, and ruby none of this will be new.

##Semantic Versioning and API stability promises

Microsoft Identity libraries are independent open source libraries that are used by partners both internal and external to Microsoft. As with the rest of Microsoft, we have moved to a rapid iteration model where bugs are fixed daily and new versions are produced as required. To communicate these frequent changes to external partners and customers, we use semantic versioning for all our public Microsoft Identity SDK libraries. This follows the practices of other open source libraries on the internet. This allows us to support our downstream partners which will lock on certain versions for stability purposes, as well as providing for the distribution over NuGet, CocoaPods, and Maven. 

The semantics are: MAJOR.MINOR.PATCH (example 1.1.5)

We will update our code distributions to use the latest PATCH semantic version number in order to make sure our customers and partners get the latest bug fixes. Downstream partner needs to pull the latest PATCH version. Most partners should try lock on the latest MINOR version number in their builds and accept any updates in the PATCH number. 

Examples: 
Using Cocapods, the following in the podfile will take the latest ADALiOS build that is > 1.1 but not 1.2.
```
pod 'ADALiOS', '~> 1.1'
```

Using NuGet, this ensures all 1.1.0 to 1.1.x updates are included when building your code, but not 1.2. 

```
<dependency
id="ADALfordotNet"
version="[1.1,1.2)"
/>
```

| Version |                                                                                                                                                                                                                                                            Description                                                                                                                                                                                                                                                            |                                                  Example                                                  |
|:-------:|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|:---------------------------------------------------------------------------------------------------------:|
| x.x.x   | PATCH version number. Incrementing these numbers is for bug fixes and updates but do not introduce new features. This is used for close partners who build on our platform release (ex. Azure AD Fabric, Office, etc.),In addition, Cocoapods, NuGet, and Maven use this number to deliver the latest release to customers.,This will update frequently (sometimes within the same day),There is no new features, and no regressions or API surface changes. Code will continue to work unless affected by a particular code fix. | ADAL for iOS 1.0.10,(this was a fix for the Storyboard display that was fixed for a specific Office team) |
| x.x     | MINOR version numbers. Incrementing these second numbers are for new feature additions that do not impact existing features or introduce regressions. They are purely additive, but may require testing to ensure nothing is impacted.,All x.x.x bug fixes will also roll up in to this number.,There is no regressions or API surface changes. Code will continue to work unless affected by a particular code fix or needs this new feature.                                                                                    | ADAL for iOS 1.1.0,(this added WPJ capability to ADAL, and rolled all the updates from 1.0.0 to 1.0.12)   |
| x       | MAJOR version numbers. This should be considered a new, supported version of Microsoft Identity SDK and begins the Azure two year support cycle anew. Major new features are introduced and API changes can occur.,This should only be used after a large amount of testing and used only if those features are needed.,We will continue to service MAJOR version numbers with bug fixes up to the two year support cycle.                                                                                                        | ADAL for iOS 1.0,(our first official release of ADAL)                                                     |

 

## Serviceability

When we release a new MINOR version, the previous MINOR version is abandoned. 

When we release a new MAJOR version, we will continue to apply bug fixes to the existing features in the previous MAJOR version for up to the 2 year support cycle for Azure. 
Example: We release ADALiOS 2.0 in the future which supports unified Auth for AAD and MSA. Later, we then have a fix in Conditional Access for ADALiOS. Since that feature exists both in ADALiOS 1.1 and ADALiOS 2.0, we will fix both. It will roll up in a PATCH number for each. Customers that are still locked down on ADALiOS 1.1 will receive the benefit of this fix. 

## Microsoft Identity SDKs and Azure Active Directory

Microsoft Identity SDKs major versions will maintain backwards compatibility with Azure Active Directory web services through the support period. This means that the API surface area defined in a MAJOR version will continue to work for 2 years after release. 

We will respond to bugs quickly from our partners and customers submitted through GitHub and through our private alias (tellaad@microsoft.com) for security issues and update the PATCH version number. We will also submit a change summary for each PATCH number. 
Occasionally, there will be security bugs or breaking bugs from our partners that will require an immediate fix and a publish of an update to all partners and customers. When this occurs, we will do an emergency roll up to a PATCH version number and update all our distribution methods to the latest. 
