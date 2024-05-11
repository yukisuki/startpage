if (!("browser" in self)) {
  self.browser = self.chrome;
}

function Version(versionString) {
  [this.major, this.minor, this.patch] = versionString.split('.');
}

Version.prototype.toString = function() {
  return this.major + "." + this.minor + "." + this.patch;
}

function updateConfig(config) {
  // We don't care about details.previousVersion because this is just about
  // updating the config
  // If the config has no version then it was created before 1.11.0, or the
  // user deleted it
  const previousVersion = new Version(config.version ? config.version
                                                     : "0.0.0");
  const currentVersionString = browser.runtime.getManifest().version;

  if(previousVersion.toString() === currentVersionString) {
    browser.storage.local.set({config: config}).then(
      () => {
        // Save anyway because updateConfig is also called on config import
        console.log("Config up to date (v%s), saving to storage anyway.",
                    previousVersion.toString());
      },
      logUpdateError
    );
    return;
  }

  // Set the config version to the current version
  config.version = currentVersionString;

  browser.storage.local.set({config: config}).then(
    () => {
      console.log("Config successfully updated from v%s to v%s",
                  previousVersion.toString(),
                  currentVersionString);
    },
    logUpdateError
  );
}

function logUpdateError(err) {
  const version = browser.runtime.getManifest().version;
  console.log("An error occurred while updating to v%s: %s", version, err);
}

