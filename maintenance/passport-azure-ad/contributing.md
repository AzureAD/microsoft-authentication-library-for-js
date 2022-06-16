# Branch Structure
* **master**: The latest official GA version
* **release1x**: The latest official release of version 1.x. All 1.x contributions should be against the **release1x** branch.
* **release2x**: The latest official release of version 2.x. All 2.x contributions should be against the **release2x** branch.
* **dev**: The dev working branch of master. All 3.x contributions should be against the **dev** branch.

If you are contributing code to 3.x, you should branch from **dev** and make a pull request for your topic branch against the **dev** branch. If you are contributing code to 2.x, you should branch from **release2x** and make a pull request for your topic branch against the **release2x** branch. If you are contributing code to 1.x, you should branch from **release1x** and make a pull request for your topic branch against the **release1x** branch.

# Releases
All the previous releases can be found [here](https://github.com/AzureAD/passport-azure-ad/releases).

# Filing Bugs
Please file issues you see in the [issue tracker](https://github.com/AzureAD/passport-azure-ad/issues). Include:

- The version you are using.
- The behavior you are seeing. If at all possible, please submit a reduced repro or test that demonstrates the issue.
- What you expect to see.

# Instructions for Contributing Code

## Contributing bug fixes

We are currently accepting contributions in the form of bug fixes. A bug must have an issue tracking it in the issue tracker. Your pull request should include a link to the bug that you are fixing. If you've submitted a PR for a bug, please post a comment in the bug to avoid duplication of effort.

## Contributing features
Features (things that add new or improved functionality) may be accepted, but will need to first be approved (tagged with "enhancement") in the issue.

## Legal
You will need to complete a Contributor License Agreement (CLA). Briefly, this agreement testifies that you are granting us permission to use the submitted change according to the terms of the project's license, and that the work being submitted is under appropriate copyright.

Please submit a Contributor License Agreement (CLA) before submitting a pull request. You may visit https://cla.microsoft.com to sign digitally. You only need to do this once. Once we have received the signed CLA, we'll review the request.

## Housekeeping
Your pull request should:

* Include a description of what your change intends to do
* Be based on a reasonably recent pull in the **dev** branch
    * Please rebase and squash all commits into a single one
* Make sure both your local test run and the automatic Travis test run pass. See the test instructions section below for more details
* Have clear commit messages
* Include new tests for bug fixes and new features
* To avoid line ending issues, set `autocrlf = input` and `whitespace = cr-at-eol` in your git configuration

## Test instructions

For the testing tools, we use both nodeunit and [chai-passport-strategy](https://github.com/jaredhanson/chai-passport-strategy). Nodeunit is used for general testing purposes where the passport framework is not involved, and chai-passport-strategy is used for the passport strategy workflow testing. Instructions on how to use chai-passport-strategy can be found [here](https://github.com/jaredhanson/chai-passport-strategy/blob/master/README.md).

All the test files should have a _test suffix in their names and be placed in the correct subdirectory, depending on the testing tools used. The following is the rule: 

* **Nodeunit_test**: contains all nodeunit tests
* **Chai-passport_test**: contains all chai-passport-strategy tests
* **End_to_end_test**: contains all end to end tests using Selenium with chrome webdriver
* **resource**: contains all shared resources for testing (for example, pem key file)

### How to run tests on your machine

Please refer to section 6 in README.md for the test instructions.

### Automatic Travis test

After you submit your pull request, Travis test will run automatically. The status of this test can be found at the bottom of your pull request page, and it may take some time to complete. After completion, a successful test run will show a "All checks have passed" status with a green check sign.
