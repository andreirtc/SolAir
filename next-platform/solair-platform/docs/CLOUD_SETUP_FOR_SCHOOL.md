# SOLAIR: Codex Cloud setup for school

Prepared 12 October 2026. Public repository: https://github.com/andreirtc/SolAir . Initial source commit 361b714 was pushed to main. Cloud account setup is still for you to complete; source upload alone does not create an environment or deploy the website.

## 1. Open your account

On your school computer, open https://chatgpt.com and sign in to the same ChatGPT account you use for this project. You can do cloud coding in a browser; this workflow does not require Arduino IDE on that computer.

## 2. Create the cloud environment

In a new task, choose **Work in > Cloud > Select environment > Create environment**. Another documented route is **Settings > Codex Cloud > Environments > Create environment**.

Connect GitHub if prompted, sign into **andreirtc**, and grant the connection access to **SolAir**. Select **andreirtc/SolAir**, then **Get started**. If it is missing, check that the GitHub connection has this repository selected and refresh the repository picker.

Source: [OpenAI cloud environment instructions](https://learn.chatgpt.com/docs/environments/cloud-environments).

## 3. Tell setup exactly what this project needs

Paste this into the environment setup conversation:

```text
Set up andreirtc/SolAir from main. First inspect the actual checkout path and tools.
Read root AGENTS.md and next-platform/solair-platform/docs/CLOUD_CONTINUATION.md.
The authoritative application is next-platform/solair-platform; preserve it.
Use Node.js 24.x and npm. Install the locked app dependencies with npm ci.
Run npm run typecheck and npm test from the app directory and report actual results.
Configure development startup as npm run dev from that same directory, on port 3000.
Use isolated development data. Do not request or import my home working database,
Wi-Fi credentials, real device tokens or production credentials for basic setup.
Keep unverified hardware interfaces disabled and physical acceptance separate.
Record the tested install/start workflow. Diagnose failed setup commands before publishing.
```

The application commands, once Node 24 is available, are:

```sh
# From the actual SolAir repository root:
cd next-platform/solair-platform
node --version
npm ci
npm run typecheck
npm test
```

Expect node --version to start with v24. Do not reuse the home PC's C: paths in the Linux cloud workspace. Setup can install missing runtimes and tools; ask it to resolve version errors instead of accepting a failed installation.

For later firmware compilation, ask the task to inspect Python, install PlatformIO 6.1.18 in an isolated environment, and use firmware/solair-cpe/platformio.ini. Tool downloads need network access. Compile-only checks do not upload an ESP32 or test attached hardware.

## 4. Review and publish the environment

Read the setup report. If dependency installation, typecheck or tests fail, ask Codex to fix the cause and rerun the failed checks. Save configuration, choose **Publish**, and wait for **Environment published**. Then choose **Start a new task**. These are the documented environment steps; publishing prepares a reusable coding environment, not public application hosting.

Source: [OpenAI Codex Cloud quickstart](https://learn.chatgpt.com/docs/cloud).

## 5. Give the new task our context

Paste this as its first message:

```text
Continue our existing SOLAIR project in this repository.
Read root AGENTS.md, then next-platform/solair-platform/docs/CLOUD_CONTINUATION.md,
the full SOLAIR_Full_CPE_Firmware_Breadboard_Software_Integration_Prompt.md,
and the current CPE validation and test-by-test wiring guides.
Preserve the premium centralized app in next-platform/solair-platform.
All CPE modules have implementations; do not create a separate website.
ADS1115 single-ended ground readings remain unresolved, while differential
readings are near zero. Do not subtract a guessed offset or claim a hardware PASS.
First check this environment's paths, tools and current git state. Summarize
our present checkpoint and software checks, then help me continue the tests.
Keep actual bench observations separate from compilation and simulated data.
```

The handoff captures decisions, wiring/firmware state, tests and unresolved issues. Git does not automatically import the complete desktop conversation or temporary photo attachments. Keep the original chat, and attach actual board photos again when needed.

## 6. Check the application in the cloud

Ask the task:

```text
Start the existing SOLAIR app with npm run dev from next-platform/solair-platform.
Verify the server is ready and open its available cloud preview.
Explain how I can sign into the isolated development instance using its README.
```

The development server uses port 3000. Use the cloud preview URL the environment provides. Typing localhost:3000 on the school computer points to that school computer, not the cloud server. If this account/environment offers no browser preview, ask for available preview options and continue source/test work; do not claim the application is deployed.

The home database and accounts are excluded from Git. A fresh development instance has its own data and development-only seed accounts documented in the app README. Never mistake demonstration readings for live ESP32 telemetry. Public production hosting is a separate Railway/Supabase workflow in docs/RAILWAY_SUPABASE.md.

## 7. Save school changes and bring them home

Continue the same cloud task to retain its conversation and workspace. Before finishing, ask:

```text
Run the checks appropriate to today's changes. Update CLOUD_CONTINUATION.md
and CPE_VALIDATION.md with actual results and remaining physical tests.
Commit the reviewed source changes on a branch and open a pull request to main.
Do not include private configuration or databases. Give me the pull request link.
```

Review the changed files and checks before merging the pull request on GitHub. To update this home checkout afterward, open PowerShell and run:

```powershell
Set-Location C:\Users\Admin\Videos\SolAir
git status --short
```

If that prints nothing, the working tree is clean; then run:

```powershell
git pull --ff-only origin main
```

If status lists changes, preserve them first and ask Codex to reconcile them. Do not use reset --hard or force-push to make a pull succeed. Ignored private configs stay local; review relevant config-example changes when updating firmware.

Cloud tasks can keep running while the home computer sleeps. Physical ESP32 upload, serial monitoring, wiring and siren/power tests require a computer connected to the actual equipment. Source: [OpenAI Codex Cloud](https://learn.chatgpt.com/docs/cloud).

On a shared school computer, sign out of ChatGPT and GitHub when finished and do not save passwords to its browser.
