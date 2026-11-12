// Legacy eslintrc resolves `extends` by module path, not by package exports, so
// the shared config is required directly rather than by its export name.
module.exports = {
  ...require("@cfc/config/eslint-app.js"),
  parserOptions: { project: "./tsconfig.json", tsconfigRootDir: __dirname },
};
