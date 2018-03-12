const fs = require('fs');

const simpleGit = require('simple-git')();
      execSh = require('exec-sh');

const Instance = require('../util/instance');
      Service = require('../util/service');

class ServiceWatcher {
	constructor(config, defaultServiceSettings, onInit) {
		this.remoteURL = `https://${config.username}:${config.password}@github.com`;
		this.servicePath = `${__dirname}/services`;
		this.defaultServiceSettings = defaultServiceSettings;
		this.services = new Map();

		this.checkForExistingServices().then(() => {
			onInit();
		});
	}

	checkForExistingServices() {
		try {
			fs.mkdirSync(this.servicePath);
		} catch (err) {
		}

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
							this.services.set(`${gitRepo}`, new Service(`${gitRepo}`, new Instance(`${gitRepo}`, this.defaultServiceSettings[`${gitRepo}`], `${this.servicePath}/${gitRepo}`)));
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
			return this.pullService(gitRepo);
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

				simpleGit.exec(this.defaultServiceSettings[`${gitRepo}`].install);
				this.services.set(`${gitRepo}`, new Service(`${gitRepo}`, new Instance(`${gitRepo}`, this.defaultServiceSettings[`${gitRepo}`], `${this.servicePath}/${gitRepo}`)));

				console.log(`Cloned ${gitRepo}`);
				console.log('Updating dependencies...\n');

				execSh(this.defaultServiceSettings[`${gitRepo}`].install, {cwd: `${this.servicePath}/${gitRepo}`}, err => {
					if (err) console.log(err);
					resolve();
				});
			});
		});
	}

	pullService(gitRepo) {
		console.log(`\nPulling ${gitRepo}...`);
		return new Promise((resolve, reject) => {
			simpleGit.cwd(`${this.servicePath}/${gitRepo}`).pull((err) => {
				if (err) {
					reject(err);
					return;
				}

				console.log(`Pulled ${gitRepo}`);
				console.log('Updating dependencies...\n');

				execSh(this.defaultServiceSettings[`${gitRepo}`].install, {cwd: `${this.servicePath}/${gitRepo}`}, err => {
					if (err) console.log(err);
					resolve();
				});
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

module.exports = ServiceWatcher;