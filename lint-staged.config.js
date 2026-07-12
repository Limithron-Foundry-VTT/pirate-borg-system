module.exports = {
  "**/*.{js,mjs,cjs}": ["prettier --write", "eslint --fix"],
  "**/*.{json,yaml,yml,html,hbs,md,css,scss,less}": ["prettier --write"],
};
