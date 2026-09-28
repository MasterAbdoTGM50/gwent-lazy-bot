#!/usr/bin/env bash
# Deploys one commit of main on the server. Runs as lazybot, only through the GitHub deploy
# key's forced command (see the README, under "Deployment"); the commit to deploy arrives
# as SSH_ORIGINAL_COMMAND. To deploy by hand, use "Run workflow" in GitHub Actions instead.
set -euo pipefail
# Non-interactive SSH doesn't source .bashrc, so put Bun on the PATH explicitly.
export PATH="$HOME/.bun/bin:$PATH"

# Untrusted input: accept a full commit hash and nothing else.
SHA="${SSH_ORIGINAL_COMMAND:-}"
[[ "$SHA" =~ ^[0-9a-f]{40}$ ]] || { echo "invalid sha" >&2; exit 1; }

cd "$HOME/gwent-lazy-bot"
# The deploy branch is main; master is only a fallback while the default branch is being renamed.
BRANCH=main
git ls-remote --exit-code --heads origin main >/dev/null || BRANCH=master
# An explicit refspec, so this works whatever the clone's fetch settings are.
git fetch --quiet origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"
# Only commits that are on the deploy branch can be deployed (re-running an older run rolls back to it).
git merge-base --is-ancestor "$SHA" "origin/$BRANCH" || { echo "$SHA is not on $BRANCH" >&2; exit 1; }
git checkout --quiet --detach "$SHA"
bun install --frozen-lockfile --production

sudo /usr/bin/systemctl restart gwent-lazy-bot
# A bot that crashes on startup (bad token, broken commit) is "activating" again within seconds.
sleep 8
if systemctl is-active --quiet gwent-lazy-bot; then
    echo "deployed $SHA"
else
    echo "gwent-lazy-bot is not running after the restart; check journalctl -u gwent-lazy-bot" >&2
    exit 1
fi
