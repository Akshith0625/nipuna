<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Permanent Project Rules

### GitHub Auto-Sync Workflow

This rule is permanently active for all development sessions in this repository.

1. **Trigger on Significant Changes**:
   - After completing every significant, logically coherent unit of work or feature milestone, initiate the auto-sync workflow.

2. **Validation & Pre-flight Checks**:
   - Run relevant tests and validation checks (e.g., `cmd /c npx tsc --noEmit` and build checks).
   - If validation fails, **do not** stage or push broken changes. Stop immediately and report the error details to the user.

3. **Diff Review & Selective Staging**:
   - Inspect `git status` and `git diff` carefully.
   - Stage **only** the intended project files (`git add <files>`).
   - **Never** stage or commit secrets, credentials, API keys, or private local environment files (`.env.local`, `.env`).
   - **Never** discard existing work or overwrite unrelated modifications.

4. **Meaningful Conventional Commits**:
   - Formulate descriptive Conventional Commit messages following the format: `<type>: <description>` (e.g., `feat: add Supabase browser client and connection verification`, `fix: resolve API route type error`).

5. **Safe Push & Remote Sync**:
   - Automatically push successful commits to the current remote branch (e.g., `git push origin main`).
   - **Never force-push (`--force`)**.
   - If Git commands require explicit user approval in the environment, request approval rather than falsely claiming the push succeeded.

6. **Reporting**:
   - Upon completion, always report:
     - Commit hash and commit message
     - Target branch and remote
     - Validation results (type check, tests, build)
     - Push status and confirmation

