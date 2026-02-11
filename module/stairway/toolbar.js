/**
 * Stairways Implementation for Pirate Borg System
 * Based on the Stairways module by Simon Wörner (SWW13)
 * Licensed under MIT License - see LICENSE-MIT.txt
 */

export const MODE_STAIRWAY = "stairway";

export const injectControls = (controls) => {
  console.log("Pirate Borg Stairways | injectControls called, controls:", controls);
  
  // Determine wall's position in the top level controls
  const wallOrder = controls.walls?.order ?? 50;
  console.log("Pirate Borg Stairways | wallOrder:", wallOrder);

  // Increase order of other controls to place stairways in the position after walls
  for (const key in controls) {
    const val = controls[key];
    if (val?.order > wallOrder) val.order++;
  }

  // Create and add the stairways control
  controls.stairways = {
    name: "stairways",
    title: "STAIRWAYS.LayerTitle",
    layer: "stairways",
    icon: "fa-solid fa-stairs",
    visible: game.user.isGM,
    order: wallOrder + 1,
    onChange: (event, active) => {
      console.log("Stairways control onChange:", { event, active, stairwaysLayer: canvas.stairways });
      if (active) canvas.stairways?.activate();
    },
    onToolChange: () => {
      canvas.stairways?.setAllRenderFlags?.({ refreshState: true });
    },
    activeTool: MODE_STAIRWAY,
    tools: {
      stairway: {
        name: MODE_STAIRWAY,
        title: "STAIRWAYS.ToolCreate",
        icon: "fa-solid fa-stairs",
        onChange: () => {
          console.log("Stairway tool selected");
        },
      },
      disabled: {
        name: "disabled",
        title: "STAIRWAYS.ToolDisable",
        icon: "fa-solid fa-lock",
        toggle: true,
        active: !!canvas?.stairways?._disabled,
        onChange: (toggled) => {
          canvas.stairways._disabled = toggled;
        },
      },
      hidden: {
        name: "hidden",
        title: "STAIRWAYS.ToolHide",
        icon: "fa-solid fa-eye-slash",
        toggle: true,
        active: !!canvas?.stairways?._hidden,
        onChange: (toggled) => {
          canvas.stairways._hidden = toggled;
        },
      },
      animate: {
        name: "animate",
        title: "STAIRWAYS.ToolAnimate",
        icon: "fa-solid fa-film",
        toggle: true,
        active: !!canvas?.stairways?._animate,
        onChange: (toggled) => {
          canvas.stairways._animate = toggled;
        },
      },
      clear: {
        name: "clear",
        title: "STAIRWAYS.ToolClear",
        icon: "fa-solid fa-trash",
        onChange: () => canvas.stairways?.deleteAll(),
        button: true,
      },
    },
  };
  
  console.log("Pirate Borg Stairways | Added stairways control:", controls.stairways);
  console.log("Pirate Borg Stairways | All controls:", Object.keys(controls));
};
