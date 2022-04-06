module.exports = {
  root: true,
  env: {
    es6: true
  },
  rules: {
    semi: [2, "never"],
    quotes: [
      2,
      "double",
      {
        avoidEscape: true
      }
    ],
    "comma-dangle": "off",
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        jsx: "never",
        ts: "never",
        tsx: "never"
      }
    ]
  },
  overrides: [
    {
      files: ["**/*.js"],
      extends: ["airbnb", "prettier", "plugin:prettier/recommended"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
        curly: [2, "all"]
      }
    },
    {
      files: ["**/*.ts", "**/*.tsx"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint", "jsx-a11y", "jest"],
      extends: [
        "airbnb-typescript",
        "plugin:@typescript-eslint/recommended",
        "plugin:jsx-a11y/recommended",
        "plugin:jest/recommended",
        "plugin:jest/style",
        "prettier",
        "plugin:prettier/recommended"
      ],
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        project: "tsconfig.eslint.json",
        tsconfigRootDir: __dirname
      },
      rules: {
        "prettier/prettier": ["error"],
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/consistent-type-imports": ["error"],
        "@typescript-eslint/no-non-null-assertion": "off",
        "no-plusplus": "off",
        "react/react-in-jsx-scope": "off",
        "react/jsx-curly-brace-presence": ["off"],
        "react/require-default-props": ["off"],
        curly: [2, "all"],
        "require-await": "error"
      }
    },
    {
      files: ["**/*.tsx"],
      plugins: ["react-hooks"],
      rules: {
        "@typescript-eslint/explicit-module-boundary-types": ["off"],
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn"
      }
    },
    {
      files: ["*.test.ts", "*.test.tsx", "**/testing/*.tsx"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
        "import/first": "off",
        "import/no-extraneous-dependencies": "off",
        "@typescript-eslint/no-non-null-assertion": "off"
      }
    },
    {
      files: ["*.stories.tsx"],
      rules: {
        "import/no-extraneous-dependencies": "off"
      }
    }
  ]
}
