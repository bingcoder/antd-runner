const pkgPaths = ['babelStandalonePath', 'monacoEditorPath', 'momentPath'];

chrome.storage.local.get(pkgPaths, function (values) {
  pkgPaths.forEach((item) => {
    const textareaElement = document.getElementById(item);
    textareaElement.value = values[item] || '';
  });
});

document.getElementById('save').addEventListener('click', function () {
  const params = {};
  pkgPaths.forEach((item) => {
    params[item] = document.getElementById(item).value.trim();
  });
  chrome.storage.local.set(params, function () {
    document.querySelector('.message').innerText = '保存成功';
    setTimeout(function () {
      document.querySelector('.message').innerText = '';
    }, 5000);
  });
});
