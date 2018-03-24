const simpleGit = require('simple-git')(),
	    { exec } = require('child_process'),
	    { generateV4 } = require('./generateuuid');

const { Instance } = require('./instance'),
      log = require('./log');

class Service {
	constructor(serviceName, servicePath, remotePath, defaultSettings, portService) {
		this.servicePath = servicePath;
		this.remotePath = remotePath;
		this.serviceName = serviceName;
		this.defaultSettings = defaultSettings;
		this.commands = defaultSettings.commands;
		this.portService = portService;
		this.instances = new Map();

		this.log = log.log.bind(log, serviceName);

		let command = defaultSettings.commands.start;
		command = command.split(' ');
		this.commands['start'] = {'cmd': command.shift(), 'args': command};
	}

	updateDependencies() {
		return new Promise((resolve, reject) => {
			if (this.commands.install === undefined || this.commands.install === '') {
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

	isUp() {
		this.instances.forEach((instanceId, instance) => {

		});
	}

	removeInstance(instanceId) {
		return this.instances.get(instanceId).stop().then(() => {
			this.instances.delete(instanceId);
		}).catch((err) => {
			this.log(err);
		});
	}

	createInstance(userSettings=this.defaultSettings) {
		let settings = JSON.parse(JSON.stringify(userSettings));

		if (this.defaultSettings.args.port) {
			if (userSettings.port) {
				if (!this.portService.isAvailable(userSettings.port)) {
					throw new Error('Port unavailable');
				}
			} else {
				settings.args.port = [this.defaultSettings.args.port, this.portService.generatePort()];
			}
		}

		const instanceId = generateV4();
		const instance = new Instance(instanceId, this.serviceName, this.servicePath, settings);
		this.instances.set(instanceId, instance);

		instance.on('exit', () => {
			this.portService.clearPort(settings.args.port[1]);
		});

		return instance;
	}

	stop() {
		this.instances.forEach(instance => {
			instance.stop();
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
		this.log(`Pulling ${this.serviceName}...`);
		return new Promise((resolve, reject) => {
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