/// <reference path="../node_modules/monaco-editor/monaco.d.ts" />
/// <reference path="../node_modules/@types/react-dom/index.d.ts" />

(function () {
  // @ts-ignore
  window.React = window.react;
  // @ts-ignore
  window.ReactDOM = window["react-dom"];
  // @ts-ignore
  window.AntdIcons = window["@ant-design/icons"];

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

  const editorList = new EditorList();

  function setTipInnerText(monacoSpan: HTMLSpanElement) {
    tip.querySelector<HTMLSpanElement>(".ant-tooltip-inner")!.innerText =
      monacoSpan.classList.contains("monaco-editor-open")
        ? getLabel("closeEditor")
        : getLabel("openEditor");
  }

  function handleMouseenter(e: MouseEvent) {
    const { width, left, top } = (
      e.target as HTMLSpanElement
    ).getBoundingClientRect();
    setTipInnerText(e.target as HTMLSpanElement);
    tip?.classList.remove("ant-tooltip-hidden");
    tip.style.left = `${left + width / 2}px`;
    tip.style.top = `${
      top - tip.offsetHeight + document.documentElement.scrollTop - 5
    }px`;
    tip.style.transform = "translateX(-50%)";
  }

  function handleMouseleave() {
    tip?.classList.add("ant-tooltip-hidden");
    tip.style.left = `0px`;
    tip.style.top = `0px`;
  }

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

  function handleMonacoEditorClick(e: MouseEvent) {
    const monacoSpan = e.currentTarget as HTMLElement;
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
    setTipInnerText(monacoSpan);
  }

  const monacoIcon =
    '<svg class="monaco-icon-svg" viewBox="64 64 896 896" focusable="false" data-icon="laptop" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M956.9 845.1L896.4 632V168c0-17.7-14.3-32-32-32h-704c-17.7 0-32 14.3-32 32v464L67.9 845.1C60.4 866 75.8 888 98 888h828.8c22.2 0 37.6-22 30.1-42.9zM200.4 208h624v395h-624V208zm228.3 608l8.1-37h150.3l8.1 37H428.7zm224 0l-19.1-86.7c-.8-3.7-4.1-6.3-7.8-6.3H398.2c-3.8 0-7 2.6-7.8 6.3L371.3 816H151l42.3-149h638.2l42.3 149H652.7z"></path></svg>';
  function addMonacoAction() {
    const codeBoxActions = document.querySelectorAll(".code-box-actions");
    codeBoxActions.forEach((item) => {
      if (item.querySelector(".monaco-editor-action")) return;
      const span = document.createElement("span");
      span.innerHTML = monacoIcon;
      span.className =
        "anticon anticon-laptop code-box-code-action monaco-editor-action";
      span.addEventListener("mouseenter", handleMouseenter);
      span.addEventListener("mouseleave", handleMouseleave);
      span.addEventListener("click", handleMonacoEditorClick);
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

  /** 创建 toolTip */
  function createTip() {
    const tooltip = document.createElement("div");
    tooltip.innerHTML = `<div><div class="ant-tooltip ant-tooltip-placement-top ant-tooltip-hidden" pointer-events: none;"><div class="ant-tooltip-content"><div class="ant-tooltip-arrow"><span class="ant-tooltip-arrow-content"></span></div><div class="ant-tooltip-inner" role="tooltip"></div></div></div></div>`;
    const tip = tooltip.querySelector<HTMLSpanElement>(".ant-tooltip")!;
    document.body.appendChild(tooltip);
    return tip;
  }

  // 初始化
  observerTheme();
  observerHistory();

  const tip = createTip();
})();
