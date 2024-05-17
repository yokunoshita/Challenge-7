require('dotenv').config();
const express = require('express');
const Sentry = require('./libs/sentry');
const logger = require('morgan');
const app = express();

const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended :true}));

app.set('view engine', 'ejs');

app.use((req, res, next) => {
    req.io = io;
    next();
});

io.on('connection', (socket) => {
    console.log('a user is connected');

    socket.on('disconnect', () => {
        console.log('user disconnected');
    })
})

app.get('/', (req, res) => {
    setTimeout(() => {
        res.json({
            status: true,
            message: "Connected",
            data: null
        });
    }, 5000);
});

const router = require('./routes');
app.use('/challenge', router);
app.use(Sentry.Handlers.errorHandler());

// 500 error handler
app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).json({
        status: false,
        message: err.message,
        data: null
    });
});

// 404 error handler
app.use((req, res, next) => {
    res.status(404).json({
        status: false,
        message: `are you lost? ${req.method} ${req.url} is not registered!`,
        data: null
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});

module.exports = app;