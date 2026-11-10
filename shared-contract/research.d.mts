export interface SqlCommand { sql: string; params: unknown[]; }
export interface ResearchDatabase {
    dialect: string;
    all(sql: string, params?: any[]): Promise<any[]>;
    batch(commands: SqlCommand[]): Promise<void>;
    transaction<T>(key: string, callback: (db: ResearchDatabase) => Promise<T>): Promise<T>;
}
export interface ResearchConfig { testerParticipantCodes?: string[]; adminParticipantCodes?: string[]; adminExportToken?: string; exportCredentialId?: string; }
export class ContractError extends Error { status: number; code: string; constructor(status: number, code: string, message: string); }
export class ResearchService {
    constructor(db: ResearchDatabase | null, config?: ResearchConfig);
    config: ResearchConfig;
    startParticipantSession(body: any): Promise<any>;
    resolveParticipant(code: string, sessionId: string): Promise<any>;
    moduleRun(body: any, action: string): Promise<any>;
    events(body: any): Promise<any>;
    replay(body: any): Promise<any>;
    recordAiCallEvent(input: any): Promise<void>;
    exportRows(filters: any, requestedBy: string): Promise<any[]>;
}
export function createD1Adapter(db: any): ResearchDatabase | null;
export function handleResearchRequest(request: Request, service: ResearchService, headers?: Record<string, string>): Promise<Response | null>;
export function toCsv(rows: any[]): string;
