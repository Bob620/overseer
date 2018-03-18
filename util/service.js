const simpleGit = require('simple-git')(),
	    { exec } = require('child_process'),
	    { generateV4 } = require('./generateuuid');

const Instance = require('../util/instance');

class Service {
	constructor(serviceName, servicePath, remotePath, defaultSettings) {
		this.servicePath = servicePath;
		this.remotePath = remotePath;
		this.serviceName = serviceName;
		this.defaultSettings = defaultSettings;
		this.commands = defaultSettings.commands;
		this.instances = new Map();

		let command = defaultSettings.commands.start;
		command = command.split(' ');
		this.commands['start'] = {"cmd": command.shift(), "args": command};
	}

	updateDependencies() {
		return new Promise((resolve, reject) => {
			if (this.commands.install === undefined || this.commands.install === '') {
				resolve();
				return;
			}
			console.log('Updating dependencies...\n');

			exec(this.commands.install, {cwd: this.servicePath}, err => {
				if(err) reject(err);
				console.log('Dependencies updated');
				resolve();
			});
		});
	}

	runCommand(command) {
		return new Promise((resolve, reject) => {
			console.log(`Running ${command}...\n`);

			try {
				exec(this.commands[command], {cwd: this.servicePath}, err => {
					if(err) console.log(err);
					console.log(`Done running ${command}`);
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
		this.instances.get(instanceId).stop().then(() => {
			this.instances.delete(instanceId);
		}).catch((err) => {
			console.log(err);
		});
	}

	createInstance(settings=this.defaultSettings) {
		const instanceId = generateV4();
		const instance = new Instance(instanceId, this.serviceName, this.servicePath, settings);
		this.instances.set(instanceId, instance);
		instance.start();
	}

	getInstance(instanceId) {
		return this.instances.get(instanceId);
	}

	listInstances() {
		let instancesList = [];

		this.instances.forEach((instanceId, instance) => {
			instancesList.push(instance);
		});

		return instancesList;
	}

	gitPull() {
		console.log(`\nPulling ${this.serviceName}...`);
		return new Promise((resolve, reject) => {
			simpleGit.cwd(this.servicePath).pull((err) => {
				if (err) {
					reject(err);
					return;
				}

				console.log(`Pulled ${this.serviceName}`);
				this.updateDependencies().then(() => {
					resolve();
				})
			});
		});
	}
}

module.exports = Service;