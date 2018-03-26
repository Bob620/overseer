const EventEmitter = require('events');

const { spawn } = require('child_process');

const Logger = require('./logger');

const InstanceConst = {
	"status": {
		"STOPPED": 0,
		"RUNNING": 1
	}
};

class Instance extends EventEmitter {
	constructor(instanceId, serviceName, servicePath, settings) {
		super();

		this.data = {
			id: instanceId,
			serviceName,
			servicePath,
			settings,
			processStatus: InstanceConst.status.STOPPED,
			process: undefined
		};

		this.log = Logger.log.bind(Logger, instanceId.blue);
	}

	getArgs() {
		return this.data.settings.args;
	}

	getCommands() {
		return this.data.settings.commands;
	}

	getId() {
		return this.data.id;
	}

	getPort() {
		const port = this.data.settings.args.port;
		if (port) {
			return port[1];
		}
		return 0;
	}

	getRespawn() {
		return this.data.settings.respawn;
	}

	getSerialArgs() {
		let args = [];

		if (this.getCommands().start.cmd === 'npm') {
			args.push('--');
		}

		Object.values(this.getArgs()).forEach(argument => {
			argument.forEach(value => {
				args.push(value);
			});
		});

		return args;
	}

	getServiceName() {
		return this.data.serviceName;
	}

	getServicePath() {
		return this.data.servicePath;
	}

	getStatus() {
		return this.data.processStatus
	}


	setRespawn(willRespawn) {
		this.data.settings.respawn = willRespawn;
	}

	setStatus(newStatus) {
		if (newStatus !== this.getStatus()) {
			switch (newStatus) {
				case InstanceConst.status.RUNNING:
					this.data.processStatus = newStatus;
					this.emit('open');
					break;
				case InstanceConst.status.STOPPED:
					this.data.processStatus = newStatus;
					this.emit('exit');
					break;
			}
		}
	}


	async bind() {
/* IPC messaging
		this.process.on('disconnect', () => {
			console.log(`[${this.serviceName} - ${this.id}] Disconnected`);
			this.status = InstanceConst.STATUS.STOPPED;
		});

		this.process.on('message', message => {
			console.log(`[${this.serviceName} - ${this.id}] Received: ${message}`);
			this.emit('message', message);
		});
*/
		this.data.process.on('err', err => {
			this.emit('err', err);
			this.setStatus(InstanceConst.status.STOPPED);
		});

		this.data.process.on('close', async (code, signal) => {
			this.log(`Closed with code ${code} from signal ${signal}`);
			this.setStatus(InstanceConst.status.STOPPED);

			if (this.getRespawn) {
				this.log(`Restarting automatically`);
				await this.createProcess();
			} else {
				this.emit('exit');
			}
		});
	}

	async start() {
		if (this.getStatus() === InstanceConst.status.STOPPED) {
			await this.createProcess();
			this.log(`Started on port ${this.getPort()}`);
		}
	}

	async restart() {
		if (this.getStatus() === InstanceConst.status.RUNNING) {
			this.data.process.once('close', async () => {
				if (!this.getRespawn()) {
					this.log(`Restarting automatically`);
					await this.createProcess();
				}
			});

			await this.stop();
		} else {
			if (!this.getRespawn()) {
				this.log(`Restarting automatically`);
				await this.createProcess();
			}
		}
	}

	async createProcess() {
		const startCommand = this.getCommands().start;

		// Special spawn conditions for windows vs unix
		this.data.process = spawn(/^win/.test(process.platform) ? `${startCommand.cmd}.cmd` : startCommand.cmd, startCommand.args.concat(this.getSerialArgs()), {cwd: this.getServicePath(), stdio: 'pipe'});
		this.setStatus(InstanceConst.status.RUNNING);
		await this.bind();
	}

	async stop() {
		this.setRespawn = false;
		if (this.getStatus() === InstanceConst.status.RUNNING) {
			if (process.platform === "win32") {
				// This is the only working way on windows ( ￣＾￣)
				await spawn('taskkill', ['/pid', this.data.process.pid, '/f', '/t']);
			} else {
				await this.data.process.kill('SIGINT');
			}
		}
	}
}

module.exports = {Instance, InstanceConst};