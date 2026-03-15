import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const ANIMATION_TRIGGER_ATTRIBUTES = [
  "data-anim",
  "data-anim-class",
  "data-anim-gsap",
  "data-anim-mode",
  "data-anim-preset",
  "data-anim-target",
  "data-anim-start",
  "data-anim-duration",
  "data-anim-delay",
  "data-anim-stagger",
  "data-anim-ease",
  "data-anim-x",
  "data-anim-y",
  "data-anim-scale",
  "data-anim-rotate",
  "data-anim-opacity",
];
const ANIMATION_TRIGGER_SELECTOR = ANIMATION_TRIGGER_ATTRIBUTES.map(
  (attribute) => `[${attribute}]`,
).join(", ");
const DEFAULT_ANIMATION_CLASS = "is_anime";
const DEFAULT_PRESET = "fade-up";
const DEFAULT_START = "top 85%";
const DEFAULT_DURATION = 0.8;
const DEFAULT_STAGGER = 0.12;
const DEFAULT_EASE = "power2.out";
const ANIMATION_PRESETS = {
  "fade-up": {
    x: 0,
    y: 20,
    scale: 1,
    rotate: 0,
    autoAlpha: 0,
  },
  "fade-down": {
    x: 0,
    y: -20,
    scale: 1,
    rotate: 0,
    autoAlpha: 0,
  },
  "fade-left": {
    x: -24,
    y: 0,
    scale: 1,
    rotate: 0,
    autoAlpha: 0,
  },
  "fade-right": {
    x: 24,
    y: 0,
    scale: 1,
    rotate: 0,
    autoAlpha: 0,
  },
  "zoom-in": {
    x: 0,
    y: 0,
    scale: 0.94,
    rotate: 0,
    autoAlpha: 0,
  },
  "zoom-out": {
    x: 0,
    y: 0,
    scale: 1.06,
    rotate: 0,
    autoAlpha: 0,
  },
  none: {
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    autoAlpha: 0,
  },
};

gsap.registerPlugin(ScrollTrigger);

/**
 * Elements with any `data-anim-*` attribute are treated as animation triggers.
 * Add `.base-anime` to targets that should stay hidden before reveal.
 *
 * Supported data attributes:
 * - data-anim-class / data-anim: completed state class name
 * - data-anim-gsap: legacy gsap/class mode boolean
 * - data-anim-mode: "gsap" | "class"
 * - data-anim-preset: fade-up | fade-down | fade-left | fade-right | zoom-in | zoom-out | none
 * - data-anim-target: descendant selector to animate as a group
 * - data-anim-start / data-anim-duration / data-anim-delay / data-anim-stagger / data-anim-ease
 * - data-anim-x / data-anim-y / data-anim-scale / data-anim-rotate / data-anim-opacity
 */
export function ScrollAnimation() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScrollAnimations, {
      once: true,
    });
    return;
  }

  initScrollAnimations();
}

function initScrollAnimations() {
  const aniBoxes = gsap.utils.toArray(ANIMATION_TRIGGER_SELECTOR).filter((element) => {
    return element instanceof HTMLElement;
  });

  if (!aniBoxes.length) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  aniBoxes.forEach((aniBox) => {
    if (aniBox.dataset.scrollAnimationReady === "true") {
      return;
    }

    const config = resolveAnimationConfig(aniBox);
    markAnimationTargetsAsReady(config);

    if (prefersReducedMotion || isAboveViewport(config.trigger)) {
      completeAnimation(config);
      return;
    }

    if (config.mode === "gsap") {
      setupGsapAnimation(config);
      return;
    }

    setupClassToggleAnimation(config);
  });
}

function resolveAnimationConfig(element) {
  const animationClass = getAnimationClass(element);
  const targets = getAnimationTargets(element);
  const preset = getAnimationPreset(element);

  return {
    animationClass,
    delay: getDatasetNumber(element.dataset.animDelay, 0),
    duration: getDatasetNumber(element.dataset.animDuration, DEFAULT_DURATION),
    ease: element.dataset.animEase || DEFAULT_EASE,
    fromVars: getAnimationFromVars(element, preset),
    mode: getAnimationMode(element, animationClass),
    stagger:
      targets.length > 1 ? getDatasetNumber(element.dataset.animStagger, DEFAULT_STAGGER) : 0,
    start: element.dataset.animStart || DEFAULT_START,
    targets,
    trigger: element,
  };
}

function setupGsapAnimation(config) {
  gsap.set(config.targets, {
    ...config.fromVars,
    willChange: "opacity, transform",
  });

  ScrollTrigger.create({
    trigger: config.trigger,
    start: config.start,
    once: true,
    onEnter: () => {
      gsap.to(config.targets, {
        autoAlpha: 1,
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0,
        duration: config.duration,
        delay: config.delay,
        ease: config.ease,
        stagger: config.stagger,
        overwrite: "auto",
        onComplete: () => {
          completeAnimation(config);
        },
      });
    },
  });
}

function setupClassToggleAnimation(config) {
  ScrollTrigger.create({
    trigger: config.trigger,
    start: config.start,
    once: true,
    onEnter: () => {
      completeAnimation(config);
    },
  });
}

function completeAnimation(config) {
  addAnimationClass(config.trigger, config.animationClass);
  config.targets.forEach((target) => {
    if (shouldReceiveAnimationClass(config.trigger, target)) {
      addAnimationClass(target, config.animationClass);
    }
  });

  gsap.set(config.targets, {
    clearProps: "opacity,transform,visibility,willChange",
  });
}

function getAnimationClass(element) {
  return element.dataset.animClass || element.dataset.anim || DEFAULT_ANIMATION_CLASS;
}

function getAnimationMode(element, animationClass) {
  if (element.dataset.animMode === "gsap" || element.dataset.animMode === "class") {
    return element.dataset.animMode;
  }

  const legacyGsapMode = getDatasetBoolean(element.dataset.animGsap);
  if (legacyGsapMode !== null) {
    return legacyGsapMode ? "gsap" : "class";
  }

  if (element.dataset.animTarget) {
    return "gsap";
  }

  return animationClass === DEFAULT_ANIMATION_CLASS ? "gsap" : "class";
}

function getAnimationPreset(element) {
  const preset = element.dataset.animPreset || DEFAULT_PRESET;
  return ANIMATION_PRESETS[preset] || ANIMATION_PRESETS[DEFAULT_PRESET];
}

function getAnimationTargets(element) {
  const selector = element.dataset.animTarget;
  if (!selector) {
    return [element];
  }

  const normalizedSelector = normalizeTargetSelector(selector);
  const targets = Array.from(element.querySelectorAll(normalizedSelector)).filter((target) => {
    return target instanceof HTMLElement;
  });

  return targets.length ? targets : [element];
}

function getAnimationFromVars(element, preset) {
  return {
    autoAlpha: getDatasetNumber(element.dataset.animOpacity, preset.autoAlpha),
    rotate: getDatasetNumber(element.dataset.animRotate, preset.rotate),
    scale: getDatasetNumber(element.dataset.animScale, preset.scale),
    x: getDatasetNumber(element.dataset.animX, preset.x),
    y: getDatasetNumber(element.dataset.animY, preset.y),
  };
}

function markAnimationTargetsAsReady(config) {
  config.trigger.dataset.scrollAnimationReady = "true";
  config.targets.forEach((target) => {
    if (target !== config.trigger && isAnimationTrigger(target)) {
      target.dataset.scrollAnimationReady = "true";
    }
  });
}

function addAnimationClass(element, animationClass) {
  if (!element.classList.contains(animationClass)) {
    element.classList.add(animationClass);
  }
}

function shouldReceiveAnimationClass(trigger, target) {
  return target === trigger || target.classList.contains("base-anime");
}

function normalizeTargetSelector(selector) {
  const trimmedSelector = selector.trim();
  return trimmedSelector.startsWith(">") ? `:scope ${trimmedSelector}` : trimmedSelector;
}

function isAnimationTrigger(element) {
  return element.matches(ANIMATION_TRIGGER_SELECTOR);
}

function getDatasetNumber(value, fallbackValue) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallbackValue;
}

function getDatasetBoolean(value) {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

function isAboveViewport(element) {
  return element.getBoundingClientRect().top < 0;
}
