const editorStateCache = new Map();

const getSheetKey = (sheet) => sheet?.document?.uuid ?? sheet?.object?.uuid ?? sheet?.actor?.uuid ?? sheet?.item?.uuid ?? "unknown-sheet";

const getStateEntry = (sheet) => editorStateCache.get(getSheetKey(sheet)) ?? { target: null, draft: "" };

const setStateEntry = (sheet, entry) => editorStateCache.set(getSheetKey(sheet), entry);

/**
 * @param {Application} sheet
 * @param {string} target
 * @param {string} fallback
 * @returns {string}
 */
export const getCachedEditorDraft = (sheet, target, fallback = "") => {
  const entry = getStateEntry(sheet);
  if (entry.target === target && typeof entry.draft === "string") return entry.draft;
  return fallback;
};

/**
 * @param {Application} sheet
 * @param {string} target
 * @param {string} draft
 */
export const setCachedEditorDraft = (sheet, target, draft) => {
  setStateEntry(sheet, { target, draft: draft ?? "" });
};

/**
 * @param {Application} sheet
 */
export const clearCachedEditorDraft = (sheet) => {
  editorStateCache.delete(getSheetKey(sheet));
};

const addCancelButton = (sheet, editor, menu) => {
  if (!menu || menu.querySelector(".pb-cancel-button")) return;
  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "pb-cancel-button";
  cancelBtn.title = game.i18n.localize("PB.Cancel");
  cancelBtn.innerHTML = '<i class="fas fa-times"></i>';
  cancelBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    sheet._editingDescriptionTarget = null;
    clearCachedEditorDraft(sheet);
    sheet.render();
  });
  menu.appendChild(cancelBtn);
};

/**
 * Wire view/edit ProseMirror behavior for description editors.
 * @param {Application} sheet
 * @param {JQuery<HTMLElement>} html
 */
export const bindProseMirrorDescriptionEditor = (sheet, html) => {
  html
    .find(".pb-edit-button")
    .off("click.pbDescription")
    .on("click.pbDescription", (event) => {
      const wrapper = $(event.currentTarget).closest(".pb-editor-wrapper");
      const target = wrapper.data("target");
      const source = wrapper.data("source") ?? "";
      sheet._editingDescriptionTarget = target;
      setCachedEditorDraft(sheet, target, source);
      sheet.render();
    });

  html.find("prose-mirror").each((_, editor) => {
    const target = editor.getAttribute("name");
    const initialValue = editor.getAttribute("value") ?? "";
    if (target && !getCachedEditorDraft(sheet, target, "").length) {
      setCachedEditorDraft(sheet, target, initialValue);
    }

    const observeMenu = () => {
      const menu = editor.querySelector("menu");
      if (menu) addCancelButton(sheet, editor, menu);
      return !!menu;
    };

    if (!observeMenu()) {
      const observer = new MutationObserver((_mutations, obs) => {
        if (observeMenu()) obs.disconnect();
      });
      observer.observe(editor, { childList: true, subtree: true });
    }

    const syncDraft = () => {
      if (!target) return;
      const value = editor.value ?? editor.getAttribute("value") ?? "";
      setCachedEditorDraft(sheet, target, value);
    };

    editor.addEventListener("input", syncDraft);
    editor.addEventListener("change", syncDraft);

    editor.addEventListener("save", () => {
      syncDraft();
      sheet._editingDescriptionTarget = null;
      clearCachedEditorDraft(sheet);
      sheet.submit();
    });
  });
};
