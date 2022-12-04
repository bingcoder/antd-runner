/// <reference path="../node_modules/monaco-editor/monaco.d.ts" />
/// <reference path="../node_modules/@types/react-dom/index.d.ts" />

(function () {
  // @ts-ignore
  window.React = window.react;
  // @ts-ignore
  window.ReactDOM = window["react-dom"];
  // @ts-ignore
  window.antdIcons = window["@ant-design/icons"];

  function getTheme() {
    return document.body.dataset.theme?.includes("dark") ? "vs-dark" : "vs";
  }

  function getFontSize() {
    return document.body.dataset.theme?.includes("compact") ? 14 : 16;
  }

  const locales = {
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
  function getLabel(id: keyof typeof locales["en"]) {
    if (document.documentElement.lang === "zh") {
      return locales.zh[id];
    }
    return locales.en[id];
  }

  class EditorList {
    list: monaco.editor.IStandaloneCodeEditor[] = [];
    push(editor: monaco.editor.IStandaloneCodeEditor) {
      this.list.push(editor);
    }

    removeByContainerDomNodeId(id: string) {
      const newEditorList = [];
      for (let index = 0; index < this.list.length; index++) {
        const editor = this.list[index];
        if (editor.getContainerDomNode().id === id) {
          editor.getModel()?.dispose();
          editor.dispose();
        } else {
          newEditorList.push(editor);
        }
      }
      this.list = newEditorList;
    }

    clear() {
      this.list.forEach((editor) => {
        const containerDomNodeId = editor.getContainerDomNode().id;
        if (!document.getElementById(containerDomNodeId)) {
          this.removeByContainerDomNodeId(containerDomNodeId);
        }
      });
    }

    forEach(cb: (editor: monaco.editor.IStandaloneCodeEditor) => void) {
      this.list.forEach(cb);
    }
  }

  const MonacoAction = () => {
    const [open, setOpen] = React.useState(false);
    const handleOpen = (e: any) => {
      handleMonacoEditorClick(e.nativeEvent.target.parentElement);
      setOpen((o) => !o);
    };
    return React.createElement(
      // @ts-ignore
      antd.Tooltip,
      {
        title: getLabel(open ? "closeEditor" : "openEditor"),
      },
      React.createElement(
        "span",
        { onClick: handleOpen },
        // @ts-ignore
        React.createElement(antdIcons.LaptopOutlined)
      )
    );
  };

  const editorList = new EditorList();

  function handleError(rootSelector: string, error: any) {
    const root = document.querySelector(rootSelector);
    if (root) {
      ReactDOM.render(
        // @ts-ignore
        React.createElement(antd.Alert, {
          message: error.message || "something error",
          type: "error",
          showIcon: true,
        }),
        root
      );
    }
  }

  function runnerCode(codeBox: HTMLElement, code: string) {
    const demoBox = Array.from(
      codeBox.querySelectorAll<HTMLElement>(".code-box-demo")
    ).find((item) => !item.classList.contains("code-box-demo-monaco"));
    let monacoDemoBox = codeBox.querySelector<HTMLDivElement>(
      ".code-box-demo-monaco"
    );
    if (!demoBox) return;
    demoBox.style.display = "none";
    if (!monacoDemoBox) {
      monacoDemoBox = document.createElement("div");
      monacoDemoBox.className = "code-box-demo code-box-demo-monaco";
      // TODO 是否都有demoBox
      codeBox.insertBefore(monacoDemoBox, demoBox);
    }
    const rootSelector = `#${codeBox.id} > .code-box-demo-monaco`;
    try {
      // @ts-ignore
      const output = Babel.transform(code, {
        presets: ["tsx-antd-online"],
      });
      const scriptId = `monaco-${codeBox.id}-script`;
      let runnerScript = document.querySelector<HTMLScriptElement>(scriptId);
      if (runnerScript) {
        runnerScript.remove();
      }
      runnerScript = document.createElement("script");
      runnerScript.id = scriptId;
      runnerScript.type = "text/javascript";
      runnerScript.appendChild(
        document.createTextNode(
          `(function () {
            try {
              ${output.code};
              ReactDOM.render(
                React.createElement(
                  antd.ConfigProvider,
                  {
                    locale: antdLocalZh,
                  },
                  React.createElement(antdRunnerApp, null)
                ),
                document.querySelector('${rootSelector}')
              );
            } catch (error) {
              console.log(error.message, error);
              const root = document.querySelector(rootSelector);
              if (root) {
                ReactDOM.render(
                  // @ts-ignore
                  React.createElement(antd.Alert, {
                    message: error.message || 'something error',
                    type: 'error',
                    showIcon: true,
                  }),
                  root
                );
              }
            }
          })();`
        )
      );
      document.body.appendChild(runnerScript);
    } catch (error) {
      handleError(rootSelector, error);
    }
  }

  function findCodeBox(dom: HTMLElement) {
    let codeBox = dom;
    while (dom.parentElement && !codeBox.classList.contains("code-box")) {
      codeBox = codeBox.parentElement!;
    }
    if (codeBox === dom) return null;
    return codeBox;
  }

  function handleMonacoEditorClick(e: HTMLElement) {
    const monacoSpan = e;
    const codeBox = findCodeBox(monacoSpan);
    if (!codeBox?.id) return;
    let monacoEditorWrapper = codeBox.querySelector(".monaco-editor-wrapper")!;
    const monacoId = `monaco-${codeBox.id}`;
    if (!monacoEditorWrapper) {
      monacoEditorWrapper = document.createElement("section");
      monacoEditorWrapper.classList.add("monaco-editor-wrapper");
      codeBox.appendChild(monacoEditorWrapper);
      const code =
        codeBox.querySelector<HTMLPreElement>(".language-tsx")?.innerText || "";
      monacoEditorWrapper.innerHTML = `<div id="${monacoId}" style="height: 500px"></div>`;
      const model = monaco.editor.createModel(
        code,
        "typescript",
        monaco.Uri.parse(`file:///${monacoId}.tsx`)
      );
      const editor = monaco.editor.create(document.getElementById(monacoId)!, {
        model,
        theme: getTheme(),
        fontSize: getFontSize(),
        tabSize: 2,
        minimap: {
          enabled: false,
        },
        automaticLayout: true,
      });
      editorList.push(editor);

      editor.addAction({
        id: "antd-runner",
        contextMenuGroupId: "antd-runner",
        label: getLabel("antdRunner"),
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run() {
          runnerCode(codeBox, editor.getValue());
        },
      });
    } else {
      editorList.removeByContainerDomNodeId(monacoId);
      monacoEditorWrapper.remove();
      const monacoDemoBox = codeBox.querySelector<HTMLDivElement>(
        ".code-box-demo-monaco"
      );
      if (monacoDemoBox) {
        monacoDemoBox.remove();
      }
      const originalDemoBox =
        codeBox.querySelector<HTMLDivElement>(".code-box-demo");
      if (originalDemoBox) {
        originalDemoBox.style.display = "block";
      }
    }
    monacoSpan.classList.toggle("monaco-editor-open");
  }

  function addMonacoAction() {
    const codeBoxActions = document.querySelectorAll(".code-box-actions");
    codeBoxActions.forEach((item) => {
      if (item.querySelector(".monaco-editor-action")) return;
      const span = document.createElement("span");
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

  let observed: number | null;

  function observerHistory() {
    function observe() {
      if (observed) {
        clearInterval(observed);
        observed = null;
      }
      observed = setInterval(() => {
        addMonacoAction();
      }, 1000) as unknown as number;
    }

    function wrapHistoryState(
      action: Extract<keyof History, "pushState" | "replaceState">
    ) {
      const raw = history[action];
      return function (...args: any) {
        // @ts-ignore
        const wrapper = raw.apply(this, args);
        observe();
        return wrapper;
      };
    }
    window.addEventListener("popstate", () => {
      observe();
    });
    history.pushState = wrapHistoryState("pushState");
    history.replaceState = wrapHistoryState("replaceState");
    observe();
  }

  // 监听主题颜色变化
  function observerTheme() {
    const themeObserver = new MutationObserver((v) => {
      v.forEach((item) => {
        if (item.type === "attributes") {
          editorList.forEach((editor) => {
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

  // 初始化
  observerTheme();
  observerHistory();
})();
