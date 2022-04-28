export const setCustomEditorOptions = (options) => {
  options.relative_urls = true;
  options.skin_url = "/systems/pirateborg/css/skins/pb";
  options.skin = "pirateborg";
  options.toolbar_location = "bottom";
  options.plugins = "lists table link image save";
  options.toolbar =
    "formatselect | bold italic underline strikethrough numlist bullist image link save";
  options.menubar = false;
  options.statusbar = false;
  options.content_style =
    "@import url('https://fonts.googleapis.com/css2?family=Special+Elite&display=swap');";
};
