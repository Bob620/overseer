// Config
const config = require('./config/config.json');

const Logger = require('./util/logger');
const log = Logger.log.bind(Logger, 'Overseer'.yellow);

class Overseer {
	constructor() {
		this.portServices = require('./manager/portservice');
		this.services = require('./manager/services');
		this.gitControl = require('./manager/gitcontrol');
	}

	async init() {
		await this.portServices.init(config.options.ports);
		log('PortService Initialized');

		await this.services.init(config.defaultServiceSettings);
		log('Services Initialized');

		await this.gitControl.init(config.gitRemote);
		log('GitControl Initialized');

		log('Running Overseer...');
		await this.run();
	}

	async run() {
		const waifusite = await this.gitControl.getNewestRepo('bob620/waifusite');

//	const waifusite = await services.getService('bob620/waifusite');
		const instance = await waifusite.createInstance();

		waifusite.runCommand('build');
		instance.start();
	}
}

module.exports = new Overseer();