module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [1, "always", ["build", "chore", "ci", "docs", "feat", "fix", "perf", "refactor", "revert", "style", "test", "tweak"]],
    "body-max-line-length": [1, "always", 100],
    "scope-empty": [2, "never"],
  },
};
