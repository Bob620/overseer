const path = require('path');
const os = require('os');
const Greenlock = require('greenlock');

const http01 = require('le-challenge-fs').create({ webrootPath: '/tmp/acme-challenges' });

const production = false;
const testEmail = 'bruder.lkraft225@gmail.com';

const greenlock = Greenlock.create({
	version: 'draft-12',
	server: production ? 'https://acme-v02.api.letsencrypt.org/directory' : 'https://acme-staging-v02.api.letsencrypt.org/directory',
	store: require('le-store-certbot').create({
		configDir: path.join(os.homedir(), 'acme/etc'),
		webrootPath: '/tmp/acme-challenges'
	}),
	approveDomains: (opts, certs, cb) => {
		opts.challenges = { 'http-01': http01 };
		opts.challengeType = 'http-01';

		if (certs)
			opts.domains = certs.altnames;
		else {
			opts.email = testEmail;
			opts.agreeTos = true;
		}

		cb(null, { options: opts, certs });
	},
});

require('http').createServer(greenlock.middleware(require('redirect-https')())).listen(80, function () {
	console.log("Listening for ACME http-01 challenges on", this.address());
});


const server = require('http2').createSecureServer(greenlock.tlsOptions);
server.on('error', (err) => {
	console.error(err);
});

server.on('stream', (stream, headers) => {
	console.log(headers);
	stream.respond({
		'content-type': 'text/html',
		':status': 200
	});
	stream.end('Hello, HTTP2 World!');
});
server.on('listening', () => {
	console.log("Listening for http2 requests on", server.address());
});

server.listen(443);