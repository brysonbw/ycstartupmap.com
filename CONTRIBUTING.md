# Contributing

We welcome and appreciate all contributions from the community. By contributing to YC Startup Map, you agree to abide by the [code of conduct](CODE_OF_CONDUCT.md).

## Table of Contents

- [How Can I Contribute?](#how-can-i-contribute)
  - [Bug Reports](#bug-reports)
  - [Feature Request](#feature-request)
  - [Documentation](#documentation)
  - [Code](#code)
- [Setup](#setup)
  - [Installation](#installation)
  - [Getting Started](#getting-started)
- [Linting, Formating, Building, and Testing](#linting-formating-building-and-testing)
  - [Linting](#linting)
  - [Formating](#formating)
  - [Building](#building)
  - [Testing](#testing)
- [Pull Request](#pull-request)
  - [Submitting a Pull Request](#submitting-a-pull-request)
  - [Reviewing a Pull Request](#reviewing-a-pull-request)
  - [Addressing Review Feedback](#addressing-review-feedback)
  - [After Pull Request Merged](#after-pull-request-merged)
- [Keeping Fork Synced with Upstream](#keeping-fork-synced-with-upstream)
- [Resources](#resources)

## How Can I Contribute?

### Bug Reports

Before creating a bug report please check to see if it has already been reported. If the issue is closed, please open a new issue and link it to the original issue.

When creating a bug report, explain the problem and include as much additional information as necessary to help maintainers to reproduce it. Ideally, provide an example project which highlights the problem.

- **Use a clear and descriptive title** for the issue to identify the problem
- **Describe your project setup**. The easier it is for maintainers to reproduce your problem, the more likely it is to be quickly fixed.
- **Explain what you expected to see instead and why**

### Feature Request

Before creating a feature request, please check to see if it has already been requested.

When creating an enhancement request, explain your use case and ultimate goal. This will make it possible for contributors to suggest existing alternatives which may already meet your requirements.

- **Use a clear and descriptive title** for the issue to identify the suggestion.
- **Provide an example where this enhancement would improve YC Startup Map**

### Documentation

The documentation for this project are files that end with `.md` extension.

If you would like to improve the documentation in any of these areas, please open an issue if there isn't one already to discuss what you would like to improve. Then submit a pull request to this repository.

### Code

Unsure of where to begin contributing to YC Startup Map? You can start by looking through the issues labeled _good-first-issue_ and _help-wanted_. You can also start by contributing to the project documentation (e.g files with extension `.md`).

For instructions on setting up your environment, see the [setup](#setup---git-github-and-node) instructions in this document.

## Setup

If you don't already have [Git](https://git-scm.com/) installed, install it first. You will need it to contribute. You will also need to install [Node](https://nodejs.org/en) and [npm](https://www.npmjs.com/).

### Installation

1. [Fork](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo) the YC Startup Map repository.
2. Open a terminal, or "Git Bash" on Windows.
3. Use `cd` to move to the directory that you want to work in.
4. [Clone your repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository).
5. [Configure the remote repository for your fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/configuring-a-remote-repository-for-a-fork).
6. Install dependencies:
   ```bash
   npm install
   ```
7. Open the YC Startup Map folder in your favorite editor. If you don't have one, try [Visual Studio Code](https://code.visualstudio.com/)

### Getting Started

**Please complete [Setup](#setup) first and then return here.**

#### 1. Create enviornment variables

1. Create `.env.local`

```bash
 touch .env.local
```

2. Add the following variables in `.env.local`

```bash
 VITE_APP_TITLE="YC Startup Map"
 VITE_CESIUM_ION=""
```

#### 2. Create a Cesium Ion account and get a token

> Visit Cesium's [Cesium ion Access Tokens](https://cesium.com/learn/ion/cesium-ion-access-tokens/) docs to learn more about access tokens.

1. Follow and complete [CesiumJS Quickstart (Guide): Step 1](https://cesium.com/learn/cesiumjs-learn/cesiumjs-quickstart/#step-1-create-an-account-and-get-a-token).

2. After account creation, update and replace placeholder value for `VITE_CESIUM_ION` in your `.env.local` file.

```bash
VITE_CESIUM_ION="<CESIUM_ION_TOKEN>"
```

> **Note**: _Non-sensetive_ enviorment variables used client-side must have prefix \_VITE\_\_ and added to `vite-end.d.ts`. For more information see [Vite docs: Env Variables and Modes](https://vite.dev/guide/env-and-mode).

#### 3. Enable HTTPS for development (optional but recommended)

> In this case a [self-signed certificate](https://en.wikipedia.org/wiki/Self-signed_certificate) will be sufficent (in our opinion). Granted, there are other forms of certificates, such as locally trusted certificates generated with tools like [mkcert](https://github.com/FiloSottile/mkcert) or certificates issued by a certificate authority (CA) - depending on the development or testing scenario these may be more appropriate.

1. Create folder (`ssl/` or `tls/`) in project directory to place the created private key and public certificate beforehand:

```bash
cd ycstartupmap.com
```

```bash
mkdir ssl # or mkdir tls
```

2. Use the following command to create a private key and public certificate with [OpenSSL](https://www.openssl.org/):

> Replace placeholders `<KEY_FILE_NAME>` and `<CERT_FILE_NAME>` with the name of the files of your choosing.

```bash
openssl req -newkey rsa:2048 -nodes -keyout ssl/<KEY_FILE_NAME>.key -x509 -days 365 -out ssl/<CERT_FILE_NAME>.crt
```

Next, you will see several prompts asking for information in order to create your private key and public certificate.

3. create `.env.development.local`

```bash
cd ycstartupmap.com
```

```bash
touch .env.development.local
```

4. Add the following variables in `.env.development.local` and replace values `HTTPS_CERT` and `HTTPS_KEY` with the path of your private key and public certificate.

```bash
HTTPS_CERT="ssl/<CERT_FILE_NAME>.crt" # or tls/<CERT_FILE_NAME>.crt
HTTPS_KEY="ssl/<KEY_FILE_NAME>.key" #or tls/<KEY_FILE_NAME>.key
```

Helpful resources and guides regarding SSL/TLS and certficates:

- [OWASP Transport Layer Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html#introduction)
- [NodeJS Docs: TLS/SSL concepts](https://nodejs.org/api/tls.html#tlsssl-concepts)
- [Creating a self-signed certificate with OpenSSL](https://www.ibm.com/docs/en/api-connect/10.0.x_cd?topic=profile-using-openssl-generate-format-certificates#task_apionprem_generate_self_signed_openSSL__title__2)

## Linting, Formating, Building, and Testing

Once you have cloned YC Startup Map and completed [Setup](#setup), you can lint, format, build, and test the code from your terminal.

### Linting

To lint the code, run:

```bash
npm run lint
```

This will start eslint and check all files for stylistic problems. See [eslint.config.js](./eslint.config.js) file for project config and rules.

### Formating

To format the code, run:

```bash
npm run format
```

### Building

To compile the YC Startup Map source, run:

```bash
npm run build
```

Using [Vite](https://vite.dev/), this will start the TypeScript compiler and output the bundled JavaScript to the `dist` folder.

### Testing

To validate any changes you have made _in all test files_, run:

```bash
npm run test
```

To validate any changes you made _in a specifc file_, run:

```bash
npm run test <./folder-path-name/file-name>
```

To run code coverage, run:

```bash
npm run coverage
```

This will run all tests and output a detailed interactive HTML report, which will be generated in the `./coverage` directory (by default), which can be viewed in a web browser.

Coverage percentage requirement for the following thresholds in order for build to succeed:

| Threshold Type     | Required Coverage (%) |
| ------------------ | --------------------- |
| Line Coverage      | 80%                   |
| Branch Coverage    | 70%                   |
| Function Coverage  | 75%                   |
| Statement Coverage | 80%                   |

## Pull Request

Once you have finished working on an issue or feature, you can submit a pull request to have your changes merged into the YC Startup Map repository and included in the next release.

**Please do not change the project version number in a pull request.**

### Submitting a Pull Request

Before you submit your Pull Request (PR) consider the following:

1. Search for an open or closed PR that relates to your submission.
   You don't want to duplicate existing efforts.

2. Be sure that an issue describes the problem you're fixing, or documents the design for the feature you'd like to add.
   Discussing the design upfront helps to ensure that we're ready to accept your work.

3. Skip this step if you have completed [Setup](#setup). Otherwise, please complete it first and then return here.

4. In your forked repository, make your changes in a new git branch:

   ```bash
   git checkout -b my-fix-branch-issue-id main
   ```

   **Note**: Using an `issue-id` suffix is optional; however, referencing an issue in the PR branch name is encouraged.

5. Create your patch, **including appropriate test cases**.

6. Run the tests and ensure no linting errors.

7. Stage and commit your changes using a descriptive commit message.

   ```bash
   git add .
   git commit -m "Implement fix from issue-123"
   ```

   **Note**: Keeping your commits small and meaningul is encouraged.

8. Push your branch to your remote fork:

   ```bash
   git push -u origin my-fix-branch-issue-id
   ```

9. In GitHub, send a pull request to `YC Startup Map:main`.

### Reviewing a Pull Request

Community Leaders reserves the right not to accept pull requests from community members who haven't been good citizens of the community. Such behavior includes not following the [code of conduct](CODE_OF_CONDUCT.md).

### Addressing Review Feedback

If we ask for changes via code reviews then:

1. Make the required updates to the code.

2. Re-run tests to ensure tests are still passing.

3. Commit your changes as usual and push them to your feature branch (this will automatically update your Pull Request):

   ```bash
   git add .
   git commit -m "Address review feedback"
   git push origin my-fix-branch-issue-id
   ```

4. Squash your commits into a single meaningful commit using the GitHub UI or via interactive rebase is encouraged:

- Decide how many commits you want to squash. For example, to squash the last 5 commits, run:
  ```bash
  git rebase -i HEAD~5
  ```
- An editor will open with a list of commits like this:
  ```bash
  pick abc123 Commit message 1
  pick def456 Commit message 2
  pick 789abc Commit message 3
  pick 456def Commit message 4
  pick 123789 Commit message 5
  ```
- Change pick to squash (or s) for all commits you want to combine into the first one. For example:
  ```bash
  pick abc123 Commit message 1
  squash def456 Commit message 2
  squash 789abc Commit message 3
  squash 456def Commit message 4
  squash 123789 Commit message 5
  ```
- Since you rewrote history, Force-push the branch to your fork is required:
  ```bash
  git push origin --force my-fix-branch-issue-id
  ```

That's it! Thank you for your contribution!

### After Pull Request Merged

After your pull request is merged, you can safely delete your branch and pull the changes from the main (upstream) repository:

- Delete the remote branch on GitHub either through the GitHub web UI or your local terminal as follows:

  ```bash
  git push origin --delete my-fix-branch-issue-id
  ```

- Check out the main branch:

  ```bash
  git checkout main -f
  ```

- Delete the local branch:

  ```bash
  git branch -D my-fix-branch-issue-id
  ```

## Keeping Fork Synced with Upstream

- Update your local `main` with the latest changes from upstream:

  ```bash
  git pull --ff upstream main
  ```

- Fetch the latest changes from upstream:

  ```bash
  git fetch upstream
  ```

- Update your local `feature branch` with latest changes from upstream:

  ```bash
  git fetch upstream && git rebase upstream/main
  ```

## Resources

- [How to contribute to open source](https://opensource.guide/how-to-contribute/)
- [Contributing to a project](https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-a-project)
- [Using pull requests](https://help.github.com/articles/about-pull-requests/)
- [GitHub help](https://help.github.com)
