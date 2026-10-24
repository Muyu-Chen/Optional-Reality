#!/usr/bin/env bash
# Run on muuyyy as root: bash switch-site.sh NEW_RELEASE EXPECTED_CURRENT
set -euo pipefail
if [ "$#" -ne 2 ]; then
    echo 'Usage: switch-site.sh NEW_RELEASE EXPECTED_CURRENT' >&2
    exit 2
fi
root=/var/www/muu-tech
case "$1" in "$root"/releases/*) ;; *) echo 'Release must be under /var/www/muu-tech/releases/' >&2; exit 2 ;; esac
release=$(realpath -e -- "$1")
expected=$(realpath -e -- "$2")
case "$release" in "$root"/releases/*) ;; *) echo 'Resolved release is outside releases/' >&2; exit 2 ;; esac
[ -d "$release" ] && [ -f "$release/index.html" ]
[ -L "$root/current" ]
[ "$(readlink -f -- "$root/current")" = "$expected" ] || { echo 'Current site changed; stop and investigate' >&2; exit 1; }
apache2ctl configtest
next="$root/.current-next-$$"
trap 'if [ -L "$next" ]; then rm -- "$next"; fi' EXIT
ln -s -- "$release" "$next"
[ "$(readlink -f -- "$root/current")" = "$expected" ] || { echo 'Current site changed before switch' >&2; exit 1; }
mv -Tf -- "$next" "$root/current"
printf 'Current site: %s\nPrevious site: %s\n' "$release" "$expected"
