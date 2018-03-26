const overseer = require('./Overseer'),
      Logger = require('./util/logger');

Logger.on('message', log => {
	console.log(`[${log.name}] - ${log.message}`);
});

overseer.init().catch((err) => {
	console.log(err);
});