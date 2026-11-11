#!/usr/bin/env bash
set -euo pipefail
umask 077

# systemd runs this as the local postgres user, using peer authentication.
# No passwords or connection strings are included in the script or logs.
backup_dir=/var/backups/resilience
archive="$backup_dir/resilience-$(date -u +%Y%m%dT%H%M%SZ).dump"
test -d "$backup_dir"
/usr/bin/pg_dump --format=custom --dbname=resilience_programme --file="$archive"
/usr/bin/pg_restore --list "$archive" >/dev/null
printf 'Created PostgreSQL backup: %s\n' "$archive"

# Keep the newest 14 verified daily archives on the root volume.
mapfile -t expired_archives < <(
    find "$backup_dir" -maxdepth 1 -type f -name 'resilience-????????T??????Z.dump' -printf '%T@ %p\n' \
        | sort -nr \
        | tail -n +15 \
        | cut -d' ' -f2-
)
for expired_archive in "${expired_archives[@]}"; do
    rm -- "$expired_archive"
done

# Copy verified archives off the VM separately for disaster recovery.
