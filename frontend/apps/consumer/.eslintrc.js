// Legacy eslintrc resolves `extends` by module path, not by package exports, so
// the shared config is required directly rather than by its export name.
const shared = require("@cfc/config/eslint-app.js");

module.exports = {
  ...shared,
  parserOptions: { project: "./tsconfig.json", tsconfigRootDir: __dirname },

  // `src/app/(home)/**` is a VERBATIM TRANSCRIPTION of the prototype the
  // client approved, not code written against this repo's conventions. The
  // handoff brief is explicit that every character of copy and every CSS value
  // is fixed, so the usual fix for these rules - rewriting the source - is not
  // available here.
  //
  // Deliberately narrow: this exempts one directory from three rules. Every
  // other file in the consumer app, and both other apps, are untouched.
  overrides: [
    ...(shared.overrides ?? []),
    {
      // `interactions.js` is plain ES5 browser JavaScript, not TypeScript, so
      // the type-aware parser cannot handle it - it is not in tsconfig, and
      // adding it there would pull untyped JS into the typecheck.
      files: ["src/app/(home)/**/*.js"],
      parser: "espree",
      parserOptions: { ecmaVersion: 2020, sourceType: "module", project: null },
      rules: {
        "@typescript-eslint/no-unused-vars": "off",
        // The shared config sets `consistent-type-imports` at TOP LEVEL, so it
        // applies to every file including these. It is a type-aware rule, and
        // with espree (no `project`) it does not just fail to run - it throws,
        // which fails the whole lint. Off here for the same reason the parser
        // is swapped: this is plain browser JS with no imports to type.
        "@typescript-eslint/consistent-type-imports": "off",
      },
    },
    {
      files: ["src/app/(home)/**/*.tsx"],
      rules: {
        // The approved copy contains real typographic quotes and apostrophes
        // inside prose ("the price you pay", "we'll call you back"). Escaping
        // them as &quot;/&apos; would change the source the client signed off
        // and makes the copy unreadable in the editor. React escapes text
        // nodes correctly regardless; this rule is a style preference.
        "react/no-unescaped-entities": "off",
        // The house rule bans raw hex so colours resolve through tokens. Here
        // it fires on `&#8377;` (the rupee entity, read as a hex literal) and
        // on the hex fills inside the inline SVG illustration, which is a
        // single piece of transcribed artwork rather than themed UI.
        "no-restricted-syntax": "off",
      },
    },
  ],
};
