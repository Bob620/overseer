const util = require('util');
const fs = require('fs');
const rmdir = util.promisify(fs.rmdir);

const simpleGit = require('simple-git')();

const Logger = require('../util/logger'),
      log = Logger.log.bind(Logger, 'GitControl'.blue),
      services = require('./services');

class GitControl {
	constructor() {
		this.data = {
			remote: {
				username: '',
				password: ''
			},
			servicePath: `${__dirname.substr(0, __dirname.length-8)}/services`
		};

		try {
			fs.mkdirSync(this.getServicePath());
		} catch(err) {}
	}

	async init(config) {
		this.setRemoteUser(config.username, config.password);
		await this.checkForExistingServices();
	}

	getRemoteURL() {
		return `https://${this.data.remote.username}:${this.data.remote.password}@github.com`;
	}

	getServicePath() {
		return this.data.servicePath;
	}

	setRemoteUser(username, password) {
		this.data.remote.username = username;
		this.data.remote.password = password;
	}

	async checkForExistingServices() {
		log('Checking for existing services...');
		let possibleServices = [];
		const servicePath = this.getServicePath();

		fs.readdirSync(servicePath).forEach(async author => {
			fs.readdirSync(`${servicePath}/${author}`).forEach(repo => {
				const gitRepo = `${author}/${repo}`;

				possibleServices.push(new Promise(resolve => {
					simpleGit.cwd(`${servicePath}/${gitRepo}`).checkIsRepo(async (err, isRepo) => {
						if (isRepo) {
							await services.addService(gitRepo, `${servicePath}/${gitRepo}`, `${this.getRemoteURL()}/${gitRepo}`);
							resolve();
						} else {
							await rmdir(`${servicePath}/${gitRepo}`);
							resolve();
						}
					});
				}));
			});
		});

		return Promise.all(possibleServices).then(() => {
			log('Existing repos registered');
		});
	}

	getNewestRepo(gitRepo) {
		return new Promise(resolve => {
			services.getService(gitRepo).then(async (service) => {
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
			const remoteURL = this.getRemoteURL();
			const servicePath = this.getServicePath();

			simpleGit.clone(`${remoteURL}/${gitRepo}`, `${servicePath}/${gitRepo}`, (err) => {
				if (err) {
					reject(err);
					return;
				}

				services.addService(gitRepo, `${servicePath}/${gitRepo}`, `${remoteURL}/${gitRepo}`).then(service => {
					log(`Cloned ${gitRepo}`);
					service.updateDependencies().then(() => {
						resolve(service);
					});
				});
			});
		});
	}
}

module.exports = new GitControl();