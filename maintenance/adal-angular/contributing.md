# CONTRIBUTING

Azure Active Directory SDK projects welcomes new contributors.  This document will guide you
through the process.

### CONTRIBUTOR LICENSE AGREEMENT

Please visit [https://cla.microsoft.com/](https://cla.microsoft.com/) and sign the Contributor License
Agreement.  You only need to do that once. We can not look at your code until you've submitted this request.


### FORK

Fork the project [on GitHub][] and check out
your copy.

Example for JS:

```
$ git clone git@github.com:username/azure-activedirectory-library-for-js.git
$ cd azure-activedirectory-library-for-js
$ git remote add upstream git@github.com:MSOpenTech/azure-activedirectory-library-for-js.git
```

Now decide if you want your feature or bug fix to go into the dev branch
or the master branch.  **All bug fixes and new features should go into the dev branch.**

The master branch is effectively frozen; patches that change the SDKs
protocols or API surface area or affect the run-time behavior of the SDK will be rejected.

Some of our SDKs have bundled dependencies that are not part of the project proper.  Any changes to files in those directories or its subdirectories should be sent to their respective
projects.  Do not send your patch to us, we cannot accept it.

In case of doubt, open an issue in the [issue tracker][].

Especially do so if you plan to work on a major change in functionality.  Nothing is more
frustrating than seeing your hard work go to waste because your vision
does not align with our goals for the SDK.


### BRANCH

Okay, so you have decided on the proper branch.  Create a feature branch
and start hacking:

```
$ git checkout -b my-feature-branch 
```

### COMMIT

Make sure git knows your name and email address:

```
$ git config --global user.name "J. Random User"
$ git config --global user.email "j.random.user@example.com"
```

Writing good commit logs is important.  A commit log should describe what
changed and why.  Follow these guidelines when writing one:

1. The first line should be 50 characters or less and contain a short
   description of the change prefixed with the name of the changed
   subsystem (e.g. "net: add localAddress and localPort to Socket").
2. Keep the second line blank.
3. Wrap all other lines at 72 columns.

A good commit log looks like this:

```
fix: explaining the commit in one line

Body of commit message is a few lines of text, explaining things
in more detail, possibly giving some background about the issue
being fixed, etc etc.

The body of the commit message can be several paragraphs, and
please do proper word-wrap and keep columns shorter than about
72 characters or so. That way `git log` will show things
nicely even when it is indented.
```

The header line should be meaningful; it is what other people see when they
run `git shortlog` or `git log --oneline`.

Check the output of `git log --oneline files_that_you_changed` to find out
what directories your changes touch.


### REBASE

Use `git rebase` (not `git merge`) to sync your work from time to time.

```
$ git fetch upstream
$ git rebase upstream/v0.1  # or upstream/master
```


### TEST

Bug fixes and features should come with tests.  Add your tests in the
test directory. This varies by repository but often follows the same convention of /src/test.  Look at other tests to see how they should be
structured (license boilerplate, common includes, etc.).


Make sure that all tests pass.


### PUSH

```
$ git push origin my-feature-branch
```

Go to https://github.com/username/azure-activedirectory-library-for-***.git and select your feature branch.  Click
the 'Pull Request' button and fill out the form.

Pull requests are usually reviewed within a few days.  If there are comments
to address, apply your changes in a separate commit and push that to your
feature branch.  Post a comment in the pull request afterwards; GitHub does
not send out notifications when you add commits.


[on GitHub]: https://github.com/MSOpenTech/azure-activedirectory-library-for-js
[issue tracker]: https://github.com/MSOpenTech/azure-activedirectory-library-for-js/issues
