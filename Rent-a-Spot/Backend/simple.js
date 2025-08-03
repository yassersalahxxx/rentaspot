const http = require('http');

const port = process.env.PORT || 1337;

console.log('=== SIMPLE SERVER STARTING ===');
console.log(`Port: ${port}`);

const server = http.createServer((req, res) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    
    res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    
    const response = {
        message: 'Simple server is working!',
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
        port: port
    };
    
    res.end(JSON.stringify(response, null, 2));
});

server.listen(port, () => {
    console.log(`=== SIMPLE SERVER RUNNING ON PORT ${port} ===`);
    console.log('Server started successfully!');
});

server.on('error', (error) => {
    console.error('Server error:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
});
