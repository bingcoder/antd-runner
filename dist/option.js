const pkgPaths = ["babelStandalonePath", "monacoEditorPath", "momentPath"];
const saveBtn = document.getElementById("save");
saveBtn.innerText = chrome.i18n.getMessage("save");

chrome.storage.local.get(pkgPaths, function (values) {
  pkgPaths.forEach(function (item) {
    const textareaElement = document.getElementById(item);
    textareaElement.value = values[item] || "";
  });
});

saveBtn.addEventListener("click", function () {
  const params = {};
  pkgPaths.forEach((item) => {
    params[item] = document.getElementById(item).value.trim();
  });
  chrome.storage.local.set(params, function () {
    document.querySelector(".message").innerText =
      chrome.i18n.getMessage("saveSuccess");
    setTimeout(function () {
      document.querySelector(".message").innerText = "";
    }, 5000);
  });
});
