"use strict";
(function () {
    window.React = window.react;
    window.ReactDOM = window["react-dom"];
    window.antdIcons = window["@ant-design/icons"];
    function getTheme() {
        var _a;
        return ((_a = document.body.dataset.theme) === null || _a === void 0 ? void 0 : _a.includes("dark")) ? "vs-dark" : "vs";
    }
    function getFontSize() {
        var _a;
        return ((_a = document.body.dataset.theme) === null || _a === void 0 ? void 0 : _a.includes("compact")) ? 14 : 16;
    }
    var locales = {
        zh: {
            antdRunner: "运行",
            openEditor: "打开编辑器",
            closeEditor: "关闭编辑器",
        },
        en: {
            antdRunner: "Run",
            openEditor: "Open Editor",
            closeEditor: "Close Editor",
        },
    };
    function getLabel(id) {
        if (document.documentElement.lang === "zh") {
            return locales.zh[id];
        }
        return locales.en[id];
    }
    var EditorList = (function () {
        function EditorList() {
            this.list = [];
        }
        EditorList.prototype.push = function (editor) {
            this.list.push(editor);
        };
        EditorList.prototype.removeByContainerDomNodeId = function (id) {
            var _a;
            var newEditorList = [];
            for (var index = 0; index < this.list.length; index++) {
                var editor = this.list[index];
                if (editor.getContainerDomNode().id === id) {
                    (_a = editor.getModel()) === null || _a === void 0 ? void 0 : _a.dispose();
                    editor.dispose();
                }
                else {
                    newEditorList.push(editor);
                }
            }
            this.list = newEditorList;
        };
        EditorList.prototype.clear = function () {
            var _this = this;
            this.list.forEach(function (editor) {
                var containerDomNodeId = editor.getContainerDomNode().id;
                if (!document.getElementById(containerDomNodeId)) {
                    _this.removeByContainerDomNodeId(containerDomNodeId);
                }
            });
        };
        EditorList.prototype.forEach = function (cb) {
            this.list.forEach(cb);
        };
        return EditorList;
    }());
    var MonacoAction = function () {
        var _a = React.useState(false), open = _a[0], setOpen = _a[1];
        var handleOpen = function (e) {
            handleMonacoEditorClick(e.nativeEvent.target.parentElement);
            setOpen(function (o) { return !o; });
        };
        return React.createElement(antd.Tooltip, {
            title: getLabel(open ? "closeEditor" : "openEditor"),
        }, React.createElement("span", { onClick: handleOpen }, React.createElement(antdIcons.LaptopOutlined)));
    };
    var editorList = new EditorList();
    function handleError(rootSelector, error) {
        var root = document.querySelector(rootSelector);
        if (root) {
            ReactDOM.render(React.createElement(antd.Alert, {
                message: error.message || "something error",
                type: "error",
                showIcon: true,
            }), root);
        }
    }
    function runnerCode(codeBox, code) {
        var demoBox = Array.from(codeBox.querySelectorAll(".code-box-demo")).find(function (item) { return !item.classList.contains("code-box-demo-monaco"); });
        var monacoDemoBox = codeBox.querySelector(".code-box-demo-monaco");
        if (!demoBox)
            return;
        demoBox.style.display = "none";
        if (!monacoDemoBox) {
            monacoDemoBox = document.createElement("div");
            monacoDemoBox.className = "code-box-demo code-box-demo-monaco";
            codeBox.insertBefore(monacoDemoBox, demoBox);
        }
        var rootSelector = "#".concat(codeBox.id, " > .code-box-demo-monaco");
        try {
            var output = Babel.transform(code, {
                presets: ["tsx-antd-online"],
            });
            var scriptId = "monaco-".concat(codeBox.id, "-script");
            var runnerScript = document.querySelector(scriptId);
            if (runnerScript) {
                runnerScript.remove();
            }
            runnerScript = document.createElement("script");
            runnerScript.id = scriptId;
            runnerScript.type = "text/javascript";
            runnerScript.appendChild(document.createTextNode("(function () {\n            try {\n              ".concat(output.code, ";\n              ReactDOM.render(\n                React.createElement(\n                  antd.ConfigProvider,\n                  {\n                    locale: antdLocalZh,\n                  },\n                  React.createElement(antdRunnerApp, null)\n                ),\n                document.querySelector('").concat(rootSelector, "')\n              );\n            } catch (error) {\n              console.log(error.message, error);\n              const root = document.querySelector(rootSelector);\n              if (root) {\n                ReactDOM.render(\n                  // @ts-ignore\n                  React.createElement(antd.Alert, {\n                    message: error.message || 'something error',\n                    type: 'error',\n                    showIcon: true,\n                  }),\n                  root\n                );\n              }\n            }\n          })();")));
            document.body.appendChild(runnerScript);
        }
        catch (error) {
            handleError(rootSelector, error);
        }
    }
    function findCodeBox(dom) {
        var codeBox = dom;
        while (dom.parentElement && !codeBox.classList.contains("code-box")) {
            codeBox = codeBox.parentElement;
        }
        if (codeBox === dom)
            return null;
        return codeBox;
    }
    function handleMonacoEditorClick(e) {
        var _a;
        var monacoSpan = e;
        var codeBox = findCodeBox(monacoSpan);
        if (!(codeBox === null || codeBox === void 0 ? void 0 : codeBox.id))
            return;
        var monacoEditorWrapper = codeBox.querySelector(".monaco-editor-wrapper");
        var monacoId = "monaco-".concat(codeBox.id);
        if (!monacoEditorWrapper) {
            monacoEditorWrapper = document.createElement("section");
            monacoEditorWrapper.classList.add("monaco-editor-wrapper");
            codeBox.appendChild(monacoEditorWrapper);
            var code = ((_a = codeBox.querySelector(".language-tsx")) === null || _a === void 0 ? void 0 : _a.innerText) || "";
            monacoEditorWrapper.innerHTML = "<div id=\"".concat(monacoId, "\" style=\"height: 500px\"></div>");
            var model = monaco.editor.createModel(code, "typescript", monaco.Uri.parse("file:///".concat(monacoId, ".tsx")));
            var editor_1 = monaco.editor.create(document.getElementById(monacoId), {
                model: model,
                theme: getTheme(),
                fontSize: getFontSize(),
                tabSize: 2,
                minimap: {
                    enabled: false,
                },
                automaticLayout: true,
            });
            editorList.push(editor_1);
            editor_1.addAction({
                id: "antd-runner",
                contextMenuGroupId: "antd-runner",
                label: getLabel("antdRunner"),
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
                run: function () {
                    runnerCode(codeBox, editor_1.getValue());
                },
            });
        }
        else {
            editorList.removeByContainerDomNodeId(monacoId);
            monacoEditorWrapper.remove();
            var monacoDemoBox = codeBox.querySelector(".code-box-demo-monaco");
            if (monacoDemoBox) {
                monacoDemoBox.remove();
            }
            var originalDemoBox = codeBox.querySelector(".code-box-demo");
            if (originalDemoBox) {
                originalDemoBox.style.display = "block";
            }
        }
        monacoSpan.classList.toggle("monaco-editor-open");
    }
    function addMonacoAction() {
        var codeBoxActions = document.querySelectorAll(".code-box-actions");
        codeBoxActions.forEach(function (item) {
            if (item.querySelector(".monaco-editor-action"))
                return;
            var span = document.createElement("span");
            span.className = "code-box-code-action monaco-editor-action";
            ReactDOM.render(React.createElement(MonacoAction), span);
            item.appendChild(span);
        });
        if (codeBoxActions.length) {
            if (observed) {
                clearInterval(observed);
            }
            observed = null;
        }
        editorList.clear();
    }
    var observed;
    function observerHistory() {
        function observe() {
            if (observed) {
                clearInterval(observed);
                observed = null;
            }
            observed = setInterval(function () {
                addMonacoAction();
            }, 1000);
        }
        function wrapHistoryState(action) {
            var raw = history[action];
            return function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var wrapper = raw.apply(this, args);
                observe();
                return wrapper;
            };
        }
        window.addEventListener("popstate", function () {
            observe();
        });
        history.pushState = wrapHistoryState("pushState");
        history.replaceState = wrapHistoryState("replaceState");
        observe();
    }
    function observerTheme() {
        var themeObserver = new MutationObserver(function (v) {
            v.forEach(function (item) {
                if (item.type === "attributes") {
                    editorList.forEach(function (editor) {
                        editor.updateOptions({
                            theme: getTheme(),
                            fontSize: getFontSize(),
                        });
                    });
                }
            });
        });
        themeObserver.observe(document.body, { attributes: true });
    }
    observerTheme();
    observerHistory();
})();
