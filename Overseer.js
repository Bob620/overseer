// Config
const config = require('./config/config.json');

const Logger = require('./util/logger');
const log = Logger.log.bind(Logger, 'Overseer'.yellow);

const app = require('./routes/serviceRouter');
const http = require('http');

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
		if (!this.closing) {
			this.closing = true;
			log("Shutting down...");

			this.services.services.forEach(service => {
				service.syncStop();
			});

			process.exit();
		}
	}

	async init() {
		await this.portServices.init(config.options.ports);
		log('PortService Initialized');

		await this.services.init(config.defaultServiceSettings);
		log('Services Initialized');

		await this.gitControl.init(config.gitRemote);
		log('GitControl Initialized');

//		this.server.listen(80);
		log('Service Router Initialized on port 80');

		log('Running Overseer...');
		await this.run();
	}

	async run() {
//		const waifusite = await this.gitControl.getNewestRepo('bob620/waifusite');

  	const waifusite = await this.services.getService('bob620/waifusite');
		const instance = await waifusite.createInstance();

//		waifusite.runCommand('build');
		instance.start();
	}
}

module.exports = new Overseer();