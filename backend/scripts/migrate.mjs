import dotenv from 'dotenv';
import { Pool } from 'pg';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';

dotenv.config({ path: ['.env.local', '.env'], override: false, quiet: true });
if (!process.env.MIGRATION_DATABASE_URL && !process.env.DATABASE_URL) throw new Error('DATABASE_URL or MIGRATION_DATABASE_URL is required.');
const pool = new Pool({ connectionString: process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 5000 });
const client = await pool.connect();
try {
    await client.query("SELECT pg_advisory_lock(hashtextextended('resilience-migrations', 0))");
    await client.query('CREATE TABLE IF NOT EXISTS research_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
    const folder = new URL('../migrations/', import.meta.url);
    for (const name of (await readdir(folder)).filter((name) => /^\d+.*\.sql$/.test(name)).sort()) {
        const sql = await readFile(new URL(name, folder), 'utf8');
        const checksum = createHash('sha256').update(sql.replaceAll('\r\n', '\n')).digest('hex');
        const previous = (await client.query('SELECT checksum FROM research_migrations WHERE name = $1', [name])).rows[0];
        if (previous) {
            if (previous.checksum !== checksum) throw new Error(`Applied migration changed: ${name}`);
            continue;
        }
        await client.query('BEGIN');
        try {
            await client.query(sql);
            await client.query('INSERT INTO research_migrations(name, checksum) VALUES ($1, $2)', [name, checksum]);
            await client.query('COMMIT');
            console.log(`Applied ${name}`);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
    }
    console.log('Research migrations are up to date.');
} finally {
    await client.query("SELECT pg_advisory_unlock(hashtextextended('resilience-migrations', 0))").catch(() => {});
    client.release();
    await pool.end();
}
