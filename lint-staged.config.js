module.exports = {
  "**/*.js": ["prettier --write", "eslint --fix"],
  "**/*.(json|yaml|yml)": ["prettier --write"],
  "**/*.(css|scss|less)": ["prettier --write"],
  "**/*.md": ["prettier --write"],
};
