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

// PortService to keep track of used ports
const PortService = require('./util/portservice');
const portService = new PortService(config.options.ports);

// Service Watcher
const GitControl = require('./util/gitcontrol');
const gitControl = new GitControl(config.gitRemote, config.defaultServiceSettings, portService, () => {
	gitControl.getNewestRepo('bob620/waifusite').then(() => {
		const waifusite = gitControl.services.get('bob620/waifusite');
		waifusite.createInstance();
	});
});

apiRouter.use('/console', new ConsoleAPIRouter(gitControl).router);
apiRouter.use('/services', new ServicesAPIRouter([]).router);
webserver.use('/api', apiRouter);

webserver.use('/console', new ConsoleRouter().router);