const EventEmitter = require('events');

const { spawn } = require('child_process');

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

	exitInstance() {
		this.respawn = false;
		this.stop();
	}

	bind() {
		this.process.on('disconnect', () => {
			console.log(`[${this.serviceName} - ${this.id}] Disconnected`);
			this.status = InstanceConst.STATUS.STOPPED;
		});

		this.process.on('close', (code, signal) => {
			console.log(`[${this.serviceName} - ${this.id}] Closed with code ${code} from signal ${signal}`);
			this.status = InstanceConst.STATUS.STOPPED;

			if (this.respawn) {
				console.log(`[${this.serviceName} - ${this.id}] Restarting automatically`);
				this.createProcess();
			} else {
				this.emit('exit');
			}
		});

		this.process.on('err', err => {
			console.log(err);
			this.emit('err', err);
			this.status = InstanceConst.STATUS.STOPPED;
		});

		this.process.on('exit', (code, signal) => {
			console.log(`[${this.serviceName} - ${this.id}] Exited with code ${code} from signal ${signal}`);
			this.status = InstanceConst.STATUS.STOPPED;
		});

		this.process.on('message', message => {
			console.log(`[${this.serviceName} - ${this.id}] Received: ${message}`);
			this.emit('message', message);
		});
	}

	start() {
		if (this.status === InstanceConst.STATUS.STOPPED) {
			this.createProcess();
		}
	}

	restart() {
		if (this.status === InstanceConst.STATUS.RUNNING) {
			this.process.once('close', () => {
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
//		this.process = fork(`${this.servicePath}/${this.entryFile}`
		this.process = spawn(this.commands.start.cmd, this.commands.start.args.concat(this.arguments), {cwd: this.servicePath, stdio: 'pipe'});
		this.status = InstanceConst.STATUS.RUNNING;
		this.bind();
	}

	stop() {
		if (this.status === InstanceConst.STATUS.RUNNING) {
			if (process.platform === "win32") {
				// This is the only working way on windows ( ￣＾￣)
				spawn('taskkill', ['/pid', this.process.pid, '/f', '/t']);
			} else {
				this.process.kill('SIGINT');
			}
		}
	}
}

module.exports = {Instance, InstanceConst};