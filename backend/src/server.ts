import { createApp } from './app.js';

async function startServer() {
    const { app, env } = await createApp();

    try {
        await app.listen({
            host: env.host,
            port: env.port
        });
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
}

startServer();
