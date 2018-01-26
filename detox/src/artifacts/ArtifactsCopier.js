const path = require('path');
const log = require('npmlog');
const sh = require('../utils/sh');

class ArtifactsCopier {
  constructor(deviceDriver) {
    this._deviceDriver = deviceDriver;
    this._currentLaunchNumber = 0;
    this._currentTestArtifactsDestination = undefined;
    this._artifacts = [];
  }

  prepare(deviceId) {
    this._deviceId = deviceId;
  }

  addArtifact(source, destName) {
    this._artifacts.push([source, destName + path.extname(source)]);
  }

  setArtifactsDestination(artifactsDestination) {
    this._currentTestArtifactsDestination = artifactsDestination;
    this._currentLaunchNumber = 1;
  }

  async handleAppRelaunch() {
    await this._copyArtifacts();
    this._currentLaunchNumber++;
  }

  async finalizeArtifacts() {
    await this._copyArtifacts();
  }

  async _copyArtifacts() {
    const copy = async (sourcePath, destinationSuffix) => {
      const destinationPath = `${this._currentTestArtifactsDestination}/${this._currentLaunchNumber}.${destinationSuffix}`;
      const cpArgs = `"${sourcePath}" "${destinationPath}"`;
      try {
        await sh.cp(cpArgs);
      } catch (ex) {
        log.warn(`Couldn't copy (cp ${cpArgs})`);
      }
    };

    if(this._currentTestArtifactsDestination === undefined) {
      return;
    }

    const {stdout, stderr} = this._deviceDriver.getLogsPaths(this._deviceId);
    if (stdout) {
      await copy(stdout, 'out.log');
    }
    if (stderr) {
      await copy(stderr, 'err.log');
    }

    for (const [source, dest] of this._artifacts) {
      await copy(source, dest);
    }
  }

}

module.exports = ArtifactsCopier;
