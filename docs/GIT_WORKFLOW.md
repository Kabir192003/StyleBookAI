# Git workflow — StyleBook AI

4-person team, one tech lead. This is the exact process for getting work
from a laptop into `main` without stepping on each other.

## One-time setup (lead only)

```bash
cd "stylebookai wf"
git init
git add .
git commit -m "Initial scaffold: config, types, lib, data, docs"
```

Create an empty repo on GitHub (no README/license/.gitignore — this folder
already has all three), then:

```bash
git branch -M main
git remote add origin https://github.com/<org-or-username>/stylebook.git
git push -u origin main
```

In the GitHub repo settings: **Settings → Collaborators**, add the other
three members. Then **Settings → Branches → Add branch protection rule**
for `main`: require a pull request before merging, require at least 1
approval. This means nobody — including you — pushes straight to `main`;
everything lands through a reviewed PR.

## One-time setup (everyone else)

```bash
git clone https://github.com/<org-or-username>/stylebook.git
cd stylebook
npm install
cp .env.local.example .env.local
```

Ask the lead for the real values to put in `.env.local` (Supabase/Clerk/
Anthropic keys) — never commit that file, it's already gitignored.

## The actual workflow, every time someone starts a task

1. **Always branch from an up-to-date `main`:**
   ```bash
   git checkout main
   git pull
   git checkout -b feature/<short-task-name>
   ```
   Example branch names: `feature/browse-colors`, `feature/studio-ui`,
   `feature/landing-page`, `feature/color-categorization`.

2. **Work, then commit in small, descriptive chunks** — not one giant
   commit at the end:
   ```bash
   git add <files you touched>
   git commit -m "Add ColorGrid component with filter bar"
   ```
   Commit message convention: imperative mood, what changed, no need for
   ticket numbers unless you're using a tracker. `git add .` is fine if
   you've been careful about what's in your working directory, but prefer
   `git add <path>` when you're not 100% sure nothing stray got created.

3. **Push your branch** (not `main`):
   ```bash
   git push -u origin feature/<short-task-name>
   ```

4. **Open a Pull Request on GitHub** from your branch into `main`. Write
   what it does and which doc section it follows (e.g. "implements the
   browse/colors page per PRODUCT_AND_UX.md §2"). Request the lead as
   reviewer.

5. **Lead reviews and merges** (squash merge keeps `main`'s history clean —
   one commit per feature instead of every intermediate commit). Use
   "Squash and merge" in the GitHub UI.

6. **Delete the branch** after merge (GitHub offers a button for this), and
   everyone else runs `git pull` on `main` before starting their next
   branch, so they're never building on stale code.

## Avoiding conflicts by design

The folder structure was deliberately split so people aren't editing the
same files. Browse pages, Studio UI, the landing page, and backend/AI work
each live in their own `app/<route>/` and `components/<feature>/` folders —
two people working in parallel almost never touch the same file.

**The one shared-file risk right now is `data/colors/`, `data/fonts/`,
`data/themes/`** — whoever does the categorization/segregation pass (moods,
styles, collections, tags) is editing files that the browse-page builder
also needs to import from. Handle this one with a quick rule: that person
finishes and merges their data PR *first*, before anyone branches off `main`
to build the page that consumes it. If both have to happen in parallel,
have the page-builder work against the placeholder seed data already in
`data/colors/tailwind.ts` and rebase onto `main` once the categorization PR
lands — don't have both people editing the same data file on different
branches at the same time.

## If a merge conflict happens anyway

```bash
git checkout main
git pull
git checkout feature/<your-branch>
git merge main
```
Git will mark conflicting sections directly in the file with `<<<<<<<`,
`=======`, `>>>>>>>` markers. Resolve by hand, then:
```bash
git add <resolved files>
git commit
git push
```
