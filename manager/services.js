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

	searchServices(searchFunction) {
		let matchingServices = [];

		this.services.forEach(service => {
			if (searchFunction(service)) {
				matchingServices.push(service);
			}
		});

		if (matchingServices.length > 0)
			return Promise.resolve(matchingServices);
		return Promise.reject();
	}

	async addService(serviceName, localLocation, remoteLocation) {
		const service = new Service(serviceName, localLocation, remoteLocation, this.defaultSettings[serviceName]);
		this.services.set(serviceName, service);
		return service;
	}

	async removeService(serviceName) {
		this.services.delete(serviceName)
	}
}

module.exports = new Services();