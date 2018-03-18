const execSh = require('exec-sh'),
	    { spawn, fork } = require('child_process');

class Instance {
	constructor(instanceId, serviceName, servicePath, settings) {
		this.id = instanceId;
		this.serviceName = serviceName;
		this.status = 'stopped';
		this.entryFile = settings.entryFile;
		this.respawn = settings.respawn;
		this.commands = settings.commands;
		this.servicePath = servicePath;
		this.args = settings.args;
		this.process = undefined;
	}

	bind() {
		this.process.on('disconnect', () => {
			console.log(`[${this.serviceName} - ${this.id}] Disconnected`);
			this.status = 'stopped';
		});

		this.process.on('close', (code, signal) => {
			console.log(`[${this.serviceName} - ${this.id}] Closed with code ${code} from signal ${signal}`);
			this.status = 'stopped';

			if (this.respawn) {
				console.log(`[${this.serviceName} - ${this.id}] Restarting automatically`);
				this.createProcess();
			}
		});

		this.process.on('err', err => {
			console.log(err);
			this.status = 'stopped';
		});

		this.process.on('exit', (code, signal) => {
			console.log(`[${this.serviceName} - ${this.id}] Exited with code ${code} from signal ${signal}`);
			this.status = 'stopped';
		});

		this.process.on('message', message => {
			console.log(`[${this.serviceName} - ${this.id}] Received: ${message}`);
		});
	}

	start() {
		if (this.status === 'stopped') {
			this.createProcess();
		}
	}

	restart() {
		if (this.status === 'running') {
			this.process.once('close', (code, signal) => {
				if (!this.respawn) {
					console.log(`[${this.serviceName} - ${this.id}] Restarting automatically`);
					this.createProcess();
				}
			});

			this.stop();
		} else {
			if (!this.respawn) {
				console.log(`[${this.serviceName} - ${this.id}] Restarting automatically`);
				this.createProcess();
			}
		}
	}

	createProcess() {
//		this.process = execSh(`cd ${this.servicePath} && ${this.commands.start}`);
//		this.process = fork(`${this.servicePath}/${this.entryFile}`);
		this.process = spawn(this.commands.start, this.args, {cwd: this.servicePath, stdio: ['ignore', 'ignore', 'ignore', 'ipc']});
		this.status = 'running';
		this.bind();
	}

	stop() {
		if (this.status === 'running') {
			if (process.platform === "win32") {
				// This is the only working way on windows ( ￣＾￣)
				spawn('taskkill', ['/pid', this.process.pid, '/f', '/t']);
			} else {
				this.process.kill('SIGINT');
			}
		}
	}
}

module.exports = Instance;