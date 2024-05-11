if (!("browser" in self)) {
  self.browser = self.chrome;
}

function update(details) {
  if(details.reason === "update") {
    browser.storage.local.get("config").then(
      (configData) => {
        if(Object.keys(configData).length === 0
           && configData.constructor === Object) {
          // storage.local is empty, try loading localStorage
          throw "No config found during update";
        } else {
          updateConfig(configData.config)
        }
      },
      (err) => {
        // Failed to get storage.local
        // Not recoverable?
      }
    );
  }
}
browser.runtime.onInstalled.addListener(update);
