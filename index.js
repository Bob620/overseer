const overseer = require('./Overseer'),
      Logger = require('./util/logger');

Logger.on('message', log => {
	console.log(`[${log.name}] - ${log.message}`);
});

overseer.init().then(async () => {
	//		const waifusite = await this.gitControl.getNewestRepo('bob620/waifusite');

	const waifusite = await overseer.services.getService('bob620/waifusite');
	const instance = await waifusite.createInstance();

	//		waifusite.runCommand('build');
	instance.start();
}).catch((err) => {
	console.log(err);
});