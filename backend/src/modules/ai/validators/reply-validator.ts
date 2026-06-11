export interface ReplyValidationResult {
    ok: boolean;
    sanitizedText: string;
    reason?: string;
}

function sanitizeWhitespace(text: string): string {
    return text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
}

export function validateReplyText(text: string, maxOutputChars: number): ReplyValidationResult {
    const sanitizedText = sanitizeWhitespace(String(text || ''));

    if (!sanitizedText) {
        return {
            ok: false,
            sanitizedText,
            reason: 'empty_text'
        };
    }

    if (sanitizedText.length > maxOutputChars) {
        return {
            ok: false,
            sanitizedText,
            reason: 'too_long'
        };
    }

    return {
        ok: true,
        sanitizedText
    };
}
