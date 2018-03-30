// Config
const config = require('./config/config.json');

const Logger = require('./util/logger');
const log = Logger.createLog('Overseer'.yellow);

const app = require('./routes/serviceRouter');

class Overseer {
	constructor() {
		this.portServices = require('./manager/portservice');
		this.services = require('./manager/services');
		this.gitControl = require('./manager/gitcontrol');
		this.server = app;
		this.closing = false;

		process.stdin.resume();

// do something when app is closing
		process.on('exit', this.exitHandler.bind(this));

// catches ctrl+c event
		process.on('SIGINT', this.exitHandler.bind(this));

// catches "kill pid"
		process.on('SIGUSR1', this.exitHandler.bind(this));
		process.on('SIGUSR2', this.exitHandler.bind(this));
		process.on('SIGTERM', this.exitHandler.bind(this));

// catches uncaught exceptions
		process.on('uncaughtException', this.exitHandler.bind(this));
	}

	exitHandler() {
		if(!this.closing) {
			this.closing = true;
			log("Shutting down...");

			this.services.getServices().forEach(service => {
				service.cleanupSync();
			});

			process.exit();
		}
	}

	async init() {
		await this.portServices.init(config.options.ports);
		log('PortService Initialized');

		await this.services.init(config.services);
		log('Services Initialized');

		await this.gitControl.init(config.gitRemote);
		log('GitControl Initialized');

		//		this.server.listen(80);
		log('Service Router Initialized on port 80');

		log('Running Overseer...');
	}
}

module.exports = new Overseer();