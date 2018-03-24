const EventEmitter = require('events');

const colors = require('colors');

class Console extends EventEmitter {
	constructor() {
		super();
		this.logs = {};
	}

	log(name, message) {
		const splitName = name.split('/');
		switch(splitName.length) {
			case 2:
				name = `${splitName[0].blue}/${splitName[1].green}`;
				break;
			default:
				name = name.blue;
				break;
		}
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
//		super();
		this.log = [];
	}

	push(message) {
		this.log.push(message);
//		this.emit(message);
	}

	get(max) {
		this.log.splice(this.log.length-max, max);
	}
}

module.exports = new Console();