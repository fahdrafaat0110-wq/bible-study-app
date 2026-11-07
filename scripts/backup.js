/**
 * Database Backup Script
 *
 * Usage:
 *   node scripts/backup.js           # Creates timestamped backup in ./backups/
 *   node scripts/backup.js --restore ./backups/backup-2024-01-15T10-30-00.db
 *
 * Run via npm: npm run backup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`Created backup directory: ${BACKUP_DIR}`);
  }
}

function createBackup() {
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.db`);

  try {
    fs.copyFileSync(DB_PATH, backupFile);
    console.log(`✅ Backup created: ${backupFile}`);

    // Also create a compressed version
    const gzFile = backupFile + '.gz';
    execSync(`gzip -c "${backupFile}" > "${gzFile}"`);
    console.log(`✅ Compressed backup: ${gzFile}`);

    // Clean old backups (keep last 30)
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup-') && f.endsWith('.db'))
      .sort()
      .reverse();
    if (backups.length > 30) {
      backups.slice(30).forEach(f => {
        fs.unlinkSync(path.join(BACKUP_DIR, f));
        const gz = f + '.gz';
        if (fs.existsSync(path.join(BACKUP_DIR, gz))) fs.unlinkSync(path.join(BACKUP_DIR, gz));
      });
      console.log(`🗑️ Cleaned old backups (kept latest 30)`);
    }

    return backupFile;
  } catch (e) {
    console.error('❌ Backup failed:', e.message);
    process.exit(1);
  }
}

function restoreBackup(backupFile) {
  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Backup file not found: ${backupFile}`);
    process.exit(1);
  }

  console.log(`⚠️  Restoring from ${backupFile}...`);
  console.log(`   This will OVERWRITE the current database!`);
  console.log(`   Press Ctrl+C within 5 seconds to cancel...`);

  setTimeout(() => {
    try {
      fs.copyFileSync(backupFile, DB_PATH);
      console.log(`✅ Database restored from ${backupFile}`);
    } catch (e) {
      console.error('❌ Restore failed:', e.message);
      process.exit(1);
    }
  }, 5000);
}

function listBackups() {
  ensureBackupDir();
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-') && f.endsWith('.db'))
    .sort()
    .reverse();

  if (backups.length === 0) {
    console.log('No backups found.');
    return;
  }

  console.log('Available backups:');
  backups.forEach((f, i) => {
    const stats = fs.statSync(path.join(BACKUP_DIR, f));
    const size = (stats.size / 1024).toFixed(1);
    console.log(`  ${i + 1}. ${f} (${size} KB) - ${stats.mtime.toLocaleString('ar-EG')}`);
  });
}

// CLI
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage:
  node scripts/backup.js              Create a new backup
  node scripts/backup.js --list       List all backups
  node scripts/backup.js --restore <backup-file.db>  Restore from backup
  node scripts/backup.js --help       Show this help
`);
  process.exit(0);
}

if (args.includes('--list')) {
  listBackups();
} else if (args.includes('--restore')) {
  const idx = args.indexOf('--restore');
  if (idx + 1 < args.length) {
    restoreBackup(args[idx + 1]);
  } else {
    console.error('❌ --restore requires a backup file path');
    process.exit(1);
  }
} else {
  createBackup();
}