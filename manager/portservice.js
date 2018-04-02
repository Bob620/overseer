class PortService {
	constructor() {
		this.data = {
			minPort: 8000,
			maxPort: 9000,
			nextPort: 8000,
			portsInUse: []
		};
	}

	init(config) {
		this.setMinPort(config.portRange[0]);
		this.setMaxPort(config.portRange[1]);
		this.data.nextPort = config.portRange[0];
	}

	getMinPort() {
		return this.data.minPort;
	}

	getMaxPort() {
		return this.data.maxPort;
	}

	getNextPort() {
		if (this.getPortsInUse().length < this.getMaxPort() - this.getMinPort()) {
			while (!this.isAvailable(this.data.nextPort)) {
				if(++this.data.nextPort > this.getMaxPort()) {
					this.data.nextPort = this.getMinPort();
				}
			}
			return this.data.nextPort++;
		} else {
			throw new Error('Out of ports');
		}
	}

	getPortsInUse() {
		return this.data.portsInUse;
	}

	setMinPort(port) {
		this.data.minPort = port;
	}

	setMaxPort(port) {
		this.data.maxPort = port;
	}

	setPortsInUse(ports) {
		this.data.portsInUse = ports;
	}

	isAvailable(port) {
		if (port >= this.getMinPort() && port <= this.getMaxPort()) {
			if (this.getPortsInUse().length < this.getMaxPort() - this.getMinPort()) {
				return !this.getPortsInUse().includes(port);
			}
		}
		return false;
	}

	clearPort(port) {
		const index = this.getPortsInUse().indexOf(port);
		if (index >= 0) {
			this.setPortsInUse(this.getPortsInUse().splice(index, 1));
		}
	}
}

module.exports = new PortService();