const execSh = require('exec-sh');
const spawn = require('child_process').spawn;

class Instance {
	constructor(serviceName, defaultSettings, path) {
		this.ServiceStartCommand = defaultSettings.start;
		this.defaultSettings = defaultSettings;
		this.path = path;
		this.serviceName = serviceName;
	}

	create(instanceId, settings=this.defaultSettings, respawn=true) {
		return new InstanceProcess(instanceId, this.serviceName, this.ServiceStartCommand, this.path, settings.args, respawn);
	}
}

class InstanceProcess {
	constructor(instanceId, serviceName, serviceStartCommand, path, args, respawn) {
		this.id = instanceId;
		this.serviceName = serviceName;
		this.status = 'stopped';
		this.respawn = respawn;
		this.ServiceStartCommand = serviceStartCommand;
		this.path = path;
		this.args = args;
		this.process = undefined;
	}

	bind() {
		this.process.on('disconnect', () => {
			console.log(`${this.serviceName} disconnected`);
			this.status = 'stopped';
		});

		this.process.on('close', (code, signal) => {
			console.log(`${this.serviceName} closed with code ${code} from signal ${signal}`);
			this.status = 'stopped';

			if (this.respawn) {
				console.log(`${this.serviceName} restarting automatically`);
				this.process = execSh(`cd ${this.path} && ${this.ServiceStartCommand}`);
				this.status = 'running';
				this.bind();
			}
		});

		this.process.on('err', err => {
			console.log(err);
			this.status = 'stopped';
		});

		this.process.on('exit', (code, signal) => {
			console.log(`${this.serviceName} exited with code ${code} from signal ${signal}`);
			this.status = 'stopped';
		});

		this.process.on('message', message => {
			console.log(message);
		});
	}

	start() {
		if (this.status === 'stopped') {
			this.process = execSh(`cd ${this.path} && ${this.ServiceStartCommand}`);
			this.bind();
			this.status = 'running';
		}
	}

	restart() {
		if (this.status === 'running') {
			this.process.once('close', (code, signal) => {
				if (!this.respawn) {
					console.log(`${this.serviceName} restarting automatically`);
					this.process = execSh(`cd ${this.path} && ${this.ServiceStartCommand}`);
					this.status = 'running';
					this.bind();
				}
			});

			this.stop();
		}
	}

	stop() {
		if (this.status === 'running') {
			// This is the only working way on windows
			spawn('taskkill', ['/pid', this.process.pid, '/f', '/t']);
		}
	}
}

module.exports = Instance;