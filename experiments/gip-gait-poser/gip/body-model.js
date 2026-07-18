/**
 * GIP Body Module (approximation) — user attributes -> personalized skeleton.
 *
 * Paper: "Gait Inertial Poser (GIP)" (Hori et al., IEEE Access 2025) estimates
 * SMPL shape parameters beta (R^10) from {height, weight, age, gender} with an MLP,
 * then derives limb lengths that scale stride and IMU signals.
 *
 * We cannot run the trained SMPL regressor in the browser (no released weights / no
 * SMPL basis), so this module reproduces the SAME ROLE with a classical anthropometric
 * model: body-segment lengths as fractions of stature H (Winter, "Biomechanics and
 * Motor Control of Human Movement", segment-length figure; Drillis & Contini 1966).
 * The output is a personalized stick-figure skeleton whose limb lengths drive the
 * pose reconstructor and the synthetic-IMU generator, exactly like beta does in GIP.
 *
 * Pure functions — no DOM. Loadable in Node for unit testing.
 */
(function (global) {
  'use strict';

  // Segment marks as a fraction of stature H (vertical height of the landmark
  // above the floor in the anatomical standing pose), Winter's anthropometric data.
  //   top of head = 1.000 H,  shoulder(acromion) = 0.818,  elbow = 0.630,
  //   wrist = 0.485,  hip(greater trochanter) = 0.530,  knee = 0.285,
  //   ankle(lateral malleolus) = 0.039.
  const MARK = {
    head: 1.000,
    shoulder: 0.818,
    elbow: 0.630,
    wrist: 0.485,
    hip: 0.530,
    knee: 0.285,
    ankle: 0.039
  };

  // Widths / breadths as a fraction of H (Winter).
  const WIDTH = {
    shoulder: 0.259, // biacromial breadth
    hip: 0.191       // bi-iliac breadth
  };

  // Foot length as a fraction of H (Winter).
  const FOOT_LENGTH = 0.152;

  function clampNumber(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  /**
   * Estimate a personalized skeleton from user attributes.
   * @param {{heightCm?:number, weightKg?:number, age?:number, gender?:string}} attrs
   * @returns {{
   *   heightM:number, weightKg:number, age:number, gender:'male'|'female'|'neutral',
   *   segments:{
   *     headNeck:number, trunk:number, upperArm:number, forearm:number, hand:number,
   *     thigh:number, shank:number, footLength:number, ankleHeight:number,
   *     shoulderWidth:number, hipWidth:number
   *   },
   *   legLength:number, hipHeight:number, preferredStride:number
   * }}
   */
  function estimateSkeleton(attrs) {
    const a = attrs || {};
    const heightCm = clampNumber(a.heightCm, 120, 210, 170);
    const weightKg = clampNumber(a.weightKg, 30, 150, 62);
    const age = clampNumber(a.age, 5, 100, 35);
    let gender = String(a.gender || 'neutral').toLowerCase();
    if (gender !== 'male' && gender !== 'female') gender = 'neutral';

    const H = heightCm / 100; // stature in metres

    // Sex-based shoulder/hip breadth (Winter's base table is male-derived): females
    // have relatively wider hips and narrower shoulders. Targets: female biacromial
    // ~0.23H / bi-iliac ~0.20H; male ~0.26H / ~0.19H. Segment lengths still dominate.
    const hipFactor = gender === 'female' ? 1.047 : gender === 'male' ? 0.995 : 1.0;
    const shoulderFactor = gender === 'female' ? 0.888 : gender === 'male' ? 1.004 : 1.0;

    const segments = {
      headNeck: (MARK.head - MARK.shoulder) * H,
      trunk: (MARK.shoulder - MARK.hip) * H,
      upperArm: (MARK.shoulder - MARK.elbow) * H,
      forearm: (MARK.elbow - MARK.wrist) * H,
      hand: 0.108 * H,
      thigh: (MARK.hip - MARK.knee) * H,
      shank: (MARK.knee - MARK.ankle) * H,
      footLength: FOOT_LENGTH * H,
      ankleHeight: MARK.ankle * H,
      shoulderWidth: WIDTH.shoulder * H * shoulderFactor,
      hipWidth: WIDTH.hip * H * hipFactor
    };

    const hipHeight = MARK.hip * H;             // pelvis height when standing
    const legLength = segments.thigh + segments.shank + segments.ankleHeight;

    // Preferred (comfortable) stride length. Normal adults self-select ~0.83 * H;
    // used only as a fallback when the measured (ZUPT) stride is unavailable.
    const preferredStride = 0.83 * H;

    return {
      heightM: H,
      weightKg: weightKg,
      age: age,
      gender: gender,
      segments: segments,
      legLength: legLength,
      hipHeight: hipHeight,
      preferredStride: preferredStride
    };
  }

  const BodyModel = { estimateSkeleton: estimateSkeleton, MARK: MARK, WIDTH: WIDTH };

  if (typeof global.OrpheGipBodyModel === 'undefined') {
    global.OrpheGipBodyModel = BodyModel;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BodyModel;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
