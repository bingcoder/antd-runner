const pkgPaths = ['babelStandalonePath', 'monacoEditorPath', 'momentPath'];

const resources = ['js/index.js', 'js/action.js', 'js/antd.local.js'];
const scriptFragment = document.createDocumentFragment();
resources.forEach((item) => {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = chrome.runtime.getURL(item);
  if (item === 'js/index.js') {
    script.onload = function () {
      chrome.storage.local.get(pkgPaths, function (values) {
        window.postMessage({
          source: 'antd-runner',
          payload: {
            extensionDir: chrome.runtime.getURL(''),
            ...values,
          },
        });
      });
    };
  }
  scriptFragment.appendChild(script);
});
document.body.appendChild(scriptFragment);
