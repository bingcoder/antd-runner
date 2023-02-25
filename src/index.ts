const monacoEditorPathMap = {
  bootcdn: "https://cdn.bootcdn.net/ajax/libs/monaco-editor/0.34.1/min/vs",
};

window.addEventListener("message", function (e) {
  if (e.data.source === "antd-runner") {
    if (window.AntdRunner) return;
    window.AntdRunner = e.data.payload;
    const monacoEditorPath =
      monacoEditorPathMap[
        (window.AntdRunner
          .monacoEditorPath as keyof typeof monacoEditorPathMap) || "bootcdn"
      ];
    const scriptFragment = document.createDocumentFragment();
    const resources = [
      window.AntdRunner.extensionDir + "lib/babel.min.js",
      window.AntdRunner.extensionDir + "lib/moment.min.js",
      window.AntdRunner.extensionDir + "lib/moment.zh-cn.js",
      monacoEditorPath + "/loader.js",
      window.AntdRunner.extensionDir + "js/antd.zh-cn.min.js",
      window.AntdRunner.extensionDir + "js/init.js",
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
