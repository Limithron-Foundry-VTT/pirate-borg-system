export function registerFonts() {
  Object.assign(CONFIG.fontDefinitions, {
    Alegreya: {
      editor: true,
      fonts: [
        { urls: ["systems/pirateborg/fonts/Alegreya/Alegreya-VariableFont_wght.ttf"] },
        { urls: ["systems/pirateborg/fonts/Alegreya/Alegreya-Italic-VariableFont_wght.ttf"], style: "italic" },
      ],
    },
    IM_Fell_English: {
      editor: true,
      fonts: [
        { urls: ["systems/pirateborg/fonts/IM_Fell_English/IMFellEnglish-Regular.ttf"] },
        { urls: ["systems/pirateborg/fonts/IM_Fell_English/IMFellEnglish-Italic.ttf"], style: "italic" },
      ],
    },
    Leander: {
      editor: true,
      fonts: [{ urls: ["systems/pirateborg/fonts/leander/Leander.ttf"] }],
    },
    "Roman Antique": {
      editor: true,
      fonts: [
        { urls: ["systems/pirateborg/fonts/Roman Antique Regular.ttf"] },
        { urls: ["systems/pirateborg/fonts/RomanAntique-Italic.ttf"], style: "italic" },
      ],
    },
  });
}
