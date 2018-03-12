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
				possibleServices.push(new Promise((resolve) => {
					simpleGit.cwd(`${this.servicePath}/${author}/${repo}`).checkIsRepo((err, isRepo) => {
						if (isRepo) {
							this.services.set(`${author}/${repo}`, new Service(`${author}/${repo}`, new Instance(this.defaultServiceSettings[`${author}/${repo}`], `${this.servicePath}/${author}/${repo}`)));
							execSh(this.defaultServiceSettings[`${author}/${repo}`].install, {cwd: `${this.servicePath}/${author}/${repo}`}, err => {
								if (err) console.log(err);
								resolve();
							});
						} else {
							fs.rmdirSync(`${this.servicePath}/${author}/${repo}`);
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
			console.log(`${gitRepo} already cloned`);
			return this.pullService(gitRepo);
		}
	}

	cloneService(gitRepo) {
		console.log(`Cloning ${gitRepo}...`);
		return new Promise((resolve, reject) => {
			simpleGit.clone(`${this.remoteURL}/${gitRepo}`, `${this.servicePath}/${gitRepo}`, (err) => {
				if (err) {
					reject(err);
					return;
				}

				simpleGit.exec(this.defaultServiceSettings[`${gitRepo}`].install);
				this.services.set(`${gitRepo}`, new Service(`${gitRepo}`, new Instance(this.defaultServiceSettings[`${gitRepo}`])));

				console.log(`Cloned ${gitRepo}`);
				resolve();
			});
		});
	}

	pullService(gitRepo) {
		console.log(`Pulling ${gitRepo}...`);
		return new Promise((resolve, reject) => {
			simpleGit.cwd(`${this.servicePath}/${gitRepo}`).pull((err) => {
				if (err) {
					reject(err);
					return;
				}

				console.log(`Pulled ${gitRepo}`);
				resolve();
			});
		});
	}
}

module.exports = ServiceWatcher;