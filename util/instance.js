const EventEmitter = require('events');

const { spawn } = require('child_process');

const Log = require('./log');

const InstanceConst = {
	"STATUS": {
		"STOPPED": 0,
		"RUNNING": 1
	}
};

class Instance extends EventEmitter {
	constructor(instanceId, serviceName, servicePath, settings) {
		super();

		this.id = instanceId;
		this.serviceName = serviceName;
		this.processStatus = InstanceConst.STATUS.STOPPED;
		this.entryFile = settings.entryFile;
		this.args = settings.args;
		this.respawn = settings.respawn;
		this.commands = settings.commands;
		this.servicePath = servicePath;
		this.process = undefined;

		this.log = Log.log.bind(Log, instanceId);

		this.statistics = {
			downTime: []
		}
	}

	get arguments() {
		let args = [];

		if (this.commands.start.cmd === 'npm') {
			args.push('--');
		}

		Object.values(this.args).forEach(argument => {
			argument.forEach(value => {
				args.push(value);
			});
		});

		return args;
	}

	set status(newStatus) {
		if (newStatus !== this.status) {
			switch (newStatus) {
				case InstanceConst.STATUS.RUNNING:
					this.processStatus = newStatus;
					this.emit('open');
					break;
				case InstanceConst.STATUS.STOPPED:
					this.processStatus = newStatus;
					this.emit('exit');
					break;
			}
		}
	}

	get status() {
		return this.processStatus;
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
		this.process.on('err', err => {
			this.emit('err', err);
			this.status = InstanceConst.STATUS.STOPPED;
		});

		this.process.on('close', async (code, signal) => {
			this.log(`Closed with code ${code} from signal ${signal}`);
			this.status = InstanceConst.STATUS.STOPPED;

			if (this.respawn) {
				this.log(`Restarting automatically`);
				await this.createProcess();
			} else {
				this.emit('exit');
			}
		});

//		this.process.on('exit', (code, signal) => {
//			this.log(`Exited with code ${code} from signal ${signal}`);
//			this.status = InstanceConst.STATUS.STOPPED;
//		});
	}

	async start() {
		if (this.status === InstanceConst.STATUS.STOPPED) {
			await this.createProcess();
			this.log(`Started ${this.args.port ? `on port ${this.args.port[1]}` : ''}`);
		}
	}

	async restart() {
		if (this.status === InstanceConst.STATUS.RUNNING) {
			this.process.once('close', async () => {
				if (!this.respawn) {
					this.log(`Restarting automatically`);
					await this.createProcess();
				}
			});

			await this.stop();
		} else {
			if (!this.respawn) {
				this.log(`Restarting automatically`);
				await this.createProcess();
			}
		}
	}

	async createProcess() {
//		this.process = execSh(`cd ${this.servicePath} && ${this.commands.start}`);
//		this.process = fork(`${this.servicePath}/${this.entryFile}`
		this.process = spawn(this.commands.start.cmd, this.commands.start.args.concat(this.arguments), {cwd: this.servicePath, stdio: 'pipe'});
		this.status = InstanceConst.STATUS.RUNNING;
		await this.bind();
	}

	async stop() {
		this.respawn = false;
		if (this.status === InstanceConst.STATUS.RUNNING) {
			if (process.platform === "win32") {
				// This is the only working way on windows ( ￣＾￣)
				await spawn('taskkill', ['/pid', this.process.pid, '/f', '/t']);
			} else {
				await this.process.kill('SIGINT');
			}
		}
	}
}

module.exports = {Instance, InstanceConst};