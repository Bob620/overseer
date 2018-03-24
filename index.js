const overseer = require('./Overseer'),
      Log = require('./util/log');

Log.on('message', log => {
	console.log(`[${log.name}] - ${log.message}`);
});

overseer.init().catch((err) => {
	console.log(err);
});