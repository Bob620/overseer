const services = require('../manager/services'),
      httpProxy = require('http-proxy'),
      http = require("http");

const proxy = httpProxy.createProxyServer({});

server = http.createServer((req, res) => {
	try {
		services.searchServices(service => {
			return service.hasHostname(req.headers.host);
		}).then(services => {
			proxy.web(req, res, {
				target: `http://localhost:${services[0].listInstances()[0].getPort()}`
			});
		}).catch((err) => {
			if (err)
				console.log(err);
			res.end('<h1 style="text-align: center;">404</h1>');
		});
	} catch (err) {
		res.end('<h1 style="text-align: center;">500</h1>');
		console.log(err);
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