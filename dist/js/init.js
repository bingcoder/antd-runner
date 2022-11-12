(function () {
  /** monaco-editor */
  require.config({
    paths: {
      vs:
        window.antdRunnerData.monacoEditorPath ||
        "https://cdn.bootcdn.net/ajax/libs/monaco-editor/0.34.1/min/vs",
      "vs/language/typescript/tsMode":
        window.antdRunnerData.extensionDir + "js/tsMode.js",
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
  }

  require(["vs/editor/editor.main"], function () {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      moduleResolution: 2,
      esModuleInterop: true,
      jsx: 2,
      skipLibCheck: true,
    });
    fetch(window.antdRunnerData.extensionDir + "js/declaration.json")
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

  /** moment */
  moment.defineLocale("zh-cn", {
    months:
      "一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月".split(
        "_"
      ),
    monthsShort: "1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split(
      "_"
    ),
    weekdays: "星期日_星期一_星期二_星期三_星期四_星期五_星期六".split("_"),
    weekdaysShort: "周日_周一_周二_周三_周四_周五_周六".split("_"),
    weekdaysMin: "日_一_二_三_四_五_六".split("_"),
    longDateFormat: {
      LT: "HH:mm",
      LTS: "HH:mm:ss",
      L: "YYYY/MM/DD",
      LL: "YYYY年M月D日",
      LLL: "YYYY年M月D日Ah点mm分",
      LLLL: "YYYY年M月D日ddddAh点mm分",
      l: "YYYY/M/D",
      ll: "YYYY年M月D日",
      lll: "YYYY年M月D日 HH:mm",
      llll: "YYYY年M月D日dddd HH:mm",
    },
    meridiemParse: /凌晨|早上|上午|中午|下午|晚上/,
    meridiemHour: function (hour, meridiem) {
      if (hour === 12) {
        hour = 0;
      }
      if (meridiem === "凌晨" || meridiem === "早上" || meridiem === "上午") {
        return hour;
      } else if (meridiem === "下午" || meridiem === "晚上") {
        return hour + 12;
      } else {
        // '中午'
        return hour >= 11 ? hour : hour + 12;
      }
    },
    meridiem: function (hour, minute, isLower) {
      var hm = hour * 100 + minute;
      if (hm < 600) {
        return "凌晨";
      } else if (hm < 900) {
        return "早上";
      } else if (hm < 1130) {
        return "上午";
      } else if (hm < 1230) {
        return "中午";
      } else if (hm < 1800) {
        return "下午";
      } else {
        return "晚上";
      }
    },
    calendar: {
      sameDay: "[今天]LT",
      nextDay: "[明天]LT",
      nextWeek: function (now) {
        if (now.week() !== this.week()) {
          return "[下]dddLT";
        } else {
          return "[本]dddLT";
        }
      },
      lastDay: "[昨天]LT",
      lastWeek: function (now) {
        if (this.week() !== now.week()) {
          return "[上]dddLT";
        } else {
          return "[本]dddLT";
        }
      },
      sameElse: "L",
    },
    dayOfMonthOrdinalParse: /\d{1,2}(日|月|周)/,
    ordinal: function (number, period) {
      switch (period) {
        case "d":
        case "D":
        case "DDD":
          return number + "日";
        case "M":
          return number + "月";
        case "w":
        case "W":
          return number + "周";
        default:
          return number;
      }
    },
    relativeTime: {
      future: "%s后",
      past: "%s前",
      s: "几秒",
      ss: "%d 秒",
      m: "1 分钟",
      mm: "%d 分钟",
      h: "1 小时",
      hh: "%d 小时",
      d: "1 天",
      dd: "%d 天",
      w: "1 周",
      ww: "%d 周",
      M: "1 个月",
      MM: "%d 个月",
      y: "1 年",
      yy: "%d 年",
    },
    week: {
      // GB/T 7408-1994《数据元和交换格式·信息交换·日期和时间表示法》与ISO 8601:1988等效
      dow: 1, // Monday is the first day of the week.
      doy: 4, // The week that contains Jan 4th is the first week of the year.
    },
  });
  moment.locale("zh-cn");

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
            react: "React",
            "react-dom": "ReactDOM",
            antd: "antd",
            "@ant-design/icons": "AntdIcons",
            moment: "moment",
          },
        },
      ],
    ],
  });
})();
