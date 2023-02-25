(function () {
  /** monaco-editor */
  require.config({
    paths: {
      vs:
        window.AntdRunner.monacoEditorPath ||
        "https://cdn.bootcdn.net/ajax/libs/monaco-editor/0.34.1/min/vs",
      "vs/language/typescript/tsMode":
        window.AntdRunner.extensionDir + "js/tsMode.js",
    },
  });
  if (document.documentElement.lang === "zh") {
    require.config({
      "vs/nls": {
        availableLanguages: {
          "*": "zh-cn",
        },
      },
    });
    moment.locale("zh-cn");
  }

  require(["vs/editor/editor.main"], function () {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      moduleResolution: 2,
      esModuleInterop: true,
      jsx: 2,
      skipLibCheck: true,
    });
    fetch(window.AntdRunner.extensionDir + "js/declaration.json")
      .then(function (res) {
        return res.json();
      })
      .then(function (declaration) {
        for (var key in declaration) {
          if (Object.prototype.hasOwnProperty.call(declaration, key)) {
            var element = declaration[key];
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
              element,
              "file:///" + key
            );
          }
        }
      });
  });

  /** Babel */
  // TODO
  function transformImportUmd({ types: t }) {
    return {
      name: "transform-import-umd",
      visitor: {
        ImportDeclaration: (path, state) => {
          var _a, _b;
          const variableDeclarator = getVariableDeclarator(
            path,
            t,
            (_b =
              (_a = state.opts) === null || _a === void 0
                ? void 0
                : _a.externals) !== null && _b !== void 0
              ? _b
              : {}
          );
          if (variableDeclarator.length === 0) {
            path.remove();
          } else {
            path.replaceWith(
              t.variableDeclaration("const", variableDeclarator)
            );
          }
        },
        ExportDefaultDeclaration: (path, state) => {
          const name = path.node.declaration.name;
          path.replaceWith(
            t.variableDeclaration("const", [
              t.variableDeclarator(
                t.identifier("antdRunnerApp"),
                t.identifier(name)
              ),
            ])
          );
        },
      },
    };
  }
  function getVariableDeclarator(path, t, externals) {
    const variableDeclarator = [];
    path.node.specifiers.forEach((specifier) => {
      if (
        t.isImportDefaultSpecifier(specifier) ||
        t.isImportNamespaceSpecifier(specifier)
      ) {
        if (
          isExpectedImport(
            specifier.local.name,
            path.node.source.value,
            externals
          )
        ) {
          variableDeclarator.push(
            t.variableDeclarator(
              specifier.local,
              transferSourcePath(path.node.source.value, t, externals)
            )
          );
        }
      } else {
        variableDeclarator.push(
          t.variableDeclarator(
            specifier.local,
            t.memberExpression(
              transferSourcePath(path.node.source.value, t, externals),
              specifier.imported
            )
          )
        );
      }
    });
    return variableDeclarator;
  }
  function transferSourcePath(sourcePath, t, externals) {
    const sourceLib = Object.keys(externals).find((externalLib) =>
      sourcePath.startsWith(externalLib)
    );
    const path = sourceLib
      ? sourcePath.replace(sourceLib, externals[sourceLib])
      : sourcePath;
    const [libName, ...properties] = path.split("/");
    return properties.reduce(
      (object, property) =>
        t.memberExpression(object, t.stringLiteral(property), true),
      t.identifier(libName)
    );
  }
  function isExpectedImport(local, sourcePath, externals) {
    const isUmdExternal = externals[sourcePath] === local;
    const isRelativeModule = sourcePath.startsWith(".");
    return !(isUmdExternal || isRelativeModule);
  }

  Babel.registerPlugin("transform-import-umd", transformImportUmd);

  Babel.registerPreset("tsx-antd-online", {
    presets: [
      [
        Babel.availablePresets["typescript"],
        { allExtensions: true, isTSX: true },
      ],
      [Babel.availablePresets["react"]],
    ],
    plugins: [
      [
        Babel.availablePlugins["transform-import-umd"],
        {
          externals: {
            react: "react",
            "react-dom": "react-dom",
            antd: "antd",
            "@ant-design/icons": "@ant-design/icons",
            moment: "moment",
          },
        },
      ],
    ],
  });
})();
