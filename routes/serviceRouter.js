const portService = require('../manager/portservice'),
      httpProxy = require('http-proxy'),
      http = require("http");

const proxy = httpProxy.createProxyServer({});

server = http.createServer((req, res) => {
	switch(req.hostname) {
		case 'localhost':
			proxy.web(req, res, {
				target:'localhost',
				port: '8000'
			});
			break;
		default:
			res.writeHead(404).end();
			break;
	}
}).listen(80);


/*
app.use(logger('dev'));

app.use(proxy('localhost', {
	https: false,
	memoizeHost: true,
	preserveHostHdr: true,
	parseReqBody: false,
	timeout: 5000,
	proxyReqPathResolver: req => {
		return new Promise(function (resolve, reject) {
			console.log(req.hostname);
			switch(req.hostname) {
				case 'waifubot.moe':
					resolve(`localhost:8000${req.originalUrl}`);
					break;
				case 'bobco.moe':
					resolve(`localhost:8001${req.originalUrl}`);
					break;
				case 'localhost':
					console.log(`http://localhost:8000${req.originalUrl}`);
					resolve(`http://localhost:8000${req.originalUrl}`);
					break;
				default:
					reject('baka');
					break;
			}
		});
	}
}));
*/
module.exports = proxy;