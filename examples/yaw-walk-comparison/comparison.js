(function (global, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.OrpheYawWalkComparison = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const LEGACY_SCALE_FACTOR = 0.5;

  function finite(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function radToDeg(radians) {
    return Number(radians) * 180 / Math.PI;
  }

  function quaternionNorm(quaternion) {
    if (!quaternion) return null;
    const components = [quaternion.w, quaternion.x, quaternion.y, quaternion.z].map(finite);
    if (components.some(component => component === null)) return null;
    return Math.hypot(...components);
  }

  function scaleQuaternion(quaternion, scale) {
    if (!quaternion) return null;
    const components = [quaternion.w, quaternion.x, quaternion.y, quaternion.z].map(finite);
    const factor = finite(scale);
    if (factor === null || components.some(component => component === null)) return null;
    return {
      w: components[0] * factor,
      x: components[1] * factor,
      y: components[2] * factor,
      z: components[3] * factor,
    };
  }

  function eulerWithoutNormalization(quaternion) {
    if (!quaternion) return null;
    const w = finite(quaternion.w);
    const x = finite(quaternion.x);
    const y = finite(quaternion.y);
    const z = finite(quaternion.z);
    if ([w, x, y, z].some(component => component === null)) return null;
    return {
      pitch: Math.asin(clamp(2 * (w * y - z * x), -1, 1)),
      roll: Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)),
      yaw: Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)),
    };
  }

  function normalizedEuler(quaternion) {
    const norm = quaternionNorm(quaternion);
    if (norm === null || norm <= Number.EPSILON) return null;
    return eulerWithoutNormalization(scaleQuaternion(quaternion, 1 / norm));
  }

  function legacyQuaternionFromFixed(quaternion) {
    return scaleQuaternion(quaternion, LEGACY_SCALE_FACTOR);
  }

  function legacyEulerFromFixedQuaternion(quaternion) {
    return eulerWithoutNormalization(legacyQuaternionFromFixed(quaternion));
  }

  function wrappedDeltaDegrees(current, previous) {
    const currentNumber = finite(current);
    const previousNumber = finite(previous);
    if (currentNumber === null || previousNumber === null) return null;
    const delta = currentNumber - previousNumber;
    return ((delta + 180) % 360 + 360) % 360 - 180;
  }

  class RelativeAngleTracker {
    constructor() {
      this.previousWrapped = null;
      this.unwrapped = null;
      this.origin = null;
      this.postOriginMin = null;
      this.postOriginMax = null;
      this.count = 0;
    }

    push(angleDegrees) {
      const angle = finite(angleDegrees);
      if (angle === null) return null;
      if (this.previousWrapped === null) {
        this.unwrapped = angle;
      } else {
        this.unwrapped += wrappedDeltaDegrees(angle, this.previousWrapped);
      }
      this.previousWrapped = angle;
      this.count += 1;
      if (this.origin !== null) {
        const relative = this.unwrapped - this.origin;
        this.postOriginMin = this.postOriginMin === null ? relative : Math.min(this.postOriginMin, relative);
        this.postOriginMax = this.postOriginMax === null ? relative : Math.max(this.postOriginMax, relative);
      }
      return this.current();
    }

    markOrigin() {
      if (this.unwrapped === null) return false;
      this.origin = this.unwrapped;
      this.postOriginMin = 0;
      this.postOriginMax = 0;
      return true;
    }

    current() {
      return {
        wrappedDeg: this.previousWrapped,
        unwrappedDeg: this.unwrapped,
        deltaDeg: this.origin === null || this.unwrapped === null ? null : this.unwrapped - this.origin,
      };
    }

    snapshot() {
      const current = this.current();
      return {
        ...current,
        count: this.count,
        originDeg: this.origin,
        minDeltaDeg: this.postOriginMin,
        maxDeltaDeg: this.postOriginMax,
        rangeDeg: this.postOriginMin === null || this.postOriginMax === null
          ? null
          : this.postOriginMax - this.postOriginMin,
      };
    }
  }

  class WalkComparisonTracker {
    constructor() {
      this.legacy = new RelativeAngleTracker();
      this.fixed = new RelativeAngleTracker();
      this.corrected = new RelativeAngleTracker();
      this.lastFixedNorm = null;
      this.lastLegacyNorm = null;
      this.walkOriginMarked = false;
    }

    push(fixedQuaternion, correctedYawDegrees) {
      const fixedEuler = normalizedEuler(fixedQuaternion);
      const legacyQuaternion = legacyQuaternionFromFixed(fixedQuaternion);
      const legacyEuler = legacyQuaternion ? eulerWithoutNormalization(legacyQuaternion) : null;
      this.lastFixedNorm = quaternionNorm(fixedQuaternion);
      this.lastLegacyNorm = quaternionNorm(legacyQuaternion);
      const legacy = legacyEuler ? this.legacy.push(radToDeg(legacyEuler.yaw)) : this.legacy.current();
      const fixed = fixedEuler ? this.fixed.push(radToDeg(fixedEuler.yaw)) : this.fixed.current();
      const corrected = finite(correctedYawDegrees) === null
        ? this.corrected.current()
        : this.corrected.push(correctedYawDegrees);
      return {
        legacy,
        fixed,
        corrected,
        legacyYawWrappedDeg: legacyEuler ? radToDeg(legacyEuler.yaw) : null,
        fixedYawWrappedDeg: fixedEuler ? radToDeg(fixedEuler.yaw) : null,
        legacyQuaternion,
        legacyNorm: this.lastLegacyNorm,
        fixedNorm: this.lastFixedNorm,
      };
    }

    markWalkOrigin() {
      const marked = [this.legacy, this.fixed, this.corrected].map(tracker => tracker.markOrigin());
      this.walkOriginMarked = marked.every(Boolean);
      return this.walkOriginMarked;
    }

    snapshot() {
      return {
        walkOriginMarked: this.walkOriginMarked,
        legacy: this.legacy.snapshot(),
        fixed: this.fixed.snapshot(),
        corrected: this.corrected.snapshot(),
        legacyNorm: this.lastLegacyNorm,
        fixedNorm: this.lastFixedNorm,
      };
    }
  }

  function expectedSignedDegrees(loops, direction) {
    const loopCount = Math.max(1, Math.round(finite(loops) || 1));
    return String(direction).toUpperCase() === 'CCW' ? loopCount * 360 : -loopCount * 360;
  }

  function absoluteMagnitudeError(observedDegrees, expectedDegrees) {
    const observed = finite(observedDegrees);
    const expected = finite(expectedDegrees);
    if (observed === null || expected === null) return null;
    return Math.abs(Math.abs(observed) - Math.abs(expected));
  }

  function summarizeWalk(snapshot, expectedDegrees) {
    if (!snapshot) return null;
    const legacyDeltaDeg = finite(snapshot.legacy && snapshot.legacy.deltaDeg);
    const fixedDeltaDeg = finite(snapshot.fixed && snapshot.fixed.deltaDeg);
    const correctedDeltaDeg = finite(snapshot.corrected && snapshot.corrected.deltaDeg);
    const fixedErrorDeg = absoluteMagnitudeError(fixedDeltaDeg, expectedDegrees);
    const correctedErrorDeg = absoluteMagnitudeError(correctedDeltaDeg, expectedDegrees);
    return {
      expectedDeg: finite(expectedDegrees),
      legacyDeltaDeg,
      legacyRangeDeg: finite(snapshot.legacy && snapshot.legacy.rangeDeg),
      fixedDeltaDeg,
      correctedDeltaDeg,
      fixedErrorDeg,
      correctedErrorDeg,
      errorChangeDeg: fixedErrorDeg === null || correctedErrorDeg === null ? null : fixedErrorDeg - correctedErrorDeg,
      fixedNorm: finite(snapshot.fixedNorm),
      legacyNorm: finite(snapshot.legacyNorm),
    };
  }

  return {
    LEGACY_SCALE_FACTOR,
    RelativeAngleTracker,
    WalkComparisonTracker,
    absoluteMagnitudeError,
    eulerWithoutNormalization,
    expectedSignedDegrees,
    legacyEulerFromFixedQuaternion,
    legacyQuaternionFromFixed,
    normalizedEuler,
    quaternionNorm,
    radToDeg,
    scaleQuaternion,
    summarizeWalk,
    wrappedDeltaDegrees,
  };
});
