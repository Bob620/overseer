const overseer = require('./Overseer'),
      Logger = require('./util/logger');

Logger.on('message', log => {
	console.log(`[${log.name}] - ${log.message}`);
});

overseer.init().then(async () => {
//	const gazouServer = await overseer.gitControl.getNewestRepo('bob620/gazou-server');

	const bobcosite = await overseer.services.getService('bob620/bobco');
	const waifusite = await overseer.services.getService('bob620/waifusite');
	const gazouServer = await overseer.services.getService('bob620/gazou-server');

	const bobcoInstance = await bobcosite.createInstance();
	const waifusiteInstance = await waifusite.createInstance();
	const gazouServerInstance = await gazouServer.createInstance();

	bobcoInstance.setRespawn(true);
	waifusiteInstance.setRespawn(true);
	gazouServerInstance.setRespawn(true);

//	waifusite.runCommand('build');
//	bobcosite.runCommand('build');
	bobcoInstance.start();
	waifusiteInstance.start();
	gazouServerInstance.start();
}).catch((err) => {
	console.log(err);
});