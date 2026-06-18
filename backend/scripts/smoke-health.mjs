let createApp;

try {
    ({ createApp } = await import('../dist/app.js'));
} catch (error) {
    console.error('Unable to load dist/app.js. Run `npm run build` before this smoke test.');
    if (error instanceof Error) {
        console.error(error.message);
    }
    process.exit(1);
}

const { app } = await createApp();

try {
    const response = await app.inject({
        method: 'GET',
        url: '/health'
    });

    if (response.statusCode !== 200) {
        console.error(`Expected /health to return 200, got ${response.statusCode}.`);
        console.error(response.body);
        process.exit(1);
    }

    const body = JSON.parse(response.body);
    const requiredFields = ['ok', 'app', 'version', 'provider', 'nodeEnv', 'uptimeSeconds', 'timestamp'];
    const missingFields = requiredFields.filter((field) => !(field in body));

    if (body.ok !== true || missingFields.length > 0) {
        console.error('Unexpected /health response shape.');
        console.error(JSON.stringify({ body, missingFields }, null, 2));
        process.exit(1);
    }

    console.log('Health smoke test passed.');
    console.log(JSON.stringify(body, null, 2));
} finally {
    await app.close();
}
