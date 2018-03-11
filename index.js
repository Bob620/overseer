// Config
const config = require('./config/config.json');

// Webserver base
const webserver = require('./webserver/bin/www');

// Webserver api routes
const apiRouter = require('./routes/api/api.js');
const ServicesRouter = require('./routes/api/services.js');

// Service Imports
const Service = require('./util/service');
const Instance = require('./util/instance');

// Service Watcher
const ServiceWatcher = require('./servicewatcher/index');
const serviceWatcher = new ServiceWatcher(config.gitRemote, () => {
	serviceWatcher.cloneService('bob620/waifusite');
});

let services = [
	{
		"serviceName": "waifubot",
		"instances": ['0']
	}
];

apiRouter.use('/services', new ServicesRouter(services).router);
webserver.use('/api', apiRouter);
