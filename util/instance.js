const execSh = require('exec-sh');
const spawn = require('child_process').spawn;

class Instance {
	constructor(defaultSettings, path) {
		this.ServiceStartCommand = defaultSettings.start;
		this.defaultSettings = defaultSettings;
		this.path = path;
	}

	create(settings=this.defaultSettings) {
		return new InstanceProcess(this.ServiceStartCommand, this.path, settings.args);
	}
}

class InstanceProcess {
	constructor(serviceStartCommand, path, args) {
		this.status = "stopped";
		this.ServiceStartCommand = serviceStartCommand;
		this.path = path;
		this.args = args;
		this.process = undefined;
	}

	bind() {
		this.process.on('disconnect', () => {
			console.log('Child disconnected');
			this.status = "stopped";
		});

		this.process.on('close', (code, signal) => {
			console.log(`closed with code ${code} from signal ${signal}`);
			this.status = "stopped";
		});

		this.process.on('err', err => {
			console.log(err);
			this.status = "stopped";
		});

		this.process.on('exit', (code, signal) => {
			console.log(`exited with code ${code} from signal ${signal}`);
			this.status = "stopped";
		});

		this.process.on('message', message => {
			console.log(message);
		});
	}

	start() {
		if (this.status === 'stopped') {
			this.process = execSh(`cd ${this.path} && ${this.ServiceStartCommand}`);
			this.bind();
			this.status = "running";
		}
	}

	restart() {
		if (this.status === 'running') {
			spawn("taskkill", ["/pid", this.process.pid, '/f', '/t']);
		}

		this.process.once('close', (code, signal) => {
			this.process = execSh(`cd ${this.path} && ${this.ServiceStartCommand}`);
			this.status = "running";
			this.bind();
		});
	}

	stop() {
		if (this.status === 'running') {
			spawn("taskkill", ["/pid", this.process.pid, '/f', '/t']);
		}
	}
}

module.exports = Instance;