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
			res.writeHead(404);
			res.end('<h1 style="text-align: center;">404</h1>');
		});
	} catch (err) {
		res.writeHead(500);
		res.end('<h1 style="text-align: center;">500</h1>');
		console.log(err);
	}
}).on('upgrade', (req, socket, head) => {
	try {
		services.searchServices(service => {
			return service.hasWSHostname(req.headers.host);
		}).then(services => {
			proxy.ws(req, socket, head, {
				target: `http://localhost:${services[0].listInstances()[0].getWSPort()}`
			});
		}).catch((err) => {
			if (err)
				console.log(err);
			res.writeHead(404);
			res.end('<h1 style="text-align: center;">404</h1>');
		});
	} catch (err) {
		res.writeHead(500);
		res.end('<h1 style="text-align: center;">500</h1>');
		console.log(err);
	}
}).listen(80);

module.exports = proxy;