const portService = require('./portservice');
      log = require('../util/logger').createLog('Proxy'.blue);

let services = undefined;

class Proxy {
	constructor() {
		this.data = {
			hostnames: new Map(),
			services: new Map(),
			proxy: undefined
		}
	}

	init({port, hostnames}) {
		services = require('./services');
		this.data.proxy = require('redbird')({
			port,
			letsencrypt: {
				path: 'certs',
				port: portService.getNextPort()
			},
			ssl: {
				port: 443
			},
			bunyan: false
		});
		hostnames.forEach(({domain, service: serviceName, ssl: secure}) => {
			this.addHostname(domain, serviceName, secure);
		});
	}

	getHostname(hostname) {
		return this.data.hostnames.get(hostname);
	}

	getService(serviceName) {
		return this.data.services.get(serviceName);
	}

	addHostname(hostname, serviceName, secure) {
		if (this.data.proxy) {
			log(`listening for ${secure ? 'https' : 'http'}://${hostname}`);
			services.getService(serviceName).then(service => {
				let ports = [];
				service.getInstances().forEach(instance => {
					ports.push(instance.getPort());
				});

				let proxyService = this.getService(serviceName);
				if (proxyService === undefined) {
					proxyService = {
						hostnames: [],
						ports: []
					};
					this.data.services.set(serviceName, proxyService);
				}
				proxyService.hostnames.push(hostname);

				this.data.hostnames.set(hostname, {serviceName, secure});
				ports.forEach(port => {
					this.addHostnamePort(hostname, port);
				});
			}).catch(err => {});
		}
	}

	removeHostname(hostname) {
		this.data.hostnames.delete(hostname);
	}

	addServicePort(serviceName, port) {
		const service = this.getService(serviceName);
		if (service) {
			service.ports.push(port);
			service.hostnames.forEach(hostname => {
				this.addHostnamePort(hostname, port);
			});
			log(`[${serviceName.split('/')[0].blue}/${serviceName.split('/')[1].green}] - attached another instance on port ${port}`);
		}
	}

	addHostnamePort(hostname, port) {
		const host = this.getHostname(hostname);
		if (host)
			this.register(hostname, `localhost:${port}`, host.secure);
	}

	removeServicePort(serviceName, port) {
		const service = this.getService(serviceName);
		if (service) {
			this.unregister(hostname, `localhost:${port}`);
			log(`[${serviceName.split('/')[0].blue}/${serviceName.split('/')[1].green}] - removed an instance on port ${port}`);
		}
	}

	register(domain, internalUri, secure) {
		if (secure) {
			this.data.proxy.register(domain, internalUri, {
				ssl: {
					letsencrypt: {
						email: 'bruder.kraft225@gmail.com',
						production: true
					}
				}
			});
		} else
			this.data.proxy.register(domain, internalUri);
	}

	unregister(domain, internalUri) {
		this.data.proxy.unregister(domain, internalUri);
	}
}

module.exports = new Proxy();