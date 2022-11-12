(function () {
  window.addEventListener("message", function (e) {
    if (e.data.source === "antd-runner") {
      // @ts-ignore
      if (window.antdRunnerData) return;
      window.antdRunnerData = e.data.payload;
      const scriptFragment = document.createDocumentFragment();
      const resources = [
        window.antdRunnerData.babelStandalonePath ||
          "https://cdn.bootcdn.net/ajax/libs/babel-standalone/7.20.2/babel.min.js",
        window.antdRunnerData.momentPath ||
          "https://cdn.bootcdn.net/ajax/libs/moment.js/2.29.4/moment.min.js",
        (window.antdRunnerData.monacoEditorPath ||
          "https://cdn.bootcdn.net/ajax/libs/monaco-editor/0.34.1/min/vs") +
          "/loader.js",
        window.antdRunnerData.extensionDir + "js/init.js",
      ];
      resources.forEach(function (src) {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.async = false;
        script.src = src;
        scriptFragment.appendChild(script);
      });
      document.body.appendChild(scriptFragment);
    }
  });
})();
