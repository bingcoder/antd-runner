import antdLocalZh from "antd/es/locale/zh_CN";

declare global {
  interface Window {
    react: typeof import("react");
    "react-dom": typeof import("react-dom");
    "@ant-design/icons": typeof import("@ant-design/icons");
    Babel: any;
    moment: typeof import("moment");
    AntdRunner: {
      monacoEditorPath?: string;
      extensionDir?: string;
      antdLocalZh?: typeof antdLocalZh;
    };
  }
}
