const fs = require('fs');

const kagi = require('kagi'),
	    simpleGit = require('simple-git')();

class ServiceWatcher {
	constructor(config, onInit) {
		this.remoteURL = `https://${config.username}:${config.password}@github.com`;
		this.servicePath = `${__dirname}/services`;
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
							this.services.set(`${author}/${repo}`, {});
						} else {
							fs.rmdirSync(`${this.servicePath}/${author}/${repo}`);
						}
						resolve();
					});
				}));
			}
		}

		return Promise.all(possibleServices);
	}

	cloneService(gitRepo) {
		if (!this.services.has(`${gitRepo}`)) {
			console.log(`Cloning ${gitRepo}`);
			simpleGit.clone(`${this.remoteURL}/${gitRepo}`, `${this.servicePath}/${gitRepo}`, (err) => {
				if (err) console.log(err);
				console.log(`Cloned ${gitRepo}`);
			});
		} else {
			console.log(`${gitRepo} already cloned...`);
			this.pullService(gitRepo);
		}
	}

	pullService(gitRepo) {
		console.log(`Pulling ${gitRepo}`);
		simpleGit.cwd(`${this.servicePath}/${gitRepo}`).pull((err, pullSummary) => {
			if (err) console.log(err);
			console.log(pullSummary);
			console.log(`Pulled ${gitRepo}`);
		});
	}
}

module.exports = ServiceWatcher;