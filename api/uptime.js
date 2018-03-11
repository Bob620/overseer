const { ServiceUptime } = require('../util/dynamodb.js');

function getUptimeOfInstance(serviceName, instanceId) {
	return new Promise((resolve, reject) => {
		ServiceUptime.get({InstanceId: instanceId, ServiceName: serviceName}, (err, instancePoll) => {
			if (err) reject(err);
			resolve(instancePoll);
		});
	});
}

function getUptimeOfService(serviceName) {
	return new Promise((resolve, reject) => {
		ServiceUptime.scan().where('ServiceName').equals(serviceName).loadAll()
		.exec((err, instances) => {
			if (err) reject(err);
			resolve(instances.Items);
		});
	});
}

function addPollToInstance(serviceName, instanceId, poll) {
	return new Promise((resolve, reject) => {
		ServiceUptime.update({InstanceId: instanceId, ServiceName: serviceName, Polls: {$add: poll}}, (err) => {
			if (err) reject(err);
			resolve();
		});
	})
}

module.exports = { getUptimeOfInstance, getUptimeOfService };