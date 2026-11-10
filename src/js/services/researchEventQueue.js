// Ordinary events never block training. Retries retain the original identity and
// client event IDs so a lost acknowledgement cannot duplicate saved messages.
export class ResearchEventQueue {
    constructor(send, { maxEvents = 500, maxRetries = 5, schedule = setTimeout } = {}) {
        this.send = send;
        this.maxEvents = maxEvents;
        this.maxRetries = maxRetries;
        this.schedule = schedule;
        this.items = [];
        this.timer = null;
        this.inFlight = false;
    }
    push(event, session) {
        if (!session?.sessionId) return;
        this.items.push({ event: { ...event, clientEventId: crypto.randomUUID() }, session: { participantCode: session.participantCode, sessionId: session.sessionId }, retries: 0 });
        if (this.items.length > this.maxEvents) this.items.splice(0, this.items.length - this.maxEvents);
        this.arm(200);
    }
    arm(delay) {
        if (this.timer !== null || !this.items.length) return;
        this.timer = this.schedule(() => { this.timer = null; void this.flush(); }, delay);
    }
    async flush() {
        if (this.inFlight || !this.items.length) return;
        this.inFlight = true;
        const first = this.items[0];
        const batch = [];
        while (batch.length < 100 && this.items[0]?.session.sessionId === first.session.sessionId && this.items[0]?.session.participantCode === first.session.participantCode) batch.push(this.items.shift());
        let retryDelay = 200;
        try {
            const result = await this.send(batch.map((item) => item.event), first.session);
            if (!result?.persisted) throw new Error('Events not persisted');
        } catch (error) {
            const status = error?.details?.status;
            // Invalid/stale sessions and bad requests should not be retried.
            if (!status || status >= 500 || status === 429) {
                const retry = batch.filter((item) => ++item.retries <= this.maxRetries);
                this.items.unshift(...retry);
                if (this.items.length > this.maxEvents) this.items.splice(this.maxEvents);
                retryDelay = Math.min(30000, 1000 * 2 ** first.retries);
            }
        } finally {
            this.inFlight = false;
            this.arm(retryDelay);
        }
    }
}
