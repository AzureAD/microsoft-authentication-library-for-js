# Roadmap

The MSAL.js team's roadmap is presented as near-term, mid-term, & long-term to give you a better idea of what we are currently working on, what is up next for us, and what we are considering for the future. These are not guaranteed timelines, but instead intended to provide insight into the team's current direction. The roadmap is focused on big features or focus areas; it may not call out each individual work item that is added to the library. While we try to stay consistent with our plans, things can change quickly. Do not write code reliant on these features until they are officially shipped.

If you don't see a feature listed on the roadmap, check our [Release Notes](https://github.com/AzureAD/microsoft-authentication-library-for-js/releases) to see if it has already been released. If not, please open a [Feature Request](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/new?assignees=&labels=feature-unconfirmed%2Cquestion&template=feature_request.yml).

## Terminology
- *Near Term*: These items are well-defined and actively in development.
- *Mid Term*: Next to be picked up for development when capacity allows. The problem space & solution are known but we may still be defining implementation details.
- *Long Term*: The team is investigating for the future but don’t have a clear solution in mind. This is the area most in flux as investigations can change feasibility & priority.  

## Timelines

### Near Term
- Node token caching support with Redis 
- Deprecation of passport-azure-ad and replacement with a new lightweight token validator 
- Updates required by the May 2021 United States Executive Order on cybersecurity: [Executive Order on Improving the Nation's Cybersecurity | The White House](https://www.whitehouse.gov/briefing-room/presidential-actions/2021/05/12/executive-order-on-improving-the-nations-cybersecurity/) 

### Mid Term
- Improvements on Node documentation & samples  
- Ivy library distribution of MSAL Angular 
- Angular 14 support 
- Sustainable strategy for supporting new major versions of frameworks and runtimes (Angular, React, Node, etc.) and other dependencies  
  

### Long Term
- IDP agnostic support  
- Enhancing MSALGuard 
- Reducing package size 
- Increased support for the AAD Backup Auth Services  
- Browsers' solutions to federated identity without 3p cookie access (FedCM, Storage Access API, First Party Sets, etc) 

