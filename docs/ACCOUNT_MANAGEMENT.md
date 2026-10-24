# Administrator account lifecycle

Requested 22 October 2026 as a separate full-stack feature following the frontend overhaul.

Open **People & assignments → Manage account → Account access**. Current administrator accounts cannot remove themselves. Other administrator accounts show access controls without exposing the normal role-edit form.

- **Deactivate account** blocks new login, revokes existing app sessions and local event streams, removes current driver/operator assignments, clears that operator's device approval and suppresses queued SMS jobs. Messages, incidents, readings and other history remain. Existing accounts default to active; the migration does not deactivate anyone.
- **Reactivate account** restores login eligibility. Vehicle/operator assignments and device approvals require separate administrator review.
- **Permanently delete account** is available after deactivation. The administrator must type the selected account's email and provide a reason. The server refuses deletion when operational history references the account. This is intended for unused/test/duplicate accounts, not a way to erase fleet evidence.

The server enforces admin access, self-removal protection and at least one remaining active admin. A serialized guard row and in-process transaction queue protect concurrent account/assignment changes. Account lists expose active/deactivated status and filters; assignment selectors exclude inactive users. Lifecycle actions and retained identity snapshots appear in administrative activity search.

The older account-edit API also rejects edits to administrator or inactive accounts, preventing it from bypassing lifecycle protections. Assignments recheck the actor, target role, TODA and active state inside the serialized transaction.

Endpoints: `POST /api/admin/people/:id/status` with `{active,confirmation_email,reason}`; `DELETE /api/admin/people/:id` with `{confirmation_email,reason}`. Existing JSON error handling and authentication middleware remain in use. Permanent deletion retains administrative audit rows, snapshots the former actor name, removes account preferences and obsolete invitations, and deletes the sign-in profile.

Migrations `013_account_lifecycle.sql` and `014_account_lifecycle_supabase.sql` are additive. SQLite and PostgreSQL-compatible fixtures use the same base schema. Supabase browser roles cannot access the lifecycle/guard tables directly. Hosted-provider deletion is performed with the existing server-side identity adapter; failures leave an inactive deletion-pending account that cannot be reactivated. Retry finishes cleanup, including recovery if the identity was already removed. No hosted provider or paid SMS is activated by this implementation.

Verification uses only disposable accounts/databases: `node --import tsx --test tests/account-lifecycle.test.ts`, `node --import tsx tests/account-lifecycle-browser.ts`, `npm.cmd test`. To check PostgreSQL SQL behavior, set `$env:SOLAIR_TEST_POSTGRES='1'` for the lifecycle, account and operations suites. This is local compatibility testing, not hosted Supabase acceptance. Working accounts must be removed only through an administrator's explicit UI confirmation.

Validation completed: 97 automated tests, six PostgreSQL-compatible lifecycle checks, desktop (1440px) and mobile (390px) confirmation/recovery flows, lint and production build passed. Browser checks include provider-failure recovery using a fixture, keyboard cancellation/focus, and refusal to delete accounts with operational history. Hosted identity deletion was tested through a fake adapter; no live account was removed.
