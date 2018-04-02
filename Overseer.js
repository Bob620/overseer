// Config
const config = require('./config/config.json');

const Logger = require('./util/logger');
const log = Logger.createLog('Overseer'.yellow);

const proxy = require('./manager/proxy');

class Overseer {
	constructor() {
		this.portService = require('./manager/portservice');
		this.services = require('./manager/services');
		this.gitControl = require('./manager/gitcontrol');
		this.proxy = proxy;
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
		await this.portService.init(config.options.internal);
		log('PortService Initialized');

		await this.services.init(config.services);
		log('Services Initialized');

		await this.gitControl.init(config.gitRemote);
		log('GitControl Initialized');

		await this.proxy.init(config.options.proxy);
		log('Proxy Initialized');

		log('Overseer running');
	}
}

module.exports = new Overseer();