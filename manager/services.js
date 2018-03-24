const Service = require('../util/service');
      portService = require('./portservice');

class Services {
	constructor() {
		this.services = new Map();
	}

	init(defaultSettings) {
		this.defaultSettings = defaultSettings;
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

module.exports = new Services();