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

  Handlebars.registerHelper("eqOneOf", function () {
    const args = Array.prototype.slice.call(arguments, 1, -1);
    return args.includes(arguments[0]);
  });

  Handlebars.registerHelper("add", function (a, b) {
    return a + b;
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

  const templates = [
    "systems/pirateborg/templates/actor/common/actor-equipment-list.html",
    "systems/pirateborg/templates/actor/common/actor-item-button.html",
    "systems/pirateborg/templates/actor/common/dynamic-list.html",
    "systems/pirateborg/templates/actor/common/static-list.html",
    "systems/pirateborg/templates/actor/common/effects.html",
    "systems/pirateborg/templates/actor/common/static-list-item.html",
    "systems/pirateborg/templates/item/tab/effects.html",
  ];
  if (game.release.generation >= 13) {
    foundry.applications.handlebars.loadTemplates(templates);
  } else {
    loadTemplates(templates);
  }
};
