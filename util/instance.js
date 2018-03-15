const execSh = require('exec-sh'),
      spawn = require('child_process').spawn;

class Instance {
	constructor(instanceId, serviceName, servicePath, settings) {
		this.id = instanceId;
		this.serviceName = serviceName;
		this.status = 'stopped';
		this.respawn = settings.respawn;
		this.commands = settings.commands;
		this.servicePath = servicePath;
		this.args = settings.args;
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
			this.process = execSh(`cd ${this.servicePath} && ${this.commands.start}`);
			this.bind();
			this.status = 'running';
		}
	}

	restart() {
		if (this.status === 'running') {
			this.process.once('close', (code, signal) => {
				if (!this.respawn) {
					console.log(`${this.serviceName} restarting automatically`);
					this.process = execSh(`cd ${this.servicePath} && ${this.commands.start}`);
					this.status = 'running';
					this.bind();
				}
			});

			this.stop();
		}
	}

	stop() {
		if (this.status === 'running') {
			if (process.platform === "win32") {
				// This is the only working way on windows ( ￣＾￣)
				spawn('taskkill', ['/pid', this.process.pid, '/f', '/t']);
			} else {
				process.kill(-this.process.pid, 'SIGTERM');
			}
		}
	}
}

module.exports = Instance;