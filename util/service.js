const { generateV4 } = require('./generateuuid');

class Service {
	constructor(serviceName, instance) {
		this.ServiceName = serviceName;
		this.instances = new Map();
		this.instance = instance;
	}

	isUp() {
		this.instances.forEach((instanceId, instance) => {

		});
	}

	removeInstance(instanceId) {
		this.instances.get(instanceId).stop().then(() => {
			this.instances.delete(instanceId);
		}).catch((err) => {
			console.log(err);
		});
	}

	createInstance(settings) {
		const instanceId = generateV4();
		const instance = this.instance.create(settings);
		this.instances.set(instanceId, instance);
		instance.start();
	}

	restartInstance(instanceId) {
		this.instances.get(instanceId).restart();
	}

	stopInstance(instanceId) {
		this.instances.get(instanceId).stop();
	}

	getInstance(instanceId) {
		return this.instances.get(instanceId);
	}

	listInstances() {
		let instancesList = [];

		this.instances.forEach((instanceId, instance) => {
			instancesList.push({
				instanceId
			});
		});

		return instancesList;
	}
}

module.exports = Service;