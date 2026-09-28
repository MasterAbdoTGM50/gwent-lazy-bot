#!/usr/bin/env bash
# Turns a fresh Ubuntu 24.04 server into one that runs the bot under systemd. Run as root:
#
#   curl -fsSL https://raw.githubusercontent.com/MasterAbdoTGM50/gwent-lazy-bot/master/scripts/setup-server.sh | bash
#
# Safe to re-run: finished steps are skipped and a running bot is not restarted. It never touches
# SSH settings or secrets. When the token is missing it stops before starting the bot and says
# what to do next. See the README, under "Deployment", for the resulting setup.
set -euo pipefail

REPO_URL="https://github.com/MasterAbdoTGM50/gwent-lazy-bot.git"
BOT_USER="lazybot"
APP_DIR="/home/$BOT_USER/gwent-lazy-bot"
BUN="/home/$BOT_USER/.bun/bin/bun"
SERVICE="gwent-lazy-bot"

step() { printf '\n==> %s\n' "$*"; }
as_bot() { su - "$BOT_USER" -c "$*"; }

[[ $EUID -eq 0 ]] || { echo "Run this as root." >&2; exit 1; }
export DEBIAN_FRONTEND=noninteractive

step "Swap (1 GB safety net for memory spikes)"
if ! swapon --show | grep -q /swapfile; then
    fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap -q /swapfile && swapon /swapfile
    grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
sysctl -q -p /etc/sysctl.d/99-swappiness.conf

step "System updates and packages (unzip is needed by the Bun installer)"
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq git unzip sqlite3 unattended-upgrades
systemctl enable --now unattended-upgrades >/dev/null

step "The $BOT_USER user"
id "$BOT_USER" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "$BOT_USER"

step "Bun"
[[ -x "$BUN" ]] || as_bot "curl -fsSL https://bun.sh/install | bash"
as_bot "$BUN --version"

step "The code and card data"
[[ -d "$APP_DIR/.git" ]] || as_bot "git clone -q $REPO_URL $APP_DIR"
as_bot "cd $APP_DIR && $BUN install --frozen-lockfile --production"
as_bot "cd $APP_DIR && { [ -f .env ] || { cp .env.example .env && chmod 600 .env; }; }"
as_bot "cd $APP_DIR && $BUN run update-cards"

step "Log retention, the restart rule for deploys, and the service"
install -D -m 644 "$APP_DIR/deploy/journald-retention.conf" /etc/systemd/journald.conf.d/retention.conf
visudo -cqf "$APP_DIR/deploy/sudoers-gwent-lazy-bot"
install -m 440 "$APP_DIR/deploy/sudoers-gwent-lazy-bot" "/etc/sudoers.d/$SERVICE"
install -m 644 "$APP_DIR/deploy/$SERVICE.service" /etc/systemd/system/
systemctl restart systemd-journald
systemctl daemon-reload

if ! grep -qE '^DISCORD_TOKEN=.+' "$APP_DIR/.env"; then
    step "Almost done: the bot token is missing"
    cat <<EOF
1. Put the token in $APP_DIR/.env (DISCORD_TOKEN=...), keeping the file owned by $BOT_USER.
2. Start the bot:       systemctl enable --now $SERVICE
3. Check the log:       journalctl -u $SERVICE -f     (look for "Ready as ... in N servers")
4. Register commands:   su - $BOT_USER -c 'cd gwent-lazy-bot && ~/.bun/bin/bun run register-commands --yes'
5. Automatic deploys:   bash $APP_DIR/scripts/add-deploy-key.sh "<deploy public key>"
EOF
    exit 0
fi

step "Starting the bot (left alone if it's already running)"
systemctl enable --now "$SERVICE"
sleep 5
systemctl is-active "$SERVICE"
journalctl -u "$SERVICE" -n 5 --no-pager -o cat
