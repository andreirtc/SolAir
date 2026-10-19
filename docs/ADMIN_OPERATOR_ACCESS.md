# Administrator and operator access — 19 October 2026

This is the current permission policy. It supersedes earlier instructions that allowed operators to invite accounts, register vehicles, edit other users or change assignments. Personal settings are separate from administration.

| Action | Administrator | Operator |
|---|---|---|
| Home | Cross-TODA account, organization, assignment and saved device-readiness summaries; activity history | Own-TODA fleet overview |
| View fleet/map/energy/history | Active TODA workspace | Own TODA only |
| Acknowledge incidents, add shared notes and resolve | Yes, in active workspace | Yes, own TODA |
| Respond to assistance and send vehicle messages | Yes, in active workspace | Yes, own TODA |
| Read people directory and manage other accounts | Yes | No |
| Approve operator access and link new accounts to TODAs | Yes | No |
| Invite users or register vehicles | Yes | No |
| Assign vehicles/drivers/responsible operators | Yes | No |
| Create organizations or change administrative workspace | Yes | No |
| Open administrative activity log and summary API | Yes | No |
| Device credentials, readiness and engineering tools | Authorized administrator/engineer workflows retained | No |
| Edit own profile, shared operator business information, appearance and contact preferences | Yes | Yes |

Administrators open **Organizations → Open workspace** before changing a TODA's fleet records. The administration overview counts all TODAs, while the fleet tools and selected device are scoped to the active workspace. Established account transfers retain the existing history-review restriction. Public signup still cannot grant privileged access or claim a vehicle. Driver access remains assigned-vehicle only.

The administrative directory uses the existing search, filters and pagination. Backend authorization rejects operator requests to the people/users directories, account edits, invitations, vehicle registration, assignments, organizations/workspace management and device administration; hiding navigation is not the access control.

The overview's device counts describe saved approval records, not physical test results. SMS remains disabled in the local launcher. No database migration, existing user/assignment edit, credential change, firmware change or physical test is part of this interface/permission adjustment.

## Verification

- Full isolated automated suite: 91/91 passed, including preserved operator assistance/messages and new administrator-only restrictions. An older provider invitation test initially failed because it invited as an operator; its setup now authenticates an administrator and the rerun passed.
- Embedded PostgreSQL focused operations/workflows: 31/31 passed, including overview SQL, unauthorized requests and unchanged records after denial. This is not hosted Supabase acceptance.
- Lint and final production build/type checking passed.
- Disposable production browser: 18 reported check groups passed, including distinct administrator/operator homes, admin management counts, 1440px/390px admin layouts, rejected operator admin API calls, driver signup/assignments/settings, protected CPE Lab and retained operator incident handling. No browser runtime errors. The first browser run caught mobile overflow in the new action buttons; wrapping was corrected, rebuilt and verified on the successful rerun. Screenshots and results are local ignored files under `test-results/operational-ui/`.
- `git diff --check` passed. Validation preceded publication. No physical hardware, SMS delivery or cloud acceptance test was performed.

## Source publication

The user approved committing and pushing this adjustment on a separate feature branch after validation. Publication target: `jacobedianamae/SolAir-System`, branch `feature/admin-operator-separation`, based on the flat application's earlier `129a155` backup checkpoint. This history is separate from the group application's main history; use a reviewed source transfer for later integration. Publishing this branch does not deploy the website or merge into main. Local CPE evidence, private databases, credentials and preview helper processes are excluded.

See [daily workflow instructions](DAILY_WORKFLOWS.md), [local startup](PORT3000_INTEGRATION.md) and [physical acceptance](OPERATIONAL_ACCEPTANCE.md). Existing validation reports describe earlier checkpoints; this document records the revised operator policy.
