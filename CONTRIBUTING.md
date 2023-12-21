# Contributing to aldeed:simple-schema

> Any contribution to this repository is highly appreciated!


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Introduction](#introduction)
- [Setup development env](#setup-development-env)
  - [Clone project and create a new branch to work on](#clone-project-and-create-a-new-branch-to-work-on)
  - [Initialize test app](#initialize-test-app)
- [Development toolchain](#development-toolchain)
  - [Linter](#linter)
  - [Tests](#tests)
    - [Once](#once)
    - [Watch](#watch)
    - [Coverage](#coverage)
- [Open a pull request](#open-a-pull-request)
- [Code review process](#code-review-process)
- [Questions](#questions)
- [Credits](#credits)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Introduction

First, thank you for considering contributing to simpl-schema! It's people like you that make the open source community such a great community! 😊

We welcome any type of contribution, not only code. You can help with

- **QA**: file bug reports, the more details you can give the better (e.g. screenshots with the console open)
- **Marketing**: writing blog posts, howto's, printing stickers, ...
- **Community**: presenting the project at meetups, organizing a dedicated meetup for the local community, ...
- **Code**: take a look at the [open issues](issues). Even if you can't write code, commenting on them, showing that you care about a given issue matters. It helps us triage them.
- **Money**: we [welcome financial contributions](https://github.com/https://github.com/Meteor-Community-Packages).

## Setup development env

### Clone project and create a new branch to work on

First, clone this repository and create a new branch to work on.
Branch names should follow the GitFlow standard and start with a descriptive prefix of their intended outcome, for example:

- `feature/` for features
- `fix/` for general fixes

Then the name of the branch should describe the purpose of the branch and potentially reference the issue number it is solving.

```shell
$ git clone git@github.com:Meteor-Community-Packages/meteor-simple-schema.git
$ cd meteor-simple-schema
$ git checkout -b fix/some-issue
```

### Initialize test app

We use a proxy Meteor application to run our tests and handle coverage etc.
This app contains several npm scripts to provide the complete toolchain that is required
for your development and testing needs.

The setup is very easy. Go into the `tests` directory, install dependencies and link
the package:

```shell
$ cd tests
$ meteor npm install
$ meteor npm run setup # this is important for the tools to work!
```

## Development toolchain

The `tests` comes with some builtin scripts you can utilize during your development.
They will also be picked up by our CI during pull requests.
Therefore, it's a good call for you, that if they pass or fail, the CI will do so, too.

**Note: all tools require the npm `setup` script has been executed at least once!**

### Linter

We use `standard` as our linter. You can run either the linter or use it's autofix feature for
the most common issues:

```shell
# in tests
$ meteor npm run lint # show only outputs
$ meteor npm run lint:fix # with fixes + outputs
```

### Tests

We provide three forms of tests: once, watch, coverage

#### Once

Simply runs the test suite once, without coverage collection:

```shell
$ meteor npm run test
```

#### Watch

Runs the test suite in watch mode, good to use during active development, where your changes
are picked up automatically to re-run the tests:

```shell
$ meteor npm run test:watch
```

#### Coverage

Runs the test suite once, including coverage report generation.
Generates an html and json report output.

```shell
$ meteor npm run test:coverage
$ meteor npm run report # summary output in console
```

If you want to watch the HTML output to find (un)covered lines, open
the file at `tests/.coverage/index.html` in your browser.

## Open a pull request

If you open a pull request, please make sure the following requirements are met:

- the `lint` script is passing
- the `test` script is passing
- your contribution is on point and solves one issue (not multiple)
- your commit messages are descriptive and informative
- complex changes are documented in the code with comments or jsDoc-compatible documentation

Please understand, that there will be a review process and your contribution
might require changes before being merged. This is entirely to ensure quality and is
never used as a personal offense.


## Code review process

The bigger the pull request, the longer it will take to review and merge. Try to break down large pull requests in 
smaller chunks that are easier to review and merge.
It is also always helpful to have some context for your pull request. What was the purpose? Why does it matter to you?

## Questions

If you have any questions, [create an issue](https://github.com/Meteor-Community-Packages/meteor-simple-schema/issues) 
(protip: do a quick search first to see if someone else didn't ask the same question before!).

## Credits

Thank you to all the people who have already contributed to this project:

<a href="graphs/contributors"><img src="https://opencollective.com/simple-schema-js/contributors.svg?width=890" /></a>
