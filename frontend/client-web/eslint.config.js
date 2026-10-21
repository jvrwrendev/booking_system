import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "dist-node", "node_modules", ".kilo"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Store/context files intentionally co-locate the provider component
      // with its hook and helper functions.
      "react-refresh/only-export-components": "off",
      // The shadcn idiom is `Props extends React.XHTMLAttributes<T>` with no
      // extra members; the rule flags the empty interface.
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // The app renders through the Radix primitives, so a handful of
      // `any` casts are intentional escape hatches around untyped refs.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
