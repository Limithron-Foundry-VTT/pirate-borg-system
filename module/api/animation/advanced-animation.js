import { isAdvancedAnimationEnabled } from "../../system/settings.js";
import { isJB2AEnabled, isJB2APatreonEnabled, isSequencerEnabled } from "./animation.js";

export const ADVANCED_ANIMATION_TYPE = {
  ITEM: "item",
  HEAL: "heal",
  TAKE_DAMAGE: "take-damage",
  INFLICT_DAMAGE: "inflict-damage",
  DEFEND: "defend",
  BROADSIDES: "broadsides",
  SMALLARMS: "smallarms",
  RAM: "ram",
  COME_ABOUT: "come-about",
  FULL_SAIL: "full-sail",
  REPAIR: "repair",
  BROKEN: "broken",
  SPELL: "spell",
  MYSTICAL_MISHAP: "mystical-mishap",
  STARVATION: "starvation",
  INFECTED: "infected",
  INVOKE_RELIC: "invoke-relic",
  TEST_RELIC: "test-relic",
  INVOKE_RITUAL: "invoke-ritual",
  WEIGH_ANCHOR: "weigh-anchor",
  DROP_ANCHOR: "drop-anchor",
};

/**
 * @returns {Boolean}
 */
export const isAdvancedAnimationSupported = () => isSequencerEnabled() && isAdvancedAnimationEnabled() && (isJB2AEnabled() || isJB2APatreonEnabled());

/**
 * @param {Array.<String>} tokenIds
 * @param {Function} fn
 * @returns
 */
export const playAdvancedAnimationWithTokens = async (tokenIds = [], fn) => {
  if (!isAdvancedAnimationSupported()) return;

  const tokens = tokenIds.map((tokenId) => canvas.tokens.get(tokenId));

  if (!tokens.some((token) => !!token)) return;

  await fn(...tokens);
};

export const playBroadsidesAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimationWithTokens([outcome.initiatorToken, outcome.targetToken], async (initiatorToken, targetToken) => {
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
  await playAdvancedAnimationWithTokens([outcome.initiatorToken, outcome.targetToken], async (initiatorToken, targetToken) => {
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
  await playAdvancedAnimationWithTokens([outcome.targetToken], async (targetToken) => {
    new Sequence()
      .effect("jb2a.impact.ground_crack.still_frame")
      .atLocation(targetToken)
      .scaleToObject(1, { uniform: true })
      .rotate(-targetToken.data.rotation)
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

  await playAdvancedAnimationWithTokens([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.gust_of_wind.veryfast")
      .playIf(!outcome.isCriticalSuccess)
      .atLocation(initiatorToken)
      .rotate(-initiatorToken.data.rotation)
      .scaleToObject(0.8)
      //
      .effect("jb2a.wind_stream.white")
      .playIf(outcome.isCriticalSuccess)
      .atLocation(initiatorToken)
      .rotate(-initiatorToken.data.rotation)
      .screenSpaceScale({ fitX: true, fitY: true })
      //
      .effect("jb2a.wind_stream.white")
      .playIf(outcome.isCriticalSuccess)
      .atLocation(initiatorToken)
      .rotate(-initiatorToken.data.rotation)
      .screenSpaceScale({ fitX: true, fitY: true })
      //
      .play();
  });
};

export const playComeAboutAdvancedAnimation = async (outcome) => {
  if (outcome.isSuccess !== true) return;

  await playAdvancedAnimationWithTokens([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.zoning.outward.indicator.once.bluegreen.02.01")
      .rotate(-initiatorToken.data.rotation)
      .atLocation(initiatorToken)
      .scale(outcome.isCriticalSuccess ? 1 : 0.5)
      //
      .play();
  });
};

export const playRepairAdvancedAnimation = async (outcome) => {
  if (outcome.isSuccess !== true) return;

  await playAdvancedAnimationWithTokens([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.zoning.inward.indicator.loop.bluegreen.02.01")
      .atLocation(initiatorToken)
      .scale(outcome.isCriticalSuccess ? 1 : 0.5)
      //
      .play();
  });
};

export const playWeighAnchorAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimationWithTokens([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.wind_stream.white")
      .atLocation(initiatorToken)
      .rotate(-initiatorToken.data.rotation)
      .scaleToObject(1)
      //
      .play();
  });
};

export const playDropAnchorAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimationWithTokens([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.wind_stream.white")
      .atLocation(initiatorToken)
      .scaleToObject(1)
      .rotate(-initiatorToken.data.rotation - 180)
      //
      .play();
  });
};

export const playBrokenAdvancedAnimation = async (outcome) => {
  if (!outcome.isDead) return;

  await playAdvancedAnimationWithTokens([outcome.initiatorToken], async (initiatorToken) => {
    console.log("with token", initiatorToken, outcome);
    new Sequence()
      .effect("jb2a.toll_the_dead.green.skull_smoke")
      .atLocation(initiatorToken)
      .scale(2)
      //
      .play();
  });
};

export const playStarvationAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimationWithTokens([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.markers.drop.red.02")
      .atLocation(initiatorToken)
      .scale(0.5)
      //
      .play();
  });
};

export const playInfectedAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimationWithTokens([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.markers.poison.dark_green.01")
      .atLocation(initiatorToken)
      .scale(0.5)
      //
      .play();
  });
};

export const playHealAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimationWithTokens([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.healing_generic.400px.green")
      .atLocation(initiatorToken)
      .scale(0.5)
      //
      .play();
  });
};

export const playItemAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimationWithTokens([outcome.initiatorToken, outcome.targetToken], async (initiatorToken, targetToken) => {
    new Sequence()
      .effect(outcome.advancedAnimation.options.item)
      .atLocation(initiatorToken)
      .reachTowards(targetToken)
      .missed(outcome.isFailure)
      //
      .play();
  });
};

export const playInvokeRelicAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimationWithTokens([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.magic_signs.circle.02.necromancy.intro.green")
      .atLocation(initiatorToken)
      .scaleToObject(3, { uniform: true})
      .belowTokens()
      //
      .play();
  });
};

export const playTestRelicAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimationWithTokens([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.template_circle.out_pulse.02.burst.bluewhite")
      .playIf(outcome.isSuccess)
      .atLocation(initiatorToken)
      .scaleToObject(3)
      .repeats(outcome.isCriticalSuccess ? 3 : 1, 500, 1000)
      //
      .effect("jb2a.impact.ground_crack.orange")
      .playIf(outcome.isFailure && !outcome.isFumble)
      .atLocation(initiatorToken)
      .scaleToObject(3)
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
      .scaleToObject(3)
      //
      .play();
  });
};

export const playInvokeRitualAdvancedAnimation = async (outcome) => {
  await playAdvancedAnimationWithTokens([outcome.initiatorToken], async (initiatorToken) => {
    new Sequence()
      .effect("jb2a.magic_signs.circle.02.abjuration.intro.dark_blue")
      .atLocation(initiatorToken)
      .scale(0.2)
      .belowTokens()
      //
      .effect("jb2a.impact.ground_crack.orange")
      .playIf(outcome.isFailure && !outcome.isFumble)
      .atLocation(initiatorToken)
      .belowTokens()
      //
      .effect("jb2a.lightning_strike.blue")
      .playIf(outcome.isFumble)
      .atLocation(initiatorToken)
      .scale(2)
      //
      .effect("jb2a.whirlwind.bluegrey")
      .playIf(outcome.isFumble)
      .atLocation(initiatorToken)
      //
      .play();
  });
};

// mystical mishap: 
// failure jb2a.arms_of_hadar.dark_purple
// fumble jb2a.sphere_of_annihilation.600px.purple
