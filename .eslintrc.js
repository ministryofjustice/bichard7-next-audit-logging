module.exports = {
  root: true,
  env: {
    es6: true,
    jest: true
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
    "comma-dangle": "off"
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
      files: ["**/*.ts"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint", "jest"],
      extends: [
        "airbnb-typescript",
        "plugin:@typescript-eslint/recommended",
        "plugin:jest/recommended",
        "plugin:jest/style",
        "prettier",
        "plugin:prettier/recommended"
      ],
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        project: "tsconfig.json",
        tsconfigRootDir: __dirname
      },
      rules: {
        "prettier/prettier": ["error"],
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/consistent-type-imports": ["error"],
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_+$", varsIgnorePattern: "^_+$" }],
        "no-plusplus": "off",
        curly: [2, "all"],
        "require-await": "error"
      }
    },
    {
      files: ["*.test.ts"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
        "import/first": "off",
        "import/no-extraneous-dependencies": "off",
        "@typescript-eslint/no-non-null-assertion": "off"
      }
    }
  ]
}
