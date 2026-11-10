import { Pool, type PoolClient } from 'pg';
import type { ResearchDatabase, SqlCommand } from '../../../shared-contract/research.mjs';

function parameterize(sql: string): string {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
}

export function createPostgresDatabase(pool: Pool): ResearchDatabase {
    function connection(client: Pool | PoolClient): ResearchDatabase {
        const adapter: ResearchDatabase = {
            dialect: 'postgres',
            async all(sql, params = []) {
                return (await client.query(parameterize(sql), params)).rows;
            },
            async batch(commands: SqlCommand[]) {
                if (client === pool) {
                    await adapter.transaction('batch', async (tx) => { await tx.batch(commands); });
                    return;
                }
                for (const { sql, params } of commands) await client.query(parameterize(sql), params);
            },
            async transaction(key, callback) {
                if (client !== pool) return callback(adapter);
                for (let attempt = 0; ; attempt++) {
                    const session = await pool.connect();
                    try {
                        await session.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
                        await session.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [key]);
                        const result = await callback(connection(session));
                        await session.query('COMMIT');
                        return result;
                    } catch (error) {
                        await session.query('ROLLBACK').catch(() => {});
                        const code = (error as { code?: string }).code;
                        if (attempt < 3 && (code === '40001' || code === '40P01')) continue;
                        throw error;
                    } finally {
                        session.release();
                    }
                }
            }
        };
        return adapter;
    }
    return connection(pool);
}

export function createResearchPool(databaseUrl: string): Pool {
    const pool = new Pool({ connectionString: databaseUrl, max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000 });
    pool.on('error', () => console.warn('Idle research database connection failed'));
    return pool;
}
