const dynamo = require('dynamodb');
const Joi = require('joi');
const kagi = require('kagi');

const dynamoConfig = kagi.getChain('kagi.chn').getLink('credentials').data;
dynamoConfig.region = "us-west-2";

dynamo.AWS.config.update(dynamoConfig);

const ServiceUptime = dynamo.define('serviceuptime', {
	hashKey: 'InstanceId',
	tableName: 'serviceuptime',
	schema: {
		InstanceId: Joi.string(),
		ServiceName: Joi.string(),
		Polls: [
			Joi.object().keys({
				Time: Joi.number(),
				Up: Joi.boolean()
			})
		]
	}
});

module.exports = { dynamo, ServiceUptime };