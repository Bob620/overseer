const express = require('express');

class ConsoleRouter {
	constructor(serviceWatcher, router=express.Router()) {
		this.router = router;

		this.router.get('/', async (req, res) => {
			res.send('');
		});
	}
}

module.exports = ConsoleRouter;