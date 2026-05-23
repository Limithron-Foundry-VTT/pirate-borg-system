module.exports = {
  branches: ["main"],
  tagFormat: "v${version}",
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "angular",
        releaseRules: [
          { breaking: true, release: "major" },
          { type: "feat", release: "minor" },
          { type: "fix", release: "patch" },
          { type: "perf", release: "patch" },
          { type: "build", scope: "deps", release: "patch" },
        ],
        parserOpts: {
          noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES", "BREAKING"],
        },
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "angular",
        presetConfig: {
          types: [
            { type: "feat", section: "New Features" },
            { type: "fix", section: "Bug Fixes" },
            { type: "perf", section: "Performance Improvements" },
            { type: "revert", section: "Reverts" },
            { type: "docs", section: "Documentation" },
            { type: "ci", section: "Developer Tooling" },
            { type: "build", section: "Developer Tooling" },
            { type: "style", hidden: true },
            { type: "chore", hidden: true },
            { type: "refactor", hidden: true },
            { type: "test", hidden: true },
            { type: "build", hidden: true },
            { type: "ci", hidden: true },
          ],
        },
        writerOpts: {
          commitGroupsSort: (a, b) => {
            const order = ["New Features", "Bug Fixes", "Performance Improvements", "Documentation", "Reverts", "Developer Tooling"];
            const ai = order.indexOf(a.title);
            const bi = order.indexOf(b.title);
            return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
          },
          commitsSort: ["scope", "subject"],
          // Custom mainTemplate to produce the "## What's Changed" header, --- between sections, and a Full Changelog footer
          // (the angular preset's default emits "# [version](compare) (date)" which is redundant on the GitHub Releases page).
          mainTemplate: [
            "## What's Changed",
            "",
            "{{#each commitGroups}}{{#unless @first}}---",
            "",
            "{{/unless}}### {{title}}",
            "",
            "{{#each commits}}",
            "{{> commit root=@root}}",
            "{{/each}}",
            "",
            "{{/each}}{{#if noteGroups.length}}---",
            "",
            "{{#each noteGroups}}### {{title}}",
            "",
            "{{#each notes}}",
            "* {{#if commit.scope}}**{{commit.scope}}:** {{/if}}{{text}}",
            "{{/each}}",
            "",
            "{{/each}}{{/if}}{{#if previousTag}}**Full Changelog**: {{@root.host}}/{{@root.owner}}/{{@root.repository}}/compare/{{previousTag}}...{{currentTag}}",
            "{{/if}}",
          ].join("\n"),
        },
      },
    ],
    [
      "@semantic-release/npm",
      {
        npmPublish: false,
      },
    ],
    [
      "./tasks/semantic-release/foundry-system-plugin.js",
      {
        githubUrl: process.env.GITHUB_SERVER_URL || "https://github.com",
        repositoryPath: process.env.GITHUB_REPOSITORY || "Limithron-Foundry-VTT/pirate-borg-system",
      },
    ],
    [
      "@semantic-release/github",
      {
        assets: [
          {
            path: "system.zip",
            label: "FoundryVTT System (v${nextRelease.version})",
          },
          {
            path: "system.json",
            label: "System Manifest (v${nextRelease.version})",
          },
        ],
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["package.json", "package-lock.json", "README.md", "system.json"],
        message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ],
};
