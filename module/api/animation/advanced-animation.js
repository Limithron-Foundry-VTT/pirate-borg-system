import { playAdvancedAnimation } from "./animation.js";
import { getSystemFlag, getTokenRotation, getTokenScale, getTokenWidth } from "../utils.js";

export const ADVANCED_ANIMATION_TYPE = {
  ITEM: "advanced-animation-item",
  HEAL: "advanced-animation-heal",
  TAKE_DAMAGE: "advanced-animation-take-damage",
  INFLICT_DAMAGE: "advanced-animation-inflict-damage",
  DEFEND: "advanced-animation-defend",
  BROADSIDES: "advanced-animation-broadsides",
  SMALLARMS: "advanced-animation-smallarms",
  RAM: "advanced-animation-ram",
  COME_ABOUT: "advanced-animation-come-about",
  FULL_SAIL: "advanced-animation-full-sail",
  REPAIR: "advanced-animation-repair",
  BROKEN: "advanced-animation-broken",
  SPELL: "advanced-animation-spell",
  MYSTICAL_MISHAP: "advanced-animation-mystical-mishap",
  STARVATION: "advanced-animation-starvation",
  INFECTED: "advanced-animation-infected",
  INVOKE_RELIC: "advanced-animation-invoke-relic",
  TEST_RELIC: "advanced-animation-test-relic",
  INVOKE_RITUAL: "advanced-animation-invoke-ritual",
  WEIGH_ANCHOR: "advanced-animation-weigh-anchor",
  DROP_ANCHOR: "advanced-animation-drop-anchor",
  SINKING: "advanced-animation-sinking",
  SING_SHANTY: "advanced-animation-sing-shanty",
};

export const playBroadsidesAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimation([outcome.initiatorToken, outcome.targetToken], async (initiatorToken, targetToken) => {
    new Sequence()
      .effect("jb2a.bullet.02.orange")
      .missed(outcome.isFailure)
      .atLocation(initiatorToken)
      .stretchTo(targetToken)
      .randomizeMirrorY()
      .name("bullet")
      //
      .effect("jb2a.smoke.puff.side.grey")
      .atLocation(initiatorToken)
      .rotateTowards(targetToken)
      .scale(0.4)
      //
      .effect("jb2a.explosion.01.orange")
      .playIf(outcome.isSuccess)
      .atLocation(targetToken)
      .randomRotation()
      .delay(200)
      .scale(outcome.isCriticalSuccess ? 2 : 0.5)
      //
      .effect("jb2a.explosion.01.orange")
      .playIf(outcome.isFumble)
      .atLocation(initiatorToken)
      .randomRotation()
      .delay(200)
      .scale(0.5)
      //
      .effect("jb2a.smoke.puff.centered.grey")
      .playIf(outcome.isSuccess)
      .atLocation(targetToken)
      .randomRotation()
      .scale(outcome.isCriticalSuccess ? 2 : 1)
      //
      .effect("jb2a.liquid.splash.blue")
      .playIf(outcome.isFailure)
      .atLocation("bullet")
      .randomRotation()
      .belowTokens()
      .delay(200)
      .scale(0.2)
      .opacity(0.5)
      //
      .play();
  });
};

export const playSmallarmsAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimation([outcome.initiatorToken, outcome.targetToken], async (initiatorToken, targetToken) => {
    new Sequence()
      .effect("jb2a.bullet.01.orange")
      .missed(outcome.isFailure)
      .atLocation(initiatorToken)
      .stretchTo(targetToken)
      .repeats(outcome.isCriticalSuccess ? 3 : 1, 200, 500)
      .randomizeMirrorY()
      .scale(0.6)
      .name("bullet")
      //
      .effect("jb2a.smoke.puff.side.grey")
      .atLocation(initiatorToken)
      .rotateTowards(targetToken)
      .scale(0.2)
      //
      .effect("jb2a.impact.007.orange")
      .playIf(outcome.isSuccess)
      .atLocation(targetToken)
      .randomRotation()
      .delay(500)
      .repeats(outcome.isCriticalSuccess ? 3 : 1, 200, 500)
      .scale(0.2)
      //
      .effect("jb2a.smoke.puff.centered.grey")
      .playIf(outcome.isSuccess)
      .atLocation(targetToken)
      .randomRotation()
      .repeats(outcome.isCriticalSuccess ? 3 : 1, 200, 500)
      .scale(0.3)
      //
      .effect("jb2a.liquid.splash.blue")
      .playIf(outcome.isFailure)
      .atLocation("bullet")
      .randomRotation()
      .delay(200)
      .belowTokens()
      .scale(0.1)
      .opacity(0.5)
      //
      .play();
  });
};

export const playRamAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimation([outcome.targetToken], async (targetToken) => {
    new Sequence()
      .effect("jb2a.impact.ground_crack.still_frame")
      .atLocation(targetToken)
      .scaleToObject(1)
      .rotate(-getTokenRotation(targetToken))
      //
      .effect("jb2a.smoke.puff.centered.grey")
      .atLocation(targetToken)
      .scale(0.5)
      //
      .play();
  });
};

export const playFullSailAdvancedAnimation = async (outcome) => {
  if (outcome.isSuccess !== true) return;

  await playAdvancedAnimation([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.gust_of_wind.veryfast")
      .playIf(!outcome.isCriticalSuccess)
      .atLocation(initiatorToken)
      .rotate(-getTokenRotation(initiatorToken))
      .scaleToObject(0.8)
      //
      .effect("jb2a.wind_stream.white")
      .playIf(outcome.isCriticalSuccess)
      .atLocation(initiatorToken)
      .rotate(-getTokenRotation(initiatorToken))
      .screenSpaceScale({ fitX: true, fitY: true })
      //
      .effect("jb2a.wind_stream.white")
      .playIf(outcome.isCriticalSuccess)
      .atLocation(initiatorToken)
      .rotate(-getTokenRotation(initiatorToken))
      .screenSpaceScale({ fitX: true, fitY: true })
      //
      .play();
  });
};

export const playComeAboutAdvancedAnimation = async (outcome) => {
  if (outcome.isSuccess !== true) return;

  await playAdvancedAnimation([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.zoning.outward.indicator.once.bluegreen.02.01")
      .rotate(-getTokenRotation(initiatorToken))
      .atLocation(initiatorToken)
      .scale(outcome.isCriticalSuccess ? 1 : 0.5)
      //
      .play();
  });
};

export const playRepairAdvancedAnimation = async (outcome) => {
  if (outcome.isSuccess !== true) return;

  await playAdvancedAnimation([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.zoning.inward.indicator.loop.bluegreen.02.01")
      .atLocation(initiatorToken)
      .scaleToObject(outcome.isCriticalSuccess ? 2 : 1, { uniform: true })
      //
      .play();
  });
};

export const playWeighAnchorAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimation([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.wind_stream.white")
      .atLocation(initiatorToken)
      .rotate(-getTokenRotation(initiatorToken))
      .scaleToObject(1, { uniform: true })
      //
      .play();
  });
};

export const playDropAnchorAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimation([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.wind_stream.white")
      .atLocation(initiatorToken)
      .scaleToObject(1, { uniform: true })
      .rotate(-getTokenRotation(initiatorToken) - 180)
      //
      .play();
  });
};

export const playSingShantyAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimation([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.music_notations")
      .playIf(outcome.isSuccess)
      .atLocation(initiatorToken, { randomOffset: true })
      .scaleToObject(0.5, { uniform: true })
      .repeats(outcome.isCriticalSuccess ? 8 : 4, 500, 1500)
      //
      .effect("jb2a.markers.music_note.blue.01")
      .playIf(outcome.isSuccess)
      .atLocation(initiatorToken)
      .scaleToObject(1, { uniform: true })
      .scaleOut(1.5, 1000)
      //
      .play();
  });
};

//

export const playBrokenAdvancedAnimation = async (outcome) => {
  if (!outcome.isDead) return;

  await playAdvancedAnimation([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.toll_the_dead.green.skull_smoke")
      .atLocation(initiatorToken)
      .scale(2)
      //
      .play();
  });
};

export const playSinkingAdvancedAnimation = async (outcome) => {
  if (outcome.isNothing) return;

  await playAdvancedAnimation([outcome.initiatorToken], async (initiatorToken) => {
    const getScale = (outcome) => {
      switch (true) {
        case outcome.isExplosion:
          return 0.5;
        case outcome.isMajorExplosion:
          return 1;
        case outcome.isFatalExplosion:
          return 2;
      }
    };
    new Sequence()
      .effect("jb2a.liquid.splash.blue")
      .atLocation(initiatorToken)
      .belowTokens()
      .rotate(-getTokenRotation(initiatorToken))
      .scaleToObject(1)
      //
      .effect("jb2a.impact.ground_crack.still_frame")
      .atLocation(initiatorToken)
      .scaleToObject(1)
      .rotate(-getTokenRotation(initiatorToken))
      //
      .effect("jb2a.explosion.01.orange")
      .playIf(outcome.isExplosion || outcome.isMajorExplosion || outcome.isFatalExplosion)
      .atLocation(initiatorToken)
      .scale(getScale(outcome) ?? 0)
      //
      .play();
  });
};

export const playStarvationAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimation([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.markers.drop.red.02")
      .atLocation(initiatorToken)
      .scale(0.5)
      //
      .play();
  });
};

export const playInfectedAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimation([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.markers.poison.dark_green.01")
      .atLocation(initiatorToken)
      .scale(0.5)
      //
      .play();
  });
};

export const playHealAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimation([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.healing_generic.400px.green")
      .atLocation(initiatorToken)
      .scaleToObject(2, { uniform: true })
      //
      .play();
  });
};

export const playInvokeRelicAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimation([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.magic_signs.circle.02.necromancy.intro.green")
      .atLocation(initiatorToken)
      .scaleToObject(3, { uniform: true })
      .belowTokens()
      //
      .play();
  });
};

export const playTestRelicAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimation([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.divine_smite.caster.blueyellow")
      .playIf(outcome.isSuccess)
      .atLocation(initiatorToken)
      .scaleToObject(outcome.isCriticalSuccess ? 6 : 3, { uniform: true })
      //
      .effect("jb2a.impact.ground_crack.orange")
      .playIf(outcome.isFailure && !outcome.isFumble)
      .atLocation(initiatorToken)
      .scaleToObject(4, { uniform: true })
      .belowTokens()
      //
      .effect("jb2a.lightning_strike.blue")
      .playIf(outcome.isFumble)
      .atLocation(initiatorToken)
      .delay(500)
      .repeats(3, 1000, 1500)
      .randomizeMirrorX()
      .scale(1)
      //
      .effect("jb2a.whirlwind.bluegrey")
      .playIf(outcome.isFumble)
      .atLocation(initiatorToken)
      .scaleToObject(3, { uniform: true })
      //
      .play();
  });
};

export const playInvokeRitualAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimation([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.magic_signs.circle.02.evocation.intro.red")
      .atLocation(initiatorToken)
      .playIf(outcome.isSuccess || !outcome.roll)
      .scaleToObject(3, { uniform: true })
      .belowTokens()
      //
      .effect("jb2a.energy_strands.overlay.blue.01")
      .playIf(outcome.isSuccess || outcome.isCriticalSuccess || !outcome.roll)
      .atLocation(initiatorToken)
      .delay(1000)
      .scaleToObject(2, { uniform: true })
      .scaleOut(outcome.isCriticalSuccess ? 4 : 1, 2000)
      .waitUntilFinished()
      //
      .play();
  });
};

export const playMysticalMishapAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimation([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.arms_of_hadar.dark_purple")
      .atLocation(initiatorToken)
      .belowTokens()
      .scaleToObject(2, { uniform: true })
      .scaleOut(outcome.isFumble ? 3 : 1.5, 2000)
      .fadeOut(200)
      //
      .play();
  });
};

export const playDefendAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimation([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.icon.shield.green")
      .playIf(outcome.isCriticalSuccess)
      .atLocation(initiatorToken)
      .duration(1000)
      .scaleToObject(1, { uniform: true })
      .scaleOut(2, 1000)
      .fadeOut(200)
      //
      .effect("jb2a.icon.shield_cracked.purple")
      .playIf(outcome.isFumble)
      .atLocation(initiatorToken)
      .scaleToObject(1, { uniform: true })
      .duration(1000)
      .scaleOut(2, 1000)
      .fadeOut(200)
      //
      .play();
  });
};

export const playItemAdvancedAnimation = async (outcome) => {
  const actor = canvas.ready ? canvas.tokens.get(outcome.initiatorToken)?.actor : null;
  if (!actor) return;

  /** @type {PBItem} */
  const item = actor?.items.get(outcome.item);
  const animation = getSystemFlag(item, CONFIG.PB.flags.ANIMATION);
  if (!animation) {
    return;
  }

  if (item.isRanged) {
    await playItemRangedAnimation(outcome, item, animation);
  } else {
    await playItemMeleeAnimation(outcome, animation);
  }
};

export const playItemMeleeAnimation = async (outcome, animation) => {
  await playAdvancedAnimation([outcome.initiatorToken, outcome.targetToken], async (initiatorToken, targetToken) => {
    new Sequence()
      .effect(animation)
      .atLocation(initiatorToken)
      .missed(outcome.isFailure)
      .size(getTokenWidth(initiatorToken) * getTokenScale(initiatorToken) * 4, { gridUnits: true })
      .randomizeMirrorY()
      .rotateTowards(targetToken)
      .anchor({ x: 0.4, y: 0.5 })
      //
      .play();
  });
};

export const playItemRangedAnimation = async (outcome, item, animation) => {
  await playAdvancedAnimation([outcome.initiatorToken, outcome.targetToken], async (initiatorToken, targetToken) => {
    new Sequence()
      .effect(animation)
      .atLocation(initiatorToken)
      .missed(outcome.isFailure)
      .stretchTo(targetToken)
      .randomizeMirrorY()
      //
      .play();
  });
};
