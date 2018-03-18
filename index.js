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
const GitControl = require('./util/gitcontrol');
const gitControl = new GitControl(config.gitRemote, config.defaultServiceSettings, () => {
	gitControl.getNewestRepo('bob620/childexample').then(() => {
		const waifusite = gitControl.services.get('bob620/childexample');

		waifusite.createInstance();

		setTimeout(() => {
			waifusite.instances.forEach((instance) => {
				instance.process.send("Test");
			});
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
		}, 5000);
	});
});

apiRouter.use('/console', new ConsoleAPIRouter(gitControl).router);
apiRouter.use('/services', new ServicesAPIRouter([]).router);
webserver.use('/api', apiRouter);

webserver.use('/console', new ConsoleRouter().router);