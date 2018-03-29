const simpleGit = require('simple-git')(),
	    { exec } = require('child_process'),
	    { generateV4 } = require('./generateuuid');

const { Instance } = require('./instance'),
      Logger = require('./logger');
      portService = require('../manager/portservice');

class Service {
	constructor(serviceName, servicePath, remotePath, {commands = [], args = [], hostnames = [], wsHostnames = [], defaultSettings = {}}) {

		this.data = {
			serviceName,
			servicePath,
			remotePath,
			defaultInstanceSettings: defaultSettings,
			hostnames,
			wsHostnames,
			instances: new Map(),
			commands,
			instanceArgs: args
		};

		this.defaultSettings = defaultSettings;
		this.commands = defaultSettings.commands;

		this.log = Logger.log.bind(Logger, `${serviceName.split('/')[0].blue}/${serviceName.split('/')[1].green}`);

		let command = defaultSettings.commands.start;
		command = command.split(' ');
		this.commands['start'] = {'cmd': command.shift(), 'args': command};
	}

	hasHostname(hostname) {
		return this.data.hostnames.includes(hostname);
	}

	hasWSHostname(hostname) {
		return this.data.wsHostnames.includes(hostname);
	}

	getHostnames() {
		return this.data.hostnames;
	}

	getWSHostnames() {
		return this.data.wsHostnames;
	}

	getDefaultSettings() {
		return this.data.defaultInstanceSettings;
	}

	getCommands() {
		return this.data.commands;
	}

	getInstance(instanceId) {
		return this.data.instances.get(instanceId);
	}

	getInstances() {
		return this.data.instances;
	}

	getServicePath() {
		return this.data.servicePath;
	}

	getServiceName() {
		return this.data.serviceName;
	}

	deleteInstance(instanceId) {
		const instance = this.getInstance(instanceId);
		return instance.kill().then(() => {
			this.data.instances.delete(instanceId);
		}).catch((err) => {
			this.log(err);
		});
	}

	deleteInstanceSync(instanceId) {
		try {
			const instance = this.getInstance(instanceId);
			instance.killSync();
			this.data.instances.delete(instanceId);
		} catch(err) {
			this.log(err);
		}
	}

	updateDependencies() {
		return new Promise((resolve, reject) => {
			if (this.commands.install === undefined || !this.commands.install) {
				resolve();
				return;
			}
			this.log('Updating dependencies...');

			exec(this.commands.install, {cwd: this.getServicePath()}, err => {
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
				exec(this.commands[command], {cwd: this.getServicePath()}, err => {
					if(err) this.log(err);
					this.log(`Done running ${command}`);
					resolve();
				});
			} catch(err) {
				reject(err);
			}
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
				settings.args.port = this.defaultSettings.args.port;
			}
		}

		const instanceId = generateV4();
		const instance = new Instance(instanceId, this.getServiceName(), this.getServicePath(), settings);
		this.data.instances.set(instance.getId(), instance);

		return instance;
	}


	cleanupSync() {
		this.log('Closing all instances...');
		this.getInstances().forEach((instance, instanceId) => {
			this.deleteInstanceSync(instanceId);
		});

		this.log('All instances closed');
		return true;
	}

	cleanup() {
		this.log('Closing all instances...');
		let processesToStop = [];
		this.getInstances().forEach((instance, instanceId) => {
			processesToStop.push(this.deleteInstance(instanceId));
		});

		return Promise.all(processesToStop).then(() => {
			this.log('All instances closed');
		});
	}

	listInstances() {
		let instancesList = [];

		this.getInstances().forEach(instance => {
			instancesList.push(instance);
		});

		return instancesList;
	}

	gitPull() {
		return new Promise((resolve, reject) => {
			this.log(`Pulling ${this.getServiceName()}...`);
			simpleGit.cwd(this.getServicePath()).pull((err) => {
				if (err) {
					reject(err);
					return;
				}

				this.log(`Pulled ${this.getServiceName()}`);
				this.updateDependencies().then(() => {
					resolve();
				})
			});
		});
	}
}

module.exports = Service;