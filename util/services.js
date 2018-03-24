const Service = require('./service');

class Services {
	constructor(defaultSettings, portService) {
		this.services = new Map();
		this.defaultSettings = defaultSettings;
		this.portService = portService;
	}

	getService(serviceName) {
		const service = this.services.get(serviceName);
		if (service === undefined) {
			return Promise.reject();
		}
		return Promise.resolve(service);
	}

	async addService(serviceName, localLocation, remoteLocation) {
		const service = new Service(serviceName, localLocation, remoteLocation, this.defaultSettings[serviceName], this.portService);
		this.services.set(serviceName, service);
		return service;
	}

	async removeService(serviceName) {
		this.services.delete(serviceName)
	}
}

module.exports = Services;