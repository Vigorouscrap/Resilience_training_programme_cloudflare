interface StatusChange {
    from_status: string;
    to_status: string;
    changed_at: string | Date;
}

export function shanghaiDate(value: string | Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date(value));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
}

function dayNumber(date: string): number {
    return Math.floor(Date.parse(`${date}T00:00:00+08:00`) / 86400000);
}

export function attendance(input: {
    status: string;
    enrolledAt: string | Date | null;
    lastCompletedAt: string | Date | null;
    graduatedAt: string | Date | null;
    statusHistory: StatusChange[];
}, now = new Date()) {
    const today = shanghaiDate(now);
    const enrolled = input.enrolledAt ? shanghaiDate(input.enrolledAt) : null;
    const lastCompleted = input.lastCompletedAt ? shanghaiDate(input.lastCompletedAt) : null;
    const graduated = input.graduatedAt ? shanghaiDate(input.graduatedAt) : null;
    const eligibleToday = input.status === 'active' && Boolean(enrolled && enrolled <= today)
        && (!graduated || graduated >= today);
    let missedExpectedDays = 0;
    if (input.status === 'active' && enrolled && lastCompleted && !graduated) {
        // Only complete Shanghai days since the last completion can be missed.
        // Late completions restart the streak; paused dates freeze it.
        const start = dayNumber(lastCompleted) + 1;
        const end = dayNumber(today);
        missedExpectedDays = Math.max(0, end - start);
        let pausedAt: number | null = null;
        for (const event of input.statusHistory) {
            const changed = dayNumber(shanghaiDate(event.changed_at));
            if (event.to_status === 'paused') pausedAt ??= changed;
            else if (event.from_status === 'paused' && pausedAt !== null) {
                missedExpectedDays -= Math.max(0, Math.min(end, changed) - Math.max(start, pausedAt));
                pausedAt = null;
            }
        }
        if (pausedAt !== null) missedExpectedDays -= Math.max(0, end - Math.max(start, pausedAt));
        missedExpectedDays = Math.max(0, missedExpectedDays);
    }
    return {
        eligibleToday,
        completedToday: eligibleToday && lastCompleted === today,
        missedExpectedDays,
        alert: missedExpectedDays >= 2
    };
}
