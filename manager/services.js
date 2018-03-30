const Service = require('../util/service');
      portService = require('./portservice');

class Services {
	constructor() {
		this.data = {
			services: new Map()
		}
	}

	init(defaultSettings) {
		this.defaultSettings = defaultSettings;
	}

	getServices() {
		return this.data.services;
	}

	getService(serviceName) {
		const service = this.data.services.get(serviceName);
		if (service === undefined) {
			return Promise.reject();
		}
		return Promise.resolve(service);
	}

	searchServices(searchFunction) {
		let matchingServices = [];

		this.getServices().forEach(service => {
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
		this.data.services.set(serviceName, service);
		return service;
	}

	async removeService(serviceName) {
		this.data.services.delete(serviceName)
	}
}

module.exports = new Services();