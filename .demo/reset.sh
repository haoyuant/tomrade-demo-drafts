#!/usr/bin/env bash
# Puts the demo repository back where every take starts: main at the demo-baseline
# tag, no other branches, no open pull requests, and two fresh seed issues.
# Run from this checkout: .demo/reset.sh [--yes]
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)

if [[ "${1:-}" != "--yes" ]]; then
  echo "This closes every open pull request and issue in $repo, deletes every branch but main,"
  echo "force-pushes main back to demo-baseline and resets this checkout (uncommitted work is lost)."
  read -r -p "Go on? [y/N] " answer
  [[ "$answer" == [yY] ]] || exit 1
fi

git fetch --quiet --prune --tags origin

for pr in $(gh pr list -R "$repo" --state open --json number -q '.[].number'); do
  gh pr close "$pr" -R "$repo" --comment "Closed by the demo reset." >/dev/null
  echo "closed PR #$pr"
done

for issue in $(gh issue list -R "$repo" --state open --json number -q '.[].number'); do
  gh issue close "$issue" -R "$repo" --comment "Closed by the demo reset." >/dev/null
  echo "closed issue #$issue"
done

for branch in $(git for-each-ref --format='%(refname:lstrip=3)' refs/remotes/origin); do
  [[ "$branch" == "main" || "$branch" == "HEAD" ]] && continue
  git push --quiet origin --delete "$branch"
  echo "deleted origin/$branch"
done

git push --quiet --force origin "demo-baseline^{commit}:refs/heads/main"
echo "main is at demo-baseline"

# Agent worktrees Tomrade made for this checkout hold the old branches.
main_dir=$(pwd -P)
git worktree list --porcelain | awk '/^worktree /{print substr($0, 10)}' | while read -r dir; do
  [[ "$(cd "$dir" 2>/dev/null && pwd -P)" == "$main_dir" ]] && continue
  git worktree remove --force "$dir" && echo "removed worktree $dir"
done
git worktree prune

git checkout --quiet main
git reset --quiet --hard origin/main
git clean -fdq
for branch in $(git for-each-ref --format='%(refname:lstrip=2)' refs/heads); do
  [[ "$branch" == "main" ]] || git branch -q -D "$branch"
done

for file in .demo/issues/*.md; do
  title=$(head -n 1 "$file")
  url=$(tail -n +3 "$file" | gh issue create -R "$repo" --title "$title" --body-file -)
  echo "opened $url"
done

echo "Done. Next: a fresh “Feedback form” project in Tomrade, then node .demo/seed.mjs (see .demo/README.md)."
