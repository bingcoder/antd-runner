"use strict";
(function () {
    window.React = window.react;
    window.ReactDOM = window['react-dom'];
    window.AntdIcons = window['@ant-design/icons'];
    function getTheme() {
        var _a;
        return ((_a = document.body.dataset.theme) === null || _a === void 0 ? void 0 : _a.includes('dark')) ? 'vs-dark' : 'vs';
    }
    function getFontSize() {
        var _a;
        return ((_a = document.body.dataset.theme) === null || _a === void 0 ? void 0 : _a.includes('compact')) ? 14 : 16;
    }
    var locales = {
        zh: {
            antdRunner: '运行',
            openEditor: '打开编辑器',
            closeEditor: '关闭编辑器',
        },
        en: {
            antdRunner: 'Run',
            openEditor: 'Open Editor',
            closeEditor: 'Close Editor',
        },
    };
    function getLabel(id) {
        if (document.documentElement.lang === 'zh') {
            return locales.zh[id];
        }
        return locales.en[id];
    }
    function debounce(func, wait) {
        var timeout;
        return function () {
            var _this = this;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(function () {
                timeout = null;
                func.apply(_this, args);
            }, wait);
        };
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
    var editorList = new EditorList();
    function setTipInnerText(monacoSpan) {
        tip.querySelector('.ant-tooltip-inner').innerText =
            monacoSpan.classList.contains('monaco-editor-open')
                ? getLabel('closeEditor')
                : getLabel('openEditor');
    }
    function handleMouseenter(e) {
        var _a = e.target.getBoundingClientRect(), width = _a.width, left = _a.left, top = _a.top;
        setTipInnerText(e.target);
        tip === null || tip === void 0 ? void 0 : tip.classList.remove('ant-tooltip-hidden');
        tip.style.left = left + width / 2 + "px";
        tip.style.top = top - tip.offsetHeight + document.documentElement.scrollTop - 5 + "px";
        tip.style.transform = 'translateX(-50%)';
    }
    function handleMouseleave() {
        tip === null || tip === void 0 ? void 0 : tip.classList.add('ant-tooltip-hidden');
        tip.style.left = "0px";
        tip.style.top = "0px";
    }
    function handleError(rootSelector, error) {
        var root = document.querySelector(rootSelector);
        if (root) {
            ReactDOM.render(React.createElement(antd.Alert, {
                message: error.message || 'something error',
                type: 'error',
                showIcon: true,
            }), root);
        }
    }
    function runnerCode(codeBox, code) {
        var demoBox = Array.from(codeBox.querySelectorAll('.code-box-demo')).find(function (item) { return !item.classList.contains('code-box-demo-monaco'); });
        var monacoDemoBox = codeBox.querySelector('.code-box-demo-monaco');
        if (!demoBox)
            return;
        demoBox.style.display = 'none';
        if (!monacoDemoBox) {
            monacoDemoBox = document.createElement('div');
            monacoDemoBox.className = 'code-box-demo code-box-demo-monaco';
            codeBox.insertBefore(monacoDemoBox, demoBox);
        }
        var rootSelector = "#" + codeBox.id + " > .code-box-demo-monaco";
        try {
            var output = Babel.transform(code, {
                presets: ['tsx-antd-online'],
            });
            var scriptId = "monaco-" + codeBox.id + "-script";
            var runnerScript = document.querySelector(scriptId);
            if (runnerScript) {
                runnerScript.remove();
            }
            runnerScript = document.createElement('script');
            runnerScript.id = scriptId;
            runnerScript.type = 'text/javascript';
            runnerScript.appendChild(document.createTextNode("(function(){\n            try{\n              " + output.code + ";\n              ReactDOM.render(React.createElement(antd.ConfigProvider, {\n                locale: antdLocalZh\n              },React.createElement(antdRunnerApp, null)), document.querySelector(\"" + rootSelector + "\"))\n            }catch(error){\n              console.log(error.message, error)\n              const root = document.querySelector(rootSelector);\n              if (root) {\n                ReactDOM.render(\n                  // @ts-ignore\n                  React.createElement(antd.Alert, {\n                    message: error.message || 'something error',\n                    type: 'error',\n                    showIcon: true,\n                  }),\n                  root\n                );\n              }\n            }\n          })()"));
            document.body.appendChild(runnerScript);
        }
        catch (error) {
            handleError(rootSelector, error);
        }
    }
    function findCodeBox(dom) {
        var codeBox = dom;
        while (dom.parentElement && !codeBox.classList.contains('code-box')) {
            codeBox = codeBox.parentElement;
        }
        if (codeBox === dom)
            return null;
        return codeBox;
    }
    function handleMonacoEditorClick(e) {
        var _a;
        var monacoSpan = e.currentTarget;
        var codeBox = findCodeBox(monacoSpan);
        if (!(codeBox === null || codeBox === void 0 ? void 0 : codeBox.id))
            return;
        var monacoEditorWrapper = codeBox.querySelector('.monaco-editor-wrapper');
        var monacoId = "monaco-" + codeBox.id;
        if (!monacoEditorWrapper) {
            monacoEditorWrapper = document.createElement('section');
            monacoEditorWrapper.classList.add('monaco-editor-wrapper');
            codeBox.appendChild(monacoEditorWrapper);
            var code = ((_a = codeBox.querySelector('.language-tsx')) === null || _a === void 0 ? void 0 : _a.innerText) || '';
            monacoEditorWrapper.innerHTML = "<div id=\"" + monacoId + "\" style=\"height: 500px\"></div>";
            var model = monaco.editor.createModel(code, 'typescript', monaco.Uri.parse("file:///" + monacoId + ".tsx"));
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
                id: 'antd-runner',
                contextMenuGroupId: 'antd-runner',
                label: getLabel('antdRunner'),
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
                run: function () {
                    runnerCode(codeBox, editor_1.getValue());
                },
            });
        }
        else {
            editorList.removeByContainerDomNodeId(monacoId);
            monacoEditorWrapper.remove();
            var monacoDemoBox = codeBox.querySelector('.code-box-demo-monaco');
            if (monacoDemoBox) {
                monacoDemoBox.remove();
            }
            var originalDemoBox = codeBox.querySelector('.code-box-demo');
            if (originalDemoBox) {
                originalDemoBox.style.display = 'block';
            }
        }
        monacoSpan.classList.toggle('monaco-editor-open');
        setTipInnerText(monacoSpan);
    }
    var monacoIcon = '<svg class="monaco-icon-svg" viewBox="64 64 896 896" focusable="false" data-icon="laptop" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M956.9 845.1L896.4 632V168c0-17.7-14.3-32-32-32h-704c-17.7 0-32 14.3-32 32v464L67.9 845.1C60.4 866 75.8 888 98 888h828.8c22.2 0 37.6-22 30.1-42.9zM200.4 208h624v395h-624V208zm228.3 608l8.1-37h150.3l8.1 37H428.7zm224 0l-19.1-86.7c-.8-3.7-4.1-6.3-7.8-6.3H398.2c-3.8 0-7 2.6-7.8 6.3L371.3 816H151l42.3-149h638.2l42.3 149H652.7z"></path></svg>';
    function addMonacoAction() {
        var codeBoxActions = document.querySelectorAll('.code-box-actions');
        codeBoxActions.forEach(function (item) {
            if (item.querySelector('.monaco-editor-action'))
                return;
            var span = document.createElement('span');
            span.innerHTML = monacoIcon;
            span.className =
                'anticon anticon-laptop code-box-code-action monaco-editor-action';
            span.addEventListener('mouseenter', handleMouseenter);
            span.addEventListener('mouseleave', handleMouseleave);
            span.addEventListener('click', handleMonacoEditorClick);
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
        window.addEventListener('popstate', function () {
            observe();
        });
        history.pushState = wrapHistoryState('pushState');
        history.replaceState = wrapHistoryState('replaceState');
        observe();
    }
    function observerTheme() {
        var themeObserver = new MutationObserver(function (v) {
            v.forEach(function (item) {
                if (item.type === 'attributes') {
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
    function createTip() {
        var tooltip = document.createElement('div');
        tooltip.innerHTML = "<div><div class=\"ant-tooltip ant-tooltip-placement-top ant-tooltip-hidden\" pointer-events: none;\"><div class=\"ant-tooltip-content\"><div class=\"ant-tooltip-arrow\"><span class=\"ant-tooltip-arrow-content\"></span></div><div class=\"ant-tooltip-inner\" role=\"tooltip\"></div></div></div></div>";
        var tip = tooltip.querySelector('.ant-tooltip');
        document.body.appendChild(tooltip);
        return tip;
    }
    observerTheme();
    observerHistory();
    var tip = createTip();
})();
