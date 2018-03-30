const EventEmitter = require('events');

const { spawn, spawnSync } = require('child_process');

const Logger = require('./logger'),
      portService = require('../manager/portservice');

const InstanceConst = {
	"status": {
		"STOPPED": 0,
		"RUNNING": 1
	}
};

class Instance extends EventEmitter {
	constructor(id, serviceName, servicePath, settings = {}, startCmd = '', args = []) {
		super();

		this.data = {
			id,
			serviceName,
			servicePath,
			settings,
			startCmd,
			args,
			port: undefined,
			wsPort: undefined,
			processStatus: InstanceConst.status.STOPPED,
			process: undefined
		};

		this.log = Logger.createLog(id.blue);

		if (args.port) {
			this.setPort(portService.getNextPort());
		}
		if (args.wsport) {
			this.setWSPort(portService.getNextPort());
		}
	}

	getArgs() {
		return this.data.args;
	}

	getId() {
		return this.data.id;
	}

	getPort() {
		const port = this.data.port;
		if (port) {
			return port;
		}
		return 0;
	}

	getWSPort() {
		const port = this.data.wsPort;
		if (port) {
			return port;
		}
		return 0;
	}

	getRespawn() {
		return this.data.settings.respawn;
	}

	getSerialArgs() {
		let args = [];

		if (this.data.startCmd === 'npm') {
			args.push('--');
		}

		Object.entries(this.getArgs()).forEach(([argName, argValue]) => {


			switch (argName) {
				case 'port':
					args.push(argument, this.getPort());
					break;
				case 'wsPort':
					args.push(argument, this.getWSPort());
					break;
				default:
					argument.forEach(value => {
						args.push(value);
					});
					break;
			}
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

	getStartCmd() {
		return this.data.startCmd;
	}


	setStartCmd(cmd) {
		this.data.startCmd = cmd;
	}

	setPort(port) {
		this.data.port = port;
	}

	setWSPort(port) {
		this.data.wsPort = port;
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
		const startCmd = this.getStartCmd();

		// Special spawn conditions for windows vs unix
		this.data.process = spawn(/^win/.test(process.platform) ? `${startCmd}.cmd` : startCmd, this.getSerialArgs(), {cwd: this.getServicePath(), stdio: 'pipe'});
		this.setStatus(InstanceConst.status.RUNNING);
		await this.bind();
	}

	stopSync() {
		this.setRespawn = false;
		if (this.getStatus() === InstanceConst.status.RUNNING) {
			if (/^win/.test(process.platform)) {
				// This is the only working way on windows ( ￣＾￣)
				spawnSync('taskkill', ['/pid', this.data.process.pid, '/f', '/t']);
			} else {
				this.data.process.kill('SIGINT');
			}
		}
	}

	async stop() {
		this.setRespawn = false;
		if (this.getStatus() === InstanceConst.status.RUNNING) {
			if (/^win/.test(process.platform)) {
				// This is the only working way on windows ( ￣＾￣)
				await spawn('taskkill', ['/pid', this.data.process.pid, '/f', '/t']);
			} else {
				await this.data.process.kill('SIGINT');
			}
		}
	}

	killSync() {
		this.stopSync();
		portService.clearPort(this.getPort());
		portService.clearPort(this.getWSPort());
	}

	async kill() {
		await this.stop();
		portService.clearPort(this.getPort());
		portService.clearPort(this.getWSPort());
	}
}

module.exports = {Instance, InstanceConst};