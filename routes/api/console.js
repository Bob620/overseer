const express = require('express');

class ServicesRouter {
	constructor(router=express.Router()) {
		this.router = router;

		this.router.get('/', async (req, res) => {
			res.send('');
		});
	}
}

module.exports = ServicesRouter;