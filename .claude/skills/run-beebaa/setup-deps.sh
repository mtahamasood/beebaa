#!/usr/bin/env bash
# One-time setup for driving beebaa headlessly: Playwright's Chromium
# plus the system libs it needs. Rootless fallback for containers/WSL
# where sudo needs a password.
set -euo pipefail

LIBS_ROOT="$HOME/.cache/beebaa-chromium-libs"

npx playwright install chromium

BIN=$(ls "$HOME"/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | tail -1)
if [ -z "$BIN" ]; then
  echo "ERROR: chromium headless shell not found after install" >&2
  exit 1
fi

missing() {
  LD_LIBRARY_PATH="$LIBS_ROOT/root/usr/lib/x86_64-linux-gnu" ldd "$BIN" 2>/dev/null | grep 'not found' || true
}

if [ -z "$(missing)" ]; then
  echo "OK: all chromium libs resolve"
  exit 0
fi

# Preferred: system-wide install if passwordless sudo happens to work.
if sudo -n true 2>/dev/null; then
  sudo npx playwright install-deps chromium
  exit 0
fi

# Rootless: download the .debs and extract locally, no root needed.
# libasound2t64 is pinned: the noble-updates version referenced by the
# stale local apt index 404s, and newer pool builds need GLIBC 2.43+.
echo "sudo unavailable — extracting libs rootlessly to $LIBS_ROOT"
mkdir -p "$LIBS_ROOT/debs" "$LIBS_ROOT/root"
cd "$LIBS_ROOT/debs"
apt-get download libnspr4 libnss3 2>/dev/null || true
curl -sfO http://archive.ubuntu.com/ubuntu/pool/main/a/alsa-lib/libasound2t64_1.2.11-1ubuntu0.4_amd64.deb
for d in *.deb; do dpkg -x "$d" "$LIBS_ROOT/root"; done

if [ -n "$(missing)" ]; then
  echo "ERROR: still missing after rootless extract:" >&2
  missing >&2
  exit 1
fi
echo "OK: all chromium libs resolve via $LIBS_ROOT (driver sets LD_LIBRARY_PATH automatically)"
