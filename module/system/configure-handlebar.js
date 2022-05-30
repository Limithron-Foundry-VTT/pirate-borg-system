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
    const result = roll.result.replace("+  -", "-").replace("+ -", "-");
    if (result !== roll.total.toString()) {
      return `${result} = ${Math.round(roll.total)}`;
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
