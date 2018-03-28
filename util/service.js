const simpleGit = require('simple-git')(),
	    { exec } = require('child_process'),
	    { generateV4 } = require('./generateuuid');

const { Instance } = require('./instance'),
      Logger = require('./logger');
      portService = require('../manager/portservice');

class Service {
	constructor(serviceName, servicePath, remotePath, defaultSettings) {
		this.servicePath = servicePath;
		this.remotePath = remotePath;
		this.serviceName = serviceName;
		this.defaultSettings = defaultSettings;
		this.commands = defaultSettings.commands;
		this.hostnames = defaultSettings.hostnames ? defaultSettings.hostnames : [];
		this.instances = new Map();

		this.log = Logger.log.bind(Logger, `${serviceName.split('/')[0].blue}/${serviceName.split('/')[1].green}`);

		let command = defaultSettings.commands.start;
		command = command.split(' ');
		this.commands['start'] = {'cmd': command.shift(), 'args': command};
	}

	hasHostname(hostname) {
		return this.hostnames.includes(hostname);
	}

	getHostnames() {
		return this.hostnames;
	}

	updateDependencies() {
		return new Promise((resolve, reject) => {
			if (this.commands.install === undefined || !this.commands.install) {
				resolve();
				return;
			}
			this.log('Updating dependencies...');

			exec(this.commands.install, {cwd: this.servicePath}, err => {
				if(err) reject(err);
				this.log('Dependencies updated');
				resolve();
			});
		});
	}

	runCommand(command) {
		return new Promise((resolve, reject) => {
			this.log(`Running ${command}...`);

			try {
				exec(this.commands[command], {cwd: this.servicePath}, err => {
					if(err) this.log(err);
					this.log(`Done running ${command}`);
					resolve();
				});
			} catch(err) {
				reject(err);
			}
		});
	}

	removeInstance(instanceId) {
		const instance = this.instances.get(instanceId);
		return instance.stop().then(() => {
			portService.clearPort(instance.getPort());
			this.instances.delete(instanceId);
		}).catch((err) => {
			this.log(err);
		});
	}

	async createInstance(userSettings=this.defaultSettings) {
		let settings = JSON.parse(JSON.stringify(userSettings));

		if (this.defaultSettings.args.port) {
			if (userSettings.port) {
				if (!portService.isAvailable(userSettings.port)) {
					throw new Error('Port unavailable');
				}
			} else {
				settings.args.port = [this.defaultSettings.args.port, portService.getNextPort()];
			}
		}

		const instanceId = generateV4();
		const instance = new Instance(instanceId, this.serviceName, this.servicePath, settings);
		this.instances.set(instanceId, instance);

		return instance;
	}

	syncStop() {
		this.log('Closing all instances...');
		this.instances.forEach(instance => {
			instance.syncStop();
		});

		this.log('All instances closed');
		return true;
	}

	stop() {
		this.log('Closing all instances...');
		let processesToStop = [];
		this.instances.forEach(instance => {
			processesToStop.push(instance.stop());
		});

		return Promise.all(processesToStop).then(() => {
			this.log('All instances closed');
		});
	}

	getInstance(instanceId) {
		return this.instances.get(instanceId);
	}

	listInstances() {
		let instancesList = [];

		this.instances.forEach(instance => {
			instancesList.push(instance);
		});

		return instancesList;
	}

	gitPull() {
		return new Promise((resolve, reject) => {
			this.log(`Pulling ${this.serviceName}...`);
			simpleGit.cwd(this.servicePath).pull((err) => {
				if (err) {
					reject(err);
					return;
				}

				this.log(`Pulled ${this.serviceName}`);
				this.updateDependencies().then(() => {
					resolve();
				})
			});
		});
	}
}

module.exports = Service;