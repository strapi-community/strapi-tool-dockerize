export interface SQLiteBackupConfig {
  frequency: 'hourly' | 'daily' | 'weekly';
  retention: number; // days
  path: string;
}

export const defaultBackupConfig: SQLiteBackupConfig = {
  frequency: 'daily',
  retention: 7,
  path: '/data/backups'
};

export function generateBackupScript(dbPath: string, config: SQLiteBackupConfig = defaultBackupConfig): string {
  return `#!/bin/sh

# Backup directory
BACKUP_DIR="${config.path}"
DB_PATH="${dbPath}"
RETENTION_DAYS=${config.retention}

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/sqlite_backup_$TIMESTAMP.sq3"

# Create backup using SQLite's backup API
sqlite3 $DB_PATH ".backup $BACKUP_FILE"

# Compress backup
gzip $BACKUP_FILE

# Clean up old backups
find $BACKUP_DIR -name "sqlite_backup_*.sq3.gz" -mtime +$RETENTION_DAYS -delete

# Log backup completion
echo "Backup completed: $BACKUP_FILE.gz"
`;
}

export function generateCronJob(config: SQLiteBackupConfig = defaultBackupConfig): string {
  const schedule = {
    hourly: '0 * * * *',
    daily: '0 0 * * *',
    weekly: '0 0 * * 0'
  }[config.frequency];

  return `
# Add backup cron job
RUN echo "${schedule} /backup.sh >> /var/log/backup.log 2>&1" >> /etc/crontabs/root
`;
} 