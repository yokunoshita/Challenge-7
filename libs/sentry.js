const Sentry = require('@sentry/node');
const {DSN_SENTRY, ENV} = process.env;
Sentry.init({
    environment: ENV,
    dsn: DSN_SENTRY,
    integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app: require('express') }),
    ],
    tracesSampleRate: 1.0,
})

module.exports = Sentry;