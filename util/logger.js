const EventEmitter = require('events');

const colors = require('colors');

class Logger extends EventEmitter {
	constructor() {
		super();
		this.logs = {};
	}

	log(name, message) {
		if (!this.logs.hasOwnProperty(name)) {
			this.logs[name] = new Log();
		}
		this.logs[name].push(message);
		this.emit('message', {name, message});
		this.emit(name, message);
	}

	read(name, max=1) {
		return this.logs[name].get(max);
	}
}

class Log {
	constructor() {
		this.log = [];
	}

	push(message) {
		this.log.push(message);
	}

	get(max) {
		this.log.splice(this.log.length-max, max);
	}
}

module.exports = new Logger();