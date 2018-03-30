const simpleGit = require('simple-git')(),
	    { exec } = require('child_process'),
	    { generateV4 } = require('./generateuuid');

const { Instance } = require('./instance'),
      Logger = require('./logger'),
      portService = require('../manager/portservice');

class Service {
	constructor(serviceName, servicePath, remotePath, {commands = [], args = [], hostnames = [], environment = {}}) {

		this.data = {
			serviceName,
			servicePath,
			remotePath,
			hostnames,
			commands,
			environment,
			instances: new Map(),
			instanceArgs: args
		};

		this.log = Logger.createLog(`${serviceName.split('/')[0].blue}/${serviceName.split('/')[1].green}`);
	}

	hasHostname(hostname) {
		return this.data.hostnames.includes(hostname);
	}

	hasArg(argName) {
		return !!this.getArgs()[argName];
	}

	getHostnames() {
		return this.data.hostnames;
	}

	getCommands() {
		return this.data.commands;
	}

	getCommand(commandName) {
		return this.data.commands[commandName];
	}

	getEnvironment() {
		return this.data.environment
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

	getArg(argName) {
		return this.data.instanceArgs[argName];
	}

	getArgs() {
		return this.data.instanceArgs;
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
		return this.runCommand('install');
	}

	runCommand(commandName) {
		return new Promise((resolve, reject) => {
			this.log(`Running ${commandName}...`);

			try {
				const command = this.getCommand(commandName);
				if (command) {
					exec(command, {cwd: this.getServicePath()}, err => {
						if (err) this.log(err);
						this.log(`Finished ${commandName}`);
						resolve();
					});
				} else {
					this.log(`Unable to run ${commandName}`);
					reject('Command not found');
				}
			} catch(err) {
				reject(err);
			}
		});
	}

	async createInstance(userSettings={}) {
		let args = [];

		if (userSettings.args) {
			userSettings.args.forEach(([argName, argValue]) => {
				if (this.hasArg(argName)) {
					args.push([argName, [this.getArg(argName), argValue]]);
				}
			});
		}

		const defaultArgs = this.getArgs();

		if (defaultArgs.port && args.port === undefined) {
			args.port = ['port', [defaultArgs.port]];
		}
		if (defaultArgs.wsport && args.wsport === undefined) {
			args.wsport = ['wsport', [defaultArgs.wsport]];
		}

		const instanceId = generateV4();
		const instance = new Instance(instanceId, this.getServiceName(), this.getServicePath(), this.getCommand('start'), args, this.getEnvironment());
		this.data.instances.set(instanceId, instance);

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