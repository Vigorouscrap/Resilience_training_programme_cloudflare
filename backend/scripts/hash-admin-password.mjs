import { createPasswordHash } from '../dist/admin/auth.js';

if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Run this command in an interactive terminal.');
}

function readHidden(prompt) {
    return new Promise((resolve, reject) => {
        const input = process.stdin;
        let value = '';
        process.stdout.write(prompt);
        input.setRawMode(true);
        input.setEncoding('utf8');
        input.resume();
        const onData = (chunk) => {
            for (const character of chunk.toString('utf8')) {
                if (character === '\u0003') {
                    cleanup();
                    reject(new Error('Canceled.'));
                    return;
                } else if (character === '\r' || character === '\n') {
                    cleanup();
                    resolve(value);
                    return;
                } else if (character === '\u007f' || character === '\b') {
                    value = value.slice(0, -1);
                } else {
                    value += character;
                }
            }
        };
        const cleanup = () => {
            input.off('data', onData);
            input.setRawMode(false);
            input.pause();
            process.stdout.write('\n');
        };
        input.on('data', onData);
    });
}

try {
    const password = await readHidden('新工作人员后台密码（至少 16 位，不回显）：');
    const confirmation = await readHidden('再次输入密码：');
    if (password !== confirmation) throw new Error('Passwords do not match.');
    process.stdout.write(`STAFF_ADMIN_PASSWORD_HASH=${createPasswordHash(password)}\n`);
} catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : 'Password hash generation failed.'}\n`);
    process.exitCode = 1;
}
