class PortService {
	constructor(portRange) {
		this.minPort = portRange[0];
		this.maxPort = portRange[1];

		this.nextPort = this.minPort;

		this.portsInUse = [];
	}

	generatePort() {
		if (this.portsInUse.length < this.maxPort - this.minPort) {
			while (!this.isAvailable(this.nextPort)) {
				if(++this.nextPort > this.maxPort) {
					this.nextPort = this.minPort;
				}
			}
			return this.nextPort++;
		} else {
			throw new Error('Out of ports');
		}
	}

	isAvailable(port) {
		if (port >= this.minPort && port <= this.maxPort) {
			if (this.portsInUse.length < this.maxPort - this.minPort) {
				return !this.portsInUse.includes(port);
			}
		}
		return false;
	}

	clearPort(port) {
		const index = this.portsInUse.indexOf(port);
		if (index >= 0) {
			this.portsInUse.splice(index, 1);
		}
	}
}

module.exports = PortService;