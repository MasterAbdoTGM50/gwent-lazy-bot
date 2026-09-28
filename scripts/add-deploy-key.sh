#!/usr/bin/env bash
# Lets GitHub Actions deploy: adds a deploy key's public half for the lazybot user, locked so the
# key can only run scripts/deploy.sh (no shell, no forwarding). Run as root on the server:
#
#   bash /home/lazybot/gwent-lazy-bot/scripts/add-deploy-key.sh "ssh-ed25519 AAAA... github-actions deploy"
#
# The private half goes into the DEPLOY_SSH_KEY secret of the repo's "production" environment
# (see the README, under "Deployment"). Safe to re-run with the same key.
set -euo pipefail

BOT_USER="lazybot"
DEPLOY_SCRIPT="/home/$BOT_USER/gwent-lazy-bot/scripts/deploy.sh"
KEYS="/home/$BOT_USER/.ssh/authorized_keys"

[[ $EUID -eq 0 ]] || { echo "Run this as root." >&2; exit 1; }
PUBLIC_KEY="${1:-}"
[[ "$PUBLIC_KEY" =~ ^ssh-(ed25519|rsa)\ [A-Za-z0-9+/=]+(\ .*)?$ ]] || {
    echo "Usage: $0 \"ssh-ed25519 AAAA... comment\"  (the .pub file's contents)" >&2
    exit 1
}
key_body="$(cut -d' ' -f2 <<<"$PUBLIC_KEY")"

install -d -m 700 -o "$BOT_USER" -g "$BOT_USER" "/home/$BOT_USER/.ssh"
touch "$KEYS"
if grep -qF "$key_body" "$KEYS"; then
    echo "This key is already installed."
else
    echo "command=\"$DEPLOY_SCRIPT\",restrict $PUBLIC_KEY" >> "$KEYS"
    echo "Deploy key installed; it can only run $DEPLOY_SCRIPT."
fi
chown "$BOT_USER:$BOT_USER" "$KEYS"
chmod 600 "$KEYS"
