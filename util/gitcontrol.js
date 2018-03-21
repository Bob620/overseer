const fs = require('fs');

const simpleGit = require('simple-git')();

const Service = require('./service');

class GitControl {
	constructor(config, defaultSettings, portService, onInit) {
		this.remoteURL = `https://${config.username}:${config.password}@github.com`;
		this.servicePath = `${__dirname.substr(0, __dirname.length-5)}/services`;
		this.defaultSettings = defaultSettings;
		this.portService = portService;
		this.services = new Map();

		this.checkForExistingServices().then(() => {
			onInit();
		});
	}

	checkForExistingServices() {
		try {
			fs.mkdirSync(this.servicePath);
		} catch (err) {}

		let possibleServices = [];

		const authors = fs.readdirSync(this.servicePath);
		for (let authorIndex in authors) {
			const author = authors[authorIndex];
			const repos = fs.readdirSync(`${this.servicePath}/${author}`);
			for (let repoIndex in repos) {
				const repo = repos[repoIndex];
				const gitRepo = `${author}/${repo}`;
				possibleServices.push(new Promise((resolve) => {
					simpleGit.cwd(`${this.servicePath}/${gitRepo}`).checkIsRepo((err, isRepo) => {
						if (isRepo) {
							this.services.set(gitRepo, new Service(gitRepo, `${this.servicePath}/${gitRepo}`, `${this.remoteURL}/${gitRepo}`, this.defaultSettings[gitRepo], this.portService));
							resolve();
						} else {
							fs.rmdirSync(`${this.servicePath}/${gitRepo}`);
							resolve();
						}
					});
				}));
			}
		}

		return Promise.all(possibleServices);
	}

	getNewestRepo(gitRepo) {
		if (!this.services.has(gitRepo)) {
			return this.cloneService(gitRepo);
		} else {
			return this.services.get(gitRepo).gitPull();
		}
	}

	cloneService(gitRepo) {
		console.log(`\nCloning ${gitRepo}...`);
		return new Promise((resolve, reject) => {
			simpleGit.clone(`${this.remoteURL}/${gitRepo}`, `${this.servicePath}/${gitRepo}`, (err) => {
				if (err) {
					reject(err);
					return;
				}

				const service = new Service(gitRepo, `${this.servicePath}/${gitRepo}`, `${this.remoteURL}/${gitRepo}`, this.defaultSettings[gitRepo], this.portService);
				this.services.set(gitRepo, service);

				console.log(`Cloned ${gitRepo}`);
				service.updateDependencies().then(() => {
					resolve();
				})
			});
		});
	}

	listServices() {
		let serviceNames = [];

		this.services.forEach((service, serviceName) => {
			serviceNames.push(serviceName);
		});

		return serviceNames;
	}
}

module.exports = GitControl;