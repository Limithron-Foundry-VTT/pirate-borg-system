/**
 * Configure the text editor options based on Foundry version.
 * Uses ProseMirror for Foundry v13+ (with secret blocks, blockquotes, etc.)
 * Falls back to TinyMCE for earlier versions.
 *
 * @param {Object} options - Editor options object to configure
 */
export const configureEditor = (options) => {
  // Use ProseMirror for Foundry v13+ to enable advanced features like secret blocks
  if (game.release.generation >= 13) {
    configureProseMirrorEditor(options);
  } else {
    configureTinyMCEEditor(options);
  }
};

/**
 * Configure ProseMirror editor options for Foundry v13+
 * ProseMirror provides secret blocks, blockquotes, code blocks, and better formatting
 *
 * @param {Object} options - Editor options object to configure
 */
const configureProseMirrorEditor = (options) => {
  options.engine = "prosemirror";
  options.collaborate = false;
};

/**
 * Configure TinyMCE editor options for Foundry v12 and earlier
 *
 * @param {Object} options - Editor options object to configure
 */
const configureTinyMCEEditor = (options) => {
  options.relative_urls = true;
  options.skin_url = "/systems/pirateborg/css/skins/pb";
  options.skin = "pirateborg";
  options.toolbar_location = "top";
  options.plugins = "lists table link image save";
  options.toolbar = "formatselect | bold italic underline strikethrough numlist bullist image link save";
  options.menubar = false;
  options.statusbar = false;
  options.content_style =
    "@import url('https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap');";
};
