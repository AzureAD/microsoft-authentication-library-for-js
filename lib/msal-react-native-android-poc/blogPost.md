I've been working at Microsoft this summer as a Software Engineer Intern, an experience which so far has been insightful and really fun. From what I had read and heard from friends, Microsoft has one of the best tech (and maybe best overall) college internship programs, with an emphasis on work/life balance, signature events with puzzles or a special performer, lots of swag, and a great returning offer rate at the end. 
When COVID-19 struck, I couldn't help but wonder if I was still going to have an internship this summer. Fortunately, Microsoft kept nearly all interns aboard, and they decided to switch their usually in-person program to be virtual. Although I was really looking forward to working in Redmond and exploring the Seattle area with my friends, I was also incredibly thankful to have this opportunity to work for Microsoft, even if that meant I had to stay at home.

## My Experience Creating MSAL React Native Proof of Concept
I work within Azure Identity on the DevEx JavaScript (JS) SDK team. My team builds and maintains the [Microsoft Authentication Library (MSAL)](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview) as well as the Active Directory Authentication Library (ADAL) for JS, although more development is focused on MSAL, the newer of the two libraries. 
[MSAL JS](https://github.com/AzureAD/microsoft-authentication-library-for-js) allows client-side JS web applications to authenticate users using Azure Active Directory for work and school accounts (AAD), Microsoft personal accounts (MSA), and social identity providers through Azure AD B2C service. On the authorization side, MSAL can retrieve access tokens to call secure web APIs.

My team mentioned multiple times that there is a learning curve to what the authentication client teams do(and maybe even what Identity does, in general). I spent much of the first week reading Microsoft documentation and familiarizing myself with the GitHub libraries on MSAL. 

In my first meeting with my manager, he asked what I wanted to do for my project. I had no idea where to even start! I felt that I still didn't have a great grasp of my team's code, much less how I could contribute. However, my manager also mentioned that my project should be "orthogonal" to the team. This means it would be a feature not in the team's current workload, but a plus to have (and could be implemented in the future!). 
With this in mind, I started to ask my teammates about features they would like to see added to the library that could reasonably be the focus of my project. Most of them directed me to an engineer on our team who had two great ideas for me.

The first was a website for the MSAL library, scoped to JavaScript at first. Because much information regarding MSAL exists in multiple places online through Microsoft docs, GitHub, and probably more, a well-organized website combining all this information could be beneficial to the MSAL teams. I took a web development course a year ago where I learned how to create basic websites. 
I knew this would be a project that I could reasonably get done early and then spend extra time with the UI to make it special. However, the MSAL JS team doesn't specialize in making websites. They add to and maintain a library that web developers use, and I wanted to learn more about what actually happens under the hood and make proper use of their expertise.

The second idea was a proof of concept MSAL for React Native. [React Native](https://reactnative.dev/) is a framework that allows JS developers to create truly native mobile applications. Before this meeting, I had never heard of React Native, and it blew my mind that cross mobile platform frameworks like it existed. When I mentioned I had some Android experience, the engineer suggested that I create a proof of concept focusing on the Android side. 
I got pretty excited about this project for many reasons. One was that I knew I was going to learn a ton, from React Native to MSAL (and just getting more comfortable with JS in general). I also had a decent starting point with my knowledge of Android, so I would start the project with some prior knowledge. Additionally, I would get to create a library… which is pretty awesome. 

Before I spoke with my manager again, I wrote up some pros and cons for each project and made loose plans as to how I would implement them. When the time came to decide, I realized that I was way more excited about MSAL for React Native, and I knew it would provide a great challenge for me to tackle during the summer. My manager asked me to write a requirements doc for my project:

**Ultimate Goal of the Project: Create a proof-of-concept MSAL for React Native that implements the Authorization Code Flow with PKCE (Proof Key Code Exchange).**

**Functional Requirements (and scoping):**
* The project will provide methods for mobile apps created with React Native to acquire OAuth2.0 access tokens by implementing the Authorization Code Flow with PKCE (mobile app that calls a web API on behalf of an interactive user).
  * The user will be authenticated with a broker (such as Authenticator), using either a redirect or pop-up flow, to get consent and allow SSO.
* Implementation will be focused on creating a library for Android; with my experience with creating Android apps (and lack of experience with iOS), I can put more time into the quality of the proof of concept and less time learning the nuances of iOS.
*	The project will be a wrapper of MSAL for Android but will stylistically be derived and will take inspiration from the MSAL JS libraries.
  *	The "MSAL React Native wrapper for iOS and Android" library by Stash Energy will also be referenced when designing and implementing the proof-of-concept.
*	The proof-of-concept will allow single-account mode only.
*	The project will center on AAD and not B2C nor ADFS
*	A sample Android app will be created to demo the library
*	Error handling will not be emphasized (unless I have extra time!)

**Non-Functional Requirements:**
*	The resulting library will stylistically match that of the existing MSAL JS libraries.
*	The project will follow good coding practices (being aware of third-party coding practices, and asking for advice when necessary)
*	The amount of code to be implemented on the user's end will be minimized.
  * Users should be able to add their client IDs, Tenant IDs, etc. and then use the libraries without much other configuration.
*	There will be proper usage documentation for the library as well as the sample app.
*	Code reviews will be done with team, Android point-of-contacts, and React Native engineers when necessary.

**Extra Add-Ons If Time:**
*	The sample Android app UI will be improved to match Microsoft's style.
*	Multiple-Accounts mode can be looked into.

We planned this to be a 10 week project, with a timeline as follows:

**Milestones (Broad):** Ten Week Project (5/24-7/31)
*	Week 1 (5/24-5/29): Write up requirements, scoping, and other planning; spend hackathon time diving into React Native
*	Week 2 (6/1-6/5): Plan out functional requirements in detail (as well as the milestones for weeks 3 - 9)
*	Week 3 (6/8 - 6/12): Create demo app framework using React Native; start creating PPT for React Native Brownbag
*	Week 4 (6/15 - 6/19): Finalize React Native PPT and present! Start implementing MSAL for React Native Library if haven't done so yet.
*	Week 5 - 9 (6/22 - 7/24): Code MSAL for React Native! (This will be better planned out in week 3)
*	Week 10 (7/27 - 7/31): Refine code (linting?) and usage documentation; start finishing blog post detailing my project's functionality and my experience building it; if demos are this week, demo; otherwise, practice demoing.

As Week 1 states, there was a hackathon among the auth client teams on Thursday and Friday. I decided to spend that time to learn the basics of React Native and potentially create a demo app for testing my future library. I watched some LinkedIn Learning videos and spent a ton of time on React Native's and React's official website, since I also needed a refresher of React's basics. 
I followed tutorials using [Expo CLI](https://docs.expo.io/workflow/expo-cli/), which is great for beginners. After I felt more comfortable, I transitioned to using [React Native CLI](https://reactnative.dev/docs/0.61/getting-started), which was more bare-boned but necessary to use in order to incorporate native modules (more on this to follow). 
I aimed to create an app with a UI similar to that of [MSAL Android's sample app](https://github.com/Azure-Samples/ms-identity-android-java), and this was the result:






