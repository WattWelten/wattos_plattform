module.exports = {
  // TypeScript & JavaScript files
  '**/*.{ts,tsx,js,jsx}': [
    'eslint --fix --max-warnings=0',
    'prettier --write',
  ],
  // JSON, Markdown, YAML files
  '**/*.{json,md,yml,yaml}': [
    'prettier --write',
  ],
};

