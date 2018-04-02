const overseer = require('./Overseer'),
      Logger = require('./util/logger');

Logger.on('message', log => {
	console.log(`[${log.name}] - ${log.message}`);
});

overseer.init().then(async () => {
//	const bobcosite = await overseer.gitControl.getNewestRepo('bob620/bobco');
	const bobcosite = await overseer.services.getService('bob620/bobco');
	const waifusite = await overseer.services.getService('bob620/waifusite');

	const bobcoInstance = await bobcosite.createInstance();
	const waifusiteInstance = await waifusite.createInstance();

	bobcoInstance.setRespawn(true);
	waifusiteInstance.setRespawn(true);

//	waifusite.runCommand('build');
//	bobcosite.runCommand('build');
	bobcoInstance.start();
	waifusiteInstance.start();
}).catch((err) => {
	console.log(err);
});