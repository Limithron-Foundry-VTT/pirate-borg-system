export const configureHandlebar = () => {
  // Handlebars helpers
  // TODO: registering a helper named "eq" breaks filepicker
  Handlebars.registerHelper("ifEq", function (arg1, arg2, options) {
    // TODO: verify whether we want == or === for this equality check
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
    // TODO: verify whether we want == or === for this equality check
    return arg1 != arg2 ? options.fn(this) : options.inverse(this);
  });
  Handlebars.registerHelper("ifPrint", function (cond, v1) {
    return cond ? v1 : "";
  });
  Handlebars.registerHelper("ifPrintElse", function (cond, v1, v2) {
    return cond ? v1 : v2;
  });

  Handlebars.registerHelper("eq", function () {
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.every(function (expression) {
      return args[0] === expression;
    });
  });

  /**
   * Formats a Roll as either the total or x + y + z = total if the roll has multiple terms.
   */
  Handlebars.registerHelper("xtotal", (roll) => {
    // collapse addition of negatives into just subtractions
    // e.g., 15 +  - 1 => 15 - 1
    // Also: apparently roll.result uses 2 spaces as separators?
    // We replace both 2- and 1-space varieties
    const result = roll.result.replace("+  -", "-").replace("+ -", "-");

    // roll.result is a string of terms. E.g., "16" or "1 + 15".
    if (result !== roll.total.toString()) {
      return `${result} = ${roll.total}`;
    } else {
      return result;
    }
  });

  loadTemplates([
    "systems/pirateborg/templates/actor/common/actor-equipment-list.html",
    "systems/pirateborg/templates/actor/common/actor-item-button.html",
    "systems/pirateborg/templates/actor/common/dynamic-list.html",
    "systems/pirateborg/templates/actor/common/static-list.html",
    "systems/pirateborg/templates/actor/common/static-list-item.html",
  ]);
};
