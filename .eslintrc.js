module.exports = {
  extends: ["airbnb-base", "plugin:prettier/recommended"],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error",
    "import/extensions": "off",
    "import/prefer-default-export": "off",
  },
};
