const EventEmitter = require('events');

const { spawn, spawnSync } = require('child_process');

const Logger = require('./logger'),
      portService = require('../manager/portservice'),
      proxy = require('../manager/proxy');

const InstanceConst = {
	"status": {
		"STOPPED": 0,
		"RUNNING": 1
	}
};

class Instance extends EventEmitter {
	constructor(id, serviceName, servicePath, startCmd = '', args = [], env = {}) {
		super();

		this.data = {
			id,
			serviceName,
			servicePath,
			startCmd,
			args,
			env,
			respawn: false,
			processStatus: InstanceConst.status.STOPPED,
			process: undefined
		};

		this.log = Logger.createLog(id.blue);

		if (args.port && args.port[1].length === 1) {
			const port = portService.getNextPort();
			this.data.args.port[1][1] = port;
			proxy.addServicePort(this.getServiceName(), port);
		}
		if (args.wsport && args.wsport[1].length === 1) {
			this.data.args.wsport[1][1] = portService.getNextPort();
		}

		if (Object.values(env).length === 0) {
			this.setEnvironment(process.env);
		}
	}

	getArgs() {
		return this.data.args;
	}

	getId() {
		return this.data.id;
	}

	getEnvironment() {
		return this.data.env;
	}

	getPort() {
		if (this.data.args.port) {
			const port = this.data.args.port[1][1];
			if (port) {
				return port;
			}
		}
		return 0;
	}

	getWSPort() {
		if (this.data.args.wsport) {
			const port = this.data.args.wsport[1][1];
			if (port) {
				return port;
			}
		}
		return 0;
	}

	getRespawn() {
		return this.data.respawn;
	}

	getSerialArgs() {
		let args = [];

		if (this.getStartCmd().startsWith('npm')) {
			args.push('--');
		}

		Object.values(this.getArgs()).forEach(([argName, argValue]) => {
			args = args.concat(argValue);
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

	getSerialStartCmd() {
		return this.data.startCmd.split(' ');
	}


	setStartCmd(cmd) {
		this.data.startCmd = cmd;
	}

	setRespawn(willRespawn) {
		this.data.respawn = willRespawn;
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

	setEnvironment(env) {
		this.data.env = env;
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

			if (this.getRespawn()) {
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
		const [startCmd, ...startArgs] = this.getSerialStartCmd();

		// Special spawn conditions for windows vs unix
		this.data.process = spawn(/^win/.test(process.platform) ? `${startCmd}.cmd` : startCmd, startArgs.concat(this.getSerialArgs()), {cwd: this.getServicePath(), stdio: 'pipe', env: this.getEnvironment()});
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