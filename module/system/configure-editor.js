export const setCustomEditorOptions = (options) => {
  options.relative_urls = true;
  options.skin_url = "/systems/pirateborg/css/skins/pb";
  options.skin = "pirateborg";
  options.toolbar_location = "top";
  options.plugins = "lists table link image save";
  options.toolbar =
    "formatselect | bold italic underline strikethrough numlist bullist image link save";
  options.menubar = false;
  options.statusbar = false;
  options.content_style =
    "@import url('https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap');";
};
