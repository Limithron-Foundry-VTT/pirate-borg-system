export const configureHandlebar = () => {
  Handlebars.registerHelper("ifEq", function (arg1, arg2, options) {
    return arg1 == arg2 ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("ifGe", function (arg1, arg2, options) {
    return arg1 >= arg2 ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("ifGt", function (arg1, arg2, options) {
    return arg1 > arg2 ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("ifLe", function (arg1, arg2, options) {
    return arg1 <= arg2 ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("ifLt", function (arg1, arg2, options) {
    return arg1 < arg2 ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("ifNe", function (arg1, arg2, options) {
    return arg1 != arg2 ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("ifPrint", (cond, v1) => (cond ? v1 : ""));

  Handlebars.registerHelper("ifPrintElse", (cond, v1, v2) => (cond ? v1 : v2));

  Handlebars.registerHelper("eq", function () {
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.every((expression) => args[0] === expression);
  });

  Handlebars.registerHelper("wysiwig", function (options) {
    if (game.release.generation >= 10) {
      const content = options.hash.content;
      delete options.hash.content;
      return HandlebarsHelpers.editor(content, options);
    } else {
      const documents = options.hash.documents !== false;
      const owner = Boolean(options.hash.owner);
      const rollData = options.hash.rollData;
      options.hash.content = TextEditor.enrichHTML(options.hash.content, { secrets: owner, documents, rollData, async: false });
      return HandlebarsHelpers.editor(options);
    }
  });

  /**
   * Formats a Roll as either the total or x + y + z = total if the roll has multiple terms.
   */
  Handlebars.registerHelper("xtotal", (roll) => {
    const result = roll.result.replace("+  -", "-").replace("+ -", "-");
    if (result !== roll.total.toString()) {
      return `${result} = ${Math.round(roll.total)}`;
    }
    return result;
  });

  loadTemplates([
    "systems/pirateborg/templates/actor/common/actor-equipment-list.html",
    "systems/pirateborg/templates/actor/common/actor-item-button.html",
    "systems/pirateborg/templates/actor/common/dynamic-list.html",
    "systems/pirateborg/templates/actor/common/static-list.html",
    "systems/pirateborg/templates/actor/common/static-list-item.html",
  ]);
};
