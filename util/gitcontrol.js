const util = require('util');
const fs = require('fs');
const rmdir = util.promisify(fs.rmdir);

const simpleGit = require('simple-git')();

const Log = require('./log');
const log = Log.log.bind(Log, 'GitControl');

class GitControl {
	constructor(config, services) {
		this.remoteURL = `https://${config.username}:${config.password}@github.com`;
		this.servicePath = `${__dirname.substr(0, __dirname.length-5)}/services`;
		this.services = services;

		try {
			fs.mkdirSync(this.servicePath);
		} catch(err) {}
	}

	async checkForExistingServices() {
		log('Checking for existing services...');
		let possibleServices = [];

		fs.readdirSync(this.servicePath).forEach(async author => {
			fs.readdirSync(`${this.servicePath}/${author}`).forEach(repo => {
				const gitRepo = `${author}/${repo}`;

				possibleServices.push(new Promise(resolve => {
					simpleGit.cwd(`${this.servicePath}/${gitRepo}`).checkIsRepo(async (err, isRepo) => {
						if (isRepo) {
							await this.services.addService(gitRepo, `${this.servicePath}/${gitRepo}`, `${this.remoteURL}/${gitRepo}`);
							resolve();
						} else {
							await rmdir(`${this.servicePath}/${gitRepo}`);
							resolve();
						}
					});
				}));
			});
		});

		return Promise.all(possibleServices).then(() => {
			log('Existing repos searched');
		});
	}

	getNewestRepo(gitRepo) {
		return new Promise((resolve, reject) => {
			this.services.getService(gitRepo).then(async (service) => {
				await service.gitPull();
				resolve(service);
			}).catch(async () => {
				resolve(await this.cloneRepo(gitRepo));
			});
		});
	}

	cloneRepo(gitRepo) {
		log(`Cloning ${gitRepo}...`);
		return new Promise((resolve, reject) => {
			simpleGit.clone(`${this.remoteURL}/${gitRepo}`, `${this.servicePath}/${gitRepo}`, (err) => {
				if (err) {
					reject(err);
					return;
				}

				this.services.addService(gitRepo, `${this.servicePath}/${gitRepo}`, `${this.remoteURL}/${gitRepo}`).then(service => {
					log(`Cloned ${gitRepo}`);
					service.updateDependencies().then(() => {
						resolve(service);
					});
				});
			});
		});
	}
}

module.exports = GitControl;