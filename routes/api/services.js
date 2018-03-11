const express = require('express');
const uptimeAPI = require('../../api/uptime');

class ServicesRouter {
	constructor(services, router=express.Router()) {
		this.services = services;
		this.router = router;

		this.router.get('/', async (req, res) => {
			res.send(this.services.listServices());
		});

		this.router.get('/:serviceName', async (req, res) => {
			res.send(this.services.getService(req.params.serviceName.toString()));
		});

		this.router.get('/:serviceName/uptime', async (req, res) => {
			try {
				res.status(202);
				let serviceUptime = await uptimeAPI.getUptimeOfService(req.params.serviceName.toString());

				res.status(200).json(serviceUptime);
			} catch(err) {
				console.log(err);
				res.status(500).end();
			}
		});

		this.router.get('/:serviceName/instances/:instanceId', async (req, res) => {
			res.send(this.services[req.params.serviceName.toString()].listInstances[req.params.instanceId.toString()]);
		});

		this.router.get('/:serviceName/instances/:instanceId/uptime', async (req, res) => {
			try {
				res.status(202);
				let instanceUptime = await uptimeAPI.getUptimeOfInstance(req.params.serviceName.toString(), req.params.instanceId.toString());

				res.status(200).json(instanceUptime);
			} catch(err) {
				console.log(err);
				res.status(500).end();
			}
		});
	}
}

module.exports = ServicesRouter;