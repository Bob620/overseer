// Config
const config = require('./config/config.json');

// Webserver base
const webserver = require('./webserver/bin/www');

// Webserver api routes
const apiRouter = require('./routes/api/api');
const ServicesAPIRouter = require('./routes/api/services');
const ConsoleAPIRouter = require('./routes/api/console');

// Webserver console routes
const ConsoleRouter = require('./routes/console/console');

// Service Watcher
const ServiceWatcher = require('./servicewatcher/index');
const serviceWatcher = new ServiceWatcher(config.gitRemote, config.defaultServiceSettings, () => {
	serviceWatcher.getNewestRepo('bob620/waifusite').then(() => {
		const waifusite = serviceWatcher.services.get('bob620/waifusite');

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

apiRouter.use('/console', new ConsoleAPIRouter(serviceWatcher).router);
apiRouter.use('/services', new ServicesAPIRouter([]).router);
webserver.use('/api', apiRouter);

webserver.use('/console', new ConsoleRouter().router);