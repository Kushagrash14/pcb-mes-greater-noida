// src/Global/antdTheme.js
// -------------------------------------------------------------
// Centralized Ant Design theme tokens for the whole MIS app.
// Import this in main.jsx and wrap <App /> with <ConfigProvider theme={misTheme}>
// Keeps every Ant component (buttons, menus, tables, inputs...)
// visually consistent with the LoginForm you already have.
// -------------------------------------------------------------

const misTheme = {
  token: {
    colorPrimary: "#3a6d95",
    colorInfo: "#3a6d95",
    colorSuccess: "#0f9a90",
    colorWarning: "#c9820a",
    colorError: "#d1483c",
    colorTextBase: "#1b2430",
    colorBgBase: "#f4f6f9",
    colorBgContainer: "#ffffff",
    colorBgElevated: "#ffffff",
    colorBorder: "#e3e8ef",
    colorBorderSecondary: "#e3e8ef",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    borderRadius: 8,
    controlHeight: 38,
  },
  components: {
    Layout: {
        headerBg: "#ffffff",
        siderBg: "#fafbfc",
        bodyBg: "#f4f6f9",
        headerHeight: 60,
        headerPadding: "0 20px",
    },
    Menu: {
        darkItemBg: "#fafbfc",              // yaha "dark" naam hai but ab light value hai
        darkItemSelectedBg: "rgba(58,109,149,0.10)",
        darkItemColor: "#64748b",
        darkItemSelectedColor: "#1b2430",
        darkItemHoverColor: "#1b2430",
        itemBorderRadius: 8,
        itemMarginInline: 10,
    },
    Card: {
      colorBgContainer: "#0f1622",
    },
    Table: {
    headerBg: "#fafbfc",
    colorBgContainer: "#ffffff",
    },
    Input: {
    colorBgContainer: "#f4f6f9",
    },
    Select: {
    colorBgContainer: "#f4f6f9",

    },
    Button: {
      primaryShadow: "none",
    },
  },
};

export default misTheme;