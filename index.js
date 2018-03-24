// Config
const config = require('./config/config.json');

// Webserver base
//const webserver = require('./webserver/bin/www');

// Webserver api routes
//const apiRouter = require('./routes/api/api');
//const ServicesAPIRouter = require('./routes/api/services');
//const ConsoleAPIRouter = require('./routes/api/console');

const Log = require('./util/log');
Log.on('message', log => {
	console.log(`[${log.name}] - ${log.message}`);
});

// Webserver console routes
//const ConsoleRouter = require('./routes/console/console');

// PortService to keep track of used ports
const PortService = require('./util/portservice');
const portService = new PortService(config.options.ports);

const Services = require('./util/services');
const services = new Services(config.defaultServiceSettings, portService);

// Service Watcher
const GitControl = require('./util/gitcontrol');

const gitControl = new GitControl(config.gitRemote, services);
gitControl.checkForExistingServices().then(async () => {
	const waifusite = await gitControl.getNewestRepo('bob620/waifusite');

	const instance = waifusite.createInstance();

	await instance.start();
	await instance.stop();
});

//apiRouter.use('/console', new ConsoleAPIRouter(gitControl).router);
//apiRouter.use('/services', new ServicesAPIRouter([]).router);
//webserver.use('/api', apiRouter);

//webserver.use('/console', new ConsoleRouter().router);