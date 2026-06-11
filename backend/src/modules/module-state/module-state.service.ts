import type { ModuleContextSnapshot } from './module-context.builder.js';

export class ModuleStateService {
    private readonly snapshots = new Map<string, ModuleContextSnapshot>();

    save(snapshot: ModuleContextSnapshot): ModuleContextSnapshot {
        const key = `${snapshot.sessionId}:${snapshot.moduleId}`;
        this.snapshots.set(key, snapshot);
        return snapshot;
    }

    get(sessionId: string, moduleId: string): ModuleContextSnapshot | null {
        return this.snapshots.get(`${sessionId}:${moduleId}`) ?? null;
    }
}
