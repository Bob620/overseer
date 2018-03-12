// Config
const config = require('./config/config.json');

// Webserver base
const webserver = require('./webserver/bin/www');

// Webserver api routes
const apiRouter = require('./routes/api/api');
const ServicesRouter = require('./routes/api/services');
const ConsoleRouter = require('./routes/api/console');

// Service Imports
const Service = require('./util/service');
const Instance = require('./util/instance');

// Service Watcher
const ServiceWatcher = require('./servicewatcher/index');
const serviceWatcher = new ServiceWatcher(config.gitRemote, config.defaultServiceSettings, () => {
	serviceWatcher.getNewestRepo('bob620/waifusite').then(() => {
		const waifusite = serviceWatcher.services.get('bob620/waifusite');
		console.log(waifusite);

		waifusite.createInstance();

		setTimeout(() => {
			waifusite.instances.forEach((instance) => {
				instance.restart();
			});
			setTimeout(() => {
				waifusite.instances.forEach((instance) => {
					instance.stop();
				});
			}, 5000);
		}, 5000);
	});
});

let services = [

];

apiRouter.use('/console', new ConsoleRouter().router);
apiRouter.use('/services', new ServicesRouter(services).router);
webserver.use('/api', apiRouter);
