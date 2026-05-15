/**
 * Small, dependency-free feature extraction and event detection for the
 * ORPHE INSOLE hula motion sonifier prototype.
 *
 * The detector intentionally uses transparent thresholds instead of a learned
 * model so dancers and teachers can see why each event fired.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.HulaMotion = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const SIDE_LEFT = "left";
  const SIDE_RIGHT = "right";
  const SIDES = [SIDE_LEFT, SIDE_RIGHT];

  const DEFAULT_OPTIONS = {
    contactPressure: 40,
    lightContactPressure: 10,
    kaholoLoadThreshold: 0.58,
    kaholoMaxWindowMs: 4200,
    kaholoMinShiftMs: 180,
    helaForefootRatio: 0.68,
    helaHeelRatio: 0.22,
    helaSupportLoad: 0.62,
    amiMaxLoadDelta: 0.26,
    amiWindowMs: 1800,
    amiCopRange: 0.14,
    amiCopPath: 0.28,
    imuWindowMs: 820,
    imuMoveThreshold: 0.045,
    imuStillThreshold: 0.035,
    imuMultiAxisRatio: 0.42,
    imuAxisRatioThreshold: 1.0,
    imuLateralShareThreshold: 0.52,
    imuForwardShareThreshold: 0.5,
    imuImpactThreshold: 0.08,
    imuImpactResetThreshold: 0.04,
    imuImpactPairMinMs: 60,
    imuImpactPairMaxMs: 240,
    imuImpactPulseMinGapMs: 70,
    imuLandingLockoutMs: 390,
    imuLandingGlobalLockoutMs: 250,
    copWindowMs: 620,
    copLateralThreshold: 0.07,
    copForwardThreshold: 0.14,
    footFlatTotalPressure: 170,
    footFlatRisePressure: 55,
    footFlatHeelRatio: 0.1,
    footFlatForefootRatio: 0.34,
    footFlatMinIntervalMs: 160,
    enabledSteps: {
      kaholo: true,
      hela: true,
      ami: true,
    },
    eventCooldownMs: 140,
    sampleRecordIntervalMs: 50,
  };

  const SENSOR_LAYOUT = [
    { label: 1, x: 0.25, y: 0.17, region: "toe-medial" },
    { label: 2, x: 0.25, y: 0.34, region: "ball-medial" },
    { label: 3, x: 0.64, y: 0.22, region: "toe-lateral" },
    { label: 4, x: 0.54, y: 0.35, region: "ball-center" },
    { label: 5, x: 0.79, y: 0.37, region: "lateral-midfoot" },
    { label: 6, x: 0.60, y: 0.88, region: "heel" },
  ];

  const DEFAULT_SENSOR_MAP = [0, 1, 2, 3, 4, 5];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function sum(values) {
    return values.reduce((total, value) => total + Number(value || 0), 0);
  }

  function normalizePressure(values) {
    const next = Array.from(values || []).slice(0, SENSOR_LAYOUT.length).map((value) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
    });
    while (next.length < SENSOR_LAYOUT.length) next.push(0);
    return next;
  }

  function normalizeSensorMap(sensorMap) {
    const map = Array.isArray(sensorMap) ? sensorMap.slice(0, SENSOR_LAYOUT.length) : DEFAULT_SENSOR_MAP;
    while (map.length < SENSOR_LAYOUT.length) map.push(map.length);
    return map.map((value, index) => {
      const numeric = Number(value);
      return Number.isInteger(numeric) && numeric >= 0 && numeric < SENSOR_LAYOUT.length ? numeric : index;
    });
  }

  function mapPressureToPhysicalSensors(values, sensorMap) {
    const raw = normalizePressure(values);
    const map = normalizeSensorMap(sensorMap);
    return map.map((rawIndex) => raw[rawIndex] || 0);
  }

  function getSensorPosition(index, side) {
    const sensor = SENSOR_LAYOUT[index];
    const x = side === SIDE_LEFT ? 1 - sensor.x : sensor.x;
    return { ...sensor, x };
  }

  function computeFootFeatures(values, side, sensorMap) {
    const pressure = mapPressureToPhysicalSensors(values, sensorMap);
    const total = sum(pressure);
    const toe = pressure[0] + pressure[2];
    const ball = pressure[1] + pressure[3];
    const forefoot = toe + ball;
    const midfoot = pressure[4];
    const nonHeel = forefoot + midfoot;
    const heel = pressure[5];
    const medial = pressure[0] + pressure[1];
    const lateral = pressure[2] + pressure[4];
    const denominator = total || 1;
    const cop = pressure.reduce((point, value, index) => {
      const sensor = getSensorPosition(index, side);
      point.x += sensor.x * value;
      point.y += sensor.y * value;
      return point;
    }, { x: 0, y: 0 });

    cop.x = total ? cop.x / denominator : 0.5;
    cop.y = total ? cop.y / denominator : 0.5;

    return {
      pressure,
      rawPressure: normalizePressure(values),
      sensorMap: normalizeSensorMap(sensorMap),
      total,
      toe,
      ball,
      forefoot,
      midfoot,
      nonHeel,
      heel,
      toeRatio: total ? toe / denominator : 0,
      ballRatio: total ? ball / denominator : 0,
      forefootRatio: total ? forefoot / denominator : 0,
      midfootRatio: total ? midfoot / denominator : 0,
      nonHeelRatio: total ? nonHeel / denominator : 0,
      heelRatio: total ? heel / denominator : 0,
      medialLateralBalance: total ? (lateral - medial) / denominator : 0,
      cop,
    };
  }

  function formatReason(parts) {
    return parts.filter(Boolean).join(" / ");
  }

  function normalizeOptions(options = {}) {
    return {
      ...DEFAULT_OPTIONS,
      ...options,
      enabledSteps: {
        ...DEFAULT_OPTIONS.enabledSteps,
        ...(options.enabledSteps || {}),
      },
    };
  }

  class HulaSessionRecorder {
    constructor(options = {}) {
      this.options = normalizeOptions(options);
      this.reset();
    }

    reset() {
      this.isRecording = false;
      this.startedAt = null;
      this.samples = [];
      this.events = [];
      this.labels = [];
      this.lastSampleAt = 0;
    }

    start(now = Date.now()) {
      this.reset();
      this.isRecording = true;
      this.startedAt = now;
    }

    stop() {
      this.isRecording = false;
    }

    recordFrame(frame) {
      if (!this.isRecording) return;
      if (frame.timestamp - this.lastSampleAt < this.options.sampleRecordIntervalMs) return;
      this.lastSampleAt = frame.timestamp;
      this.samples.push({
        t: this.startedAt ? frame.timestamp - this.startedAt : frame.timestamp,
        left: {
          pressure: frame.feet.left.pressure,
          rawPressure: frame.feet.left.rawPressure,
          sensorMap: frame.feet.left.sensorMap,
          total: frame.feet.left.total,
          cop: frame.feet.left.cop,
          heelRatio: frame.feet.left.heelRatio,
          forefootRatio: frame.feet.left.forefootRatio,
          nonHeelRatio: frame.feet.left.nonHeelRatio,
        },
        right: {
          pressure: frame.feet.right.pressure,
          rawPressure: frame.feet.right.rawPressure,
          sensorMap: frame.feet.right.sensorMap,
          total: frame.feet.right.total,
          cop: frame.feet.right.cop,
          heelRatio: frame.feet.right.heelRatio,
          forefootRatio: frame.feet.right.forefootRatio,
          nonHeelRatio: frame.feet.right.nonHeelRatio,
        },
        balance: frame.balance,
        centerCop: frame.centerCop,
      });
    }

    recordEvent(event, force = false) {
      if (!this.isRecording && !force) return;
      this.events.push({
        ...event,
        t: this.startedAt ? event.timestamp - this.startedAt : event.timestamp,
      });
    }

    updateEventLabel(eventId, label, note = "") {
      const existing = this.labels.find((item) => item.eventId === eventId);
      if (existing) {
        existing.label = label;
        existing.note = note;
      } else {
        this.labels.push({ eventId, label, note });
      }
    }

    toJSON() {
      return {
        format: "orphe-insole-hula-motion-sonifier-session",
        version: 1,
        startedAt: this.startedAt,
        exportedAt: Date.now(),
        options: this.options,
        samples: this.samples,
        events: this.events,
        labels: this.labels,
      };
    }
  }

  class HulaEventDetector {
    constructor(options = {}) {
      this.options = normalizeOptions(options);
      this.reset();
    }

    reset() {
      this.lastPressure = {
        left: computeFootFeatures([], SIDE_LEFT),
        right: computeFootFeatures([], SIDE_RIGHT),
      };
      this.motion = {
        left: { acc: null, previousAcc: null, samples: [] },
        right: { acc: null, previousAcc: null, samples: [] },
      };
      this.lastFrame = null;
      this.shiftHistory = [];
      this.lastShiftSide = null;
      this.lastShiftAt = 0;
      this.leleHistory = [];
      this.lastLeleSide = null;
      this.lastLeleAt = 0;
      this.frameHistory = [];
      this.lastHelaEvent = null;
      this.lastEvents = {
        kaholo: 0,
        hela: 0,
        ami: 0,
      };
      this.activeStates = {
        kaholo: false,
        hela: false,
        ami: false,
      };
      this.phase = {
        kaholo: 0,
        hela: 0,
        ami: 0,
      };
      this.footFlatReady = {
        left: false,
        right: false,
      };
      this.lastFootFlatAt = {
        left: 0,
        right: 0,
      };
      this.imuLanding = {
        left: this.createEmptyLandingState(),
        right: this.createEmptyLandingState(),
      };
      this.lastWalkEventAt = 0;
      this.lastCopPhase = {
        ami: null,
      };
      this.currentGesture = {
        type: "none",
        label: "なし",
        phase: null,
        phaseCount: null,
        confidence: 0,
        reason: "IMUとCoPの変化を待っています。",
        signals: {},
      };
      this.lastBothHeelsGroundedAt = 0;
      this.eventIndex = 0;
      this.explanations = this.createEmptyExplanations();
    }

    createEmptyLandingState() {
      return {
        firstPulse: null,
        lastPulseAt: 0,
        lockoutUntil: 0,
        aboveThreshold: false,
        lastImpact: 0,
        lastInterval: null,
        pulseCount: 0,
      };
    }

    createEmptyExplanations() {
      return {
        kaholo: {
          active: false,
          state: "待機",
          score: 0,
          reason: "左右の荷重シフトを待っています。",
          sequence: [],
          details: [],
        },
        hela: {
          active: false,
          state: "待機",
          score: 0,
          reason: "片足の軽い前足部接地と、反対足の支持荷重を待っています。",
          candidateSide: null,
          details: [],
        },
        ami: {
          active: false,
          state: "待機",
          score: 0,
          reason: "両足接地のままCoPが円を描くような移動を待っています。",
          details: [],
        },
      };
    }

    updatePressure(side, values, timestamp = Date.now(), sensorMap) {
      if (!SIDES.includes(side)) {
        throw new Error(`Unknown side: ${side}`);
      }
      this.lastPressure[side] = computeFootFeatures(values, side, sensorMap);
      return this.update(timestamp);
    }

    updateMotion(side, kind, value, timestamp = Date.now()) {
      if (!SIDES.includes(side) || kind !== "acc" || !value) {
        return {
          events: [],
          explanations: this.explanations,
          gestureState: this.currentGesture,
          frame: this.lastFrame,
        };
      }
      const motion = this.motion[side];
      const current = {
        x: Number(value.x) || 0,
        y: Number(value.y) || 0,
        z: Number(value.z) || 0,
      };
      let impactSample = null;
      if (motion.acc) {
        const dx = Math.abs(current.x - motion.acc.x);
        const dy = Math.abs(current.y - motion.acc.y);
        const dz = Math.abs(current.z - motion.acc.z);
        impactSample = {
          timestamp,
          dx,
          dy,
          dz,
          planar: Math.hypot(dx, dy),
          magnitude: Math.hypot(dx, dy, dz),
        };
        motion.samples.push(impactSample);
      }
      motion.previousAcc = motion.acc;
      motion.acc = current;
      motion.samples = motion.samples.filter((sample) => timestamp - sample.timestamp <= Math.max(this.options.imuWindowMs * 3, 900));
      const events = this.filterEnabledEvents(impactSample ? this.detectImuLanding(side, impactSample) : []);
      if (this.lastFrame) {
        const motionFeatures = {
          left: this.getMotionFeatures(SIDE_LEFT, timestamp),
          right: this.getMotionFeatures(SIDE_RIGHT, timestamp),
        };
        this.updateGestureExplanations(this.lastFrame, motionFeatures, this.getCombinedMotion(timestamp), this.getCopFeatures(timestamp));
      }
      return {
        events,
        explanations: this.explanations,
        gestureState: this.currentGesture,
        frame: this.lastFrame,
      };
    }

    update(timestamp = Date.now()) {
      const left = this.lastPressure.left;
      const right = this.lastPressure.right;
      const total = left.total + right.total;
      const rightLoad = total ? right.total / total : 0.5;
      const leftLoad = total ? left.total / total : 0.5;
      const frame = {
        timestamp,
        feet: { left, right },
        total,
        centerCop: this.computeCenterCop(left, right, total),
        balance: {
          leftLoad,
          rightLoad,
          dominantSide: rightLoad > 0.54 ? SIDE_RIGHT : leftLoad > 0.54 ? SIDE_LEFT : "center",
        },
      };

      this.recordFrameHistory(frame);

      const events = this.filterEnabledEvents(this.detectGesturePhases(frame));

      this.lastFrame = frame;
      return {
        frame,
        events,
        explanations: this.explanations,
        gestureState: this.currentGesture,
      };
    }

    computeCenterCop(left, right, total) {
      if (!total) return { x: 0.5, y: 0.5 };
      return {
        x: (left.cop.x * left.total + right.cop.x * right.total) / total,
        y: (left.cop.y * left.total + right.cop.y * right.total) / total,
      };
    }

    recordFrameHistory(frame) {
      const last = this.frameHistory[this.frameHistory.length - 1];
      const snapshot = {
        timestamp: frame.timestamp,
        centerCop: frame.centerCop,
        balance: frame.balance,
        left: {
          total: frame.feet.left.total,
          heelRatio: frame.feet.left.heelRatio,
          forefootRatio: frame.feet.left.forefootRatio,
          cop: frame.feet.left.cop,
        },
        right: {
          total: frame.feet.right.total,
          heelRatio: frame.feet.right.heelRatio,
          forefootRatio: frame.feet.right.forefootRatio,
          cop: frame.feet.right.cop,
        },
        loadDelta: Math.abs(frame.balance.rightLoad - frame.balance.leftLoad),
        supportLoad: Math.max(frame.balance.leftLoad, frame.balance.rightLoad),
      };
      if (last && last.timestamp === frame.timestamp) {
        this.frameHistory[this.frameHistory.length - 1] = snapshot;
      } else {
        this.frameHistory.push(snapshot);
      }
      const maxWindow = Math.max(this.options.amiWindowMs, this.options.kaholoMaxWindowMs, this.options.copWindowMs);
      this.frameHistory = this.frameHistory.filter((item) => frame.timestamp - item.timestamp <= maxWindow);
    }

    filterEnabledEvents(events) {
      return events.filter((event) => this.options.enabledSteps[event.type] !== false);
    }

    createEvent(type, timestamp, detail) {
      this.lastEvents[type] = timestamp;
      this.eventIndex += 1;
      return {
        id: `${type}-${timestamp}-${this.eventIndex}`,
        type,
        timestamp,
        ...detail,
      };
    }

    canFire(type, timestamp) {
      return timestamp - this.lastEvents[type] >= this.options.eventCooldownMs;
    }

    enterState(type, isActive, timestamp) {
      if (!isActive) {
        this.activeStates[type] = false;
        return false;
      }
      if (this.activeStates[type]) return false;
      this.activeStates[type] = true;
      return this.canFire(type, timestamp);
    }

    getMotionFeatures(side, timestamp) {
      const samples = this.motion[side].samples.filter((sample) => timestamp - sample.timestamp <= this.options.imuWindowMs);
      if (!samples.length) {
        return {
          xEnergy: 0,
          yEnergy: 0,
          zEnergy: 0,
          planarEnergy: 0,
          planarMajor: 0,
          planarMinor: 0,
          multiAxisRatio: 0,
          xyRatio: 1,
          yxRatio: 1,
          lateralShare: 0.5,
          forwardShare: 0.5,
          dominantAxis: "none",
          moving: false,
          quiet: true,
        };
      }
      const sum = samples.reduce((total, sample) => {
        total.x += sample.dx;
        total.y += sample.dy;
        total.z += sample.dz;
        total.planar += sample.planar;
        return total;
      }, { x: 0, y: 0, z: 0, planar: 0 });
      const xEnergy = sum.x / samples.length;
      const yEnergy = sum.y / samples.length;
      const zEnergy = sum.z / samples.length;
      const planarEnergy = sum.planar / samples.length;
      const planarMajor = Math.max(xEnergy, yEnergy);
      const planarMinor = Math.min(xEnergy, yEnergy);
      const multiAxisRatio = planarMajor ? planarMinor / planarMajor : 0;
      const xyRatio = yEnergy ? xEnergy / yEnergy : xEnergy ? 99 : 1;
      const yxRatio = xEnergy ? yEnergy / xEnergy : yEnergy ? 99 : 1;
      const planarAxisTotal = xEnergy + yEnergy;
      const lateralShare = planarAxisTotal ? xEnergy / planarAxisTotal : 0.5;
      const forwardShare = planarAxisTotal ? yEnergy / planarAxisTotal : 0.5;
      return {
        xEnergy,
        yEnergy,
        zEnergy,
        planarEnergy,
        planarMajor,
        planarMinor,
        multiAxisRatio,
        xyRatio,
        yxRatio,
        lateralShare,
        forwardShare,
        dominantAxis: xEnergy >= yEnergy ? "x" : "y",
        moving: planarMajor >= this.options.imuMoveThreshold,
        quiet: planarMajor <= this.options.imuStillThreshold,
      };
    }

    getCombinedMotion(timestamp) {
      const left = this.getMotionFeatures(SIDE_LEFT, timestamp);
      const right = this.getMotionFeatures(SIDE_RIGHT, timestamp);
      return {
        left,
        right,
        planarMajor: Math.max(left.planarMajor, right.planarMajor),
        planarMinor: Math.max(left.planarMinor, right.planarMinor),
        leading: left.planarMajor >= right.planarMajor ? left : right,
        leadingSide: left.planarMajor >= right.planarMajor ? SIDE_LEFT : SIDE_RIGHT,
        quiet: left.quiet && right.quiet,
      };
    }

    getCopFeatures(timestamp) {
      const recent = this.frameHistory.filter((item) => timestamp - item.timestamp <= this.options.copWindowMs);
      const xs = recent.map((item) => item.centerCop.x);
      const ys = recent.map((item) => item.centerCop.y);
      const xRange = xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
      const yRange = ys.length ? Math.max(...ys) - Math.min(...ys) : 0;
      const path = recent.reduce((distance, item, index) => {
        if (index === 0) return distance;
        const previous = recent[index - 1];
        return distance + Math.hypot(item.centerCop.x - previous.centerCop.x, item.centerCop.y - previous.centerCop.y);
      }, 0);
      const center = {
        x: xs.length ? (Math.max(...xs) + Math.min(...xs)) / 2 : 0.5,
        y: ys.length ? (Math.max(...ys) + Math.min(...ys)) / 2 : 0.5,
      };
      const current = recent.length ? recent[recent.length - 1].centerCop : { x: 0.5, y: 0.5 };
      const loadDeltas = recent.map((item) => Number(item.loadDelta) || 0).sort((a, b) => a - b);
      const supportLoads = recent.map((item) => Number(item.supportLoad) || 0.5).sort((a, b) => a - b);
      const median = (values) => values.length ? values[Math.floor(values.length / 2)] : 0;
      return {
        recent,
        xRange,
        yRange,
        path,
        center,
        current,
        loadDeltaMedian: median(loadDeltas),
        supportLoadMedian: median(supportLoads),
      };
    }

    detectFootFlatEdges(frame) {
      const edges = [];
      SIDES.forEach((side) => {
        const foot = frame.feet[side];
        const previousFoot = this.lastFrame ? this.lastFrame.feet[side] : computeFootFeatures([], side);
        const pressureRise = foot.total - previousFoot.total;
        const flatReady = foot.total >= this.options.footFlatTotalPressure
          && foot.heelRatio >= this.options.footFlatHeelRatio
          && foot.forefootRatio >= this.options.footFlatForefootRatio;
        const enoughTime = frame.timestamp - this.lastFootFlatAt[side] >= this.options.footFlatMinIntervalMs;
        const edge = flatReady
          && enoughTime
          && (!this.footFlatReady[side] || pressureRise >= this.options.footFlatRisePressure);
        if (edge) {
          this.lastFootFlatAt[side] = frame.timestamp;
          edges.push({ side, foot, pressureRise });
        }
        this.footFlatReady[side] = flatReady;
      });
      return edges;
    }

    hadRecentHelaPoint(side, timestamp) {
      const support = side === SIDE_LEFT ? SIDE_RIGHT : SIDE_LEFT;
      return this.frameHistory.some((item) => {
        if (item.timestamp >= timestamp || timestamp - item.timestamp > 760) return false;
        const pointFoot = item[side];
        const supportFoot = item[support];
        const total = pointFoot.total + supportFoot.total;
        const supportLoad = total ? supportFoot.total / total : 0;
        return pointFoot.total >= this.options.lightContactPressure
          && pointFoot.total <= Math.max(this.options.contactPressure * 4.5, supportFoot.total * 0.82)
          && pointFoot.forefootRatio >= this.options.helaForefootRatio * 0.78
          && pointFoot.heelRatio <= this.options.helaHeelRatio * 1.6
          && supportLoad >= 0.55;
      });
    }

    classifyMotionPath(sideMotion) {
      if (!sideMotion.moving) {
        return {
          type: "none",
          lateralScore: 0,
          forwardScore: 0,
          confidence: 0,
        };
      }
      const lateralShareScore = clamp((sideMotion.lateralShare - 0.42) / 0.2, 0, 1);
      const lateralRatioScore = clamp((sideMotion.xyRatio - 0.78) / 0.52, 0, 1);
      const forwardShareScore = clamp((sideMotion.forwardShare - 0.42) / 0.22, 0, 1);
      const forwardRatioScore = clamp((1.18 - sideMotion.xyRatio) / 0.55, 0, 1);
      const lateralScore = (lateralShareScore * 0.55) + (lateralRatioScore * 0.45);
      const forwardScore = (forwardShareScore * 0.58) + (forwardRatioScore * 0.42);
      const margin = Math.abs(lateralScore - forwardScore);
      if (lateralScore >= forwardScore && (sideMotion.xyRatio >= this.options.imuAxisRatioThreshold || sideMotion.lateralShare >= this.options.imuLateralShareThreshold)) {
        return {
          type: "lateral",
          lateralScore,
          forwardScore,
          confidence: clamp(0.58 + margin * 0.6, 0.58, 0.98),
        };
      }
      if (forwardScore > lateralScore && (sideMotion.xyRatio <= this.options.imuAxisRatioThreshold || sideMotion.forwardShare >= this.options.imuForwardShareThreshold)) {
        return {
          type: "forward",
          lateralScore,
          forwardScore,
          confidence: clamp(0.58 + margin * 0.6, 0.58, 0.98),
        };
      }
      return {
        type: "ambiguous",
        lateralScore,
        forwardScore,
        confidence: clamp(0.45 + margin * 0.4, 0.45, 0.78),
      };
    }

    detectImuLanding(side, impactSample) {
      const state = this.imuLanding[side];
      const now = impactSample.timestamp;
      state.lastImpact = impactSample.magnitude;

      if (impactSample.magnitude <= this.options.imuImpactResetThreshold) {
        state.aboveThreshold = false;
        return [];
      }
      if (impactSample.magnitude < this.options.imuImpactThreshold) return [];
      if (state.aboveThreshold) return [];
      if (now - state.lastPulseAt < this.options.imuImpactPulseMinGapMs) return [];

      state.aboveThreshold = true;
      state.lastPulseAt = now;
      state.pulseCount += 1;
      const pulse = {
        timestamp: now,
        impact: impactSample.magnitude,
        dx: impactSample.dx,
        dy: impactSample.dy,
        dz: impactSample.dz,
      };

      if (now < state.lockoutUntil || now - this.lastWalkEventAt < this.options.imuLandingGlobalLockoutMs) return [];
      state.firstPulse = pulse;
      state.lastInterval = null;

      const motion = this.getMotionFeatures(side, now);
      const copFeatures = this.getCopFeatures(now);
      const classification = this.classifyMotionPath(motion);
      if (classification.type === "none") {
        state.firstPulse = pulse;
        return [];
      }
      const type = classification.type === "lateral"
        ? "kaholo"
        : classification.type === "forward"
          ? "hela"
          : motion.xyRatio >= this.options.imuAxisRatioThreshold
            ? "kaholo"
            : "hela";
      if (this.options.enabledSteps[type] === false || !this.canFire(type, now)) {
        state.firstPulse = null;
        return [];
      }

      const phaseCount = type === "kaholo" ? 8 : 4;
      const phase = this.advancePhase(type, phaseCount);
      const confidence = clamp((classification.confidence || 0.58)
        + Math.min(0.24, impactSample.magnitude * 0.08), 0.25, 1);
      const reason = type === "kaholo"
        ? `${sideLabel(side)}IMUの着地パルスを検出。X/Y比 ${motion.xyRatio.toFixed(2)} が横方向寄りなのでKāholoとして発音します。`
        : `${sideLabel(side)}IMUの着地パルスを検出。X/Y比 ${motion.xyRatio.toFixed(2)} が斜め前方向寄りなのでHelaとして発音します。`;
      this.setCurrentGesture(type, phase, phaseCount, confidence, reason, {
        foot: sideLabel(side),
        imuMajor: motion.planarMajor,
        imuMinor: motion.planarMinor,
        imuX: motion.xEnergy,
        imuY: motion.yEnergy,
        imuXYRatio: motion.xyRatio,
        imuLateralShare: motion.lateralShare,
        imuForwardShare: motion.forwardShare,
        impact: impactSample.magnitude,
        impactInterval: null,
        copXRange: copFeatures.xRange,
        copYRange: copFeatures.yRange,
        copPath: copFeatures.path,
        loadDelta: this.lastFrame ? Math.abs(this.lastFrame.balance.rightLoad - this.lastFrame.balance.leftLoad) : 0,
      });

      state.lockoutUntil = now + this.options.imuLandingLockoutMs;
      state.firstPulse = null;
      this.lastWalkEventAt = now;
      const event = this.createPhaseEvent(type, now, {
        label: type === "kaholo" ? "Kāholo" : "Hela",
        side,
        phase,
        phaseCount,
        confidence,
        intensity: clamp(confidence, 0.25, 1),
        reason,
      });
      if (type === "hela") this.lastHelaEvent = event;
      return [event];
    }

    classifyFootFlat(edge, frame, motion) {
      const side = edge.side;
      const support = side === SIDE_LEFT ? SIDE_RIGHT : SIDE_LEFT;
      const sideMotion = motion[side];
      const supportLoad = frame.balance[`${support}Load`];
      const load = frame.balance[`${side}Load`];
      const hadPoint = this.hadRecentHelaPoint(side, frame.timestamp);
      const axisClassification = this.classifyMotionPath(sideMotion);
      const footFlatReady = edge.foot.heelRatio >= this.options.footFlatHeelRatio;
      const helaPressureCue = hadPoint || supportLoad >= 0.54 || edge.foot.forefootRatio >= this.options.helaForefootRatio * 0.72;
      const kaholoPressureCue = edge.pressureRise >= this.options.footFlatRisePressure || load >= 0.42 || supportLoad <= 0.64;
      const helaScore = [
        sideMotion.moving,
        axisClassification.type === "forward",
        sideMotion.forwardShare >= this.options.imuForwardShareThreshold || sideMotion.xyRatio <= this.options.imuAxisRatioThreshold,
        helaPressureCue,
        footFlatReady,
      ].filter(Boolean).length / 5;
      const kaholoScore = [
        sideMotion.moving,
        axisClassification.type === "lateral",
        sideMotion.lateralShare >= this.options.imuLateralShareThreshold || sideMotion.xyRatio >= this.options.imuAxisRatioThreshold,
        kaholoPressureCue,
        footFlatReady,
      ].filter(Boolean).length / 5;

      if ((axisClassification.type === "forward" || (axisClassification.type === "ambiguous" && hadPoint))
        && helaScore >= 0.62) {
        return {
          type: "hela",
          confidence: clamp((helaScore + axisClassification.confidence) / 2, 0.25, 1),
          side,
          support,
          axisClassification,
          reason: `${sideLabel(side)}のフットフラット。IMUのX/Y比 ${sideMotion.xyRatio.toFixed(2)} が前後寄りで、斜め前45度の戻り足として扱います。`,
        };
      }
      if ((axisClassification.type === "lateral" || (axisClassification.type === "ambiguous" && !hadPoint))
        && kaholoScore >= 0.58) {
        return {
          type: "kaholo",
          confidence: clamp((kaholoScore + axisClassification.confidence) / 2, 0.25, 1),
          side,
          support,
          axisClassification,
          reason: `${sideLabel(side)}のフットフラット。IMUのX/Y比 ${sideMotion.xyRatio.toFixed(2)} が横方向寄りで、Kāholoの着地として扱います。`,
        };
      }
      return {
        type: "none",
        confidence: Math.max(helaScore, kaholoScore),
        side,
        support,
        reason: "フットフラットは検出しましたが、Kāholo/HelaのIMU条件が弱いです。",
      };
    }

    advancePhase(type, count) {
      this.phase[type] = (this.phase[type] % count) + 1;
      return this.phase[type];
    }

    setCurrentGesture(type, phase, phaseCount, confidence, reason, signals = {}) {
      const labels = {
        kaholo: "Kāholo",
        hela: "Hela",
        ami: "ʻAmi",
        none: "なし",
      };
      this.currentGesture = {
        type,
        label: labels[type] || type,
        phase,
        phaseCount,
        confidence,
        reason,
        signals,
      };
    }

    createPhaseEvent(type, timestamp, detail) {
      return this.createEvent(type, timestamp, detail);
    }

    getCopPhase(copFeatures) {
      const angle = Math.atan2(copFeatures.current.y - copFeatures.center.y, copFeatures.current.x - copFeatures.center.x);
      const normalized = angle < 0 ? angle + Math.PI * 2 : angle;
      const phase = Math.floor(normalized / (Math.PI * 2 / 8)) + 1;
      return { key: String(phase), phase, phaseLabel: `${phase}/8` };
    }

    detectCopGesture(frame, combinedMotion, copFeatures) {
      const bothContact = frame.feet.left.total >= this.options.contactPressure
        && frame.feet.right.total >= this.options.contactPressure;
      if (!bothContact || !combinedMotion.quiet) return { type: "none", confidence: 0 };
      const lateralReady = copFeatures.xRange >= this.options.copLateralThreshold;
      const forwardReady = copFeatures.yRange >= this.options.copForwardThreshold;
      const centeredLoad = copFeatures.loadDeltaMedian <= this.options.amiMaxLoadDelta;
      if (lateralReady && forwardReady && copFeatures.path >= this.options.amiCopPath && centeredLoad) {
        return {
          type: "ami",
          confidence: clamp((copFeatures.xRange / this.options.copLateralThreshold + copFeatures.yRange / this.options.copForwardThreshold + copFeatures.path / this.options.amiCopPath + (1 - copFeatures.loadDeltaMedian / Math.max(this.options.amiMaxLoadDelta, 0.001))) / 4, 0, 1),
          reason: "IMUは静かで、左右荷重差を抑えながらCoPが前後左右に動いています。",
        };
      }
      return { type: "none", confidence: 0 };
    }

    detectGesturePhases(frame) {
      const now = frame.timestamp;
      const motion = {
        left: this.getMotionFeatures(SIDE_LEFT, now),
        right: this.getMotionFeatures(SIDE_RIGHT, now),
      };
      const combinedMotion = this.getCombinedMotion(now);
      const copFeatures = this.getCopFeatures(now);
      const events = [];

      if (!events.length) {
        const copGesture = this.detectCopGesture(frame, combinedMotion, copFeatures);
        if (copGesture.type === "ami") {
          const phaseInfo = this.getCopPhase(copFeatures);
          const phaseCount = 8;
          this.phase[copGesture.type] = phaseInfo.phase;
          this.setCurrentGesture(copGesture.type, phaseInfo.phase, phaseCount, copGesture.confidence, copGesture.reason, {
            imuMajor: combinedMotion.planarMajor,
            imuXYRatio: combinedMotion.leading.xyRatio,
            imuLateralShare: combinedMotion.leading.lateralShare,
            imuForwardShare: combinedMotion.leading.forwardShare,
            copXRange: copFeatures.xRange,
            copYRange: copFeatures.yRange,
            copPath: copFeatures.path,
            loadDelta: copFeatures.loadDeltaMedian,
          });
          if (this.options.enabledSteps[copGesture.type] !== false
            && this.lastCopPhase[copGesture.type] !== phaseInfo.key
            && this.canFire(copGesture.type, now)) {
            this.lastCopPhase[copGesture.type] = phaseInfo.key;
            events.push(this.createPhaseEvent(copGesture.type, now, {
              label: "ʻAmi",
              side: "both",
              phase: phaseInfo.phase,
              phaseCount,
              phaseLabel: phaseInfo.phaseLabel,
              confidence: copGesture.confidence,
              intensity: clamp(copGesture.confidence, 0.25, 1),
              reason: copGesture.reason,
            }));
          }
        } else if (combinedMotion.quiet && copFeatures.xRange < this.options.copLateralThreshold && copFeatures.yRange < this.options.copForwardThreshold) {
          this.setCurrentGesture("none", null, null, 0, "IMUもCoPも大きく変化していません。", {
            imuMajor: combinedMotion.planarMajor,
            imuXYRatio: combinedMotion.leading.xyRatio,
            copXRange: copFeatures.xRange,
            copYRange: copFeatures.yRange,
            copPath: copFeatures.path,
            loadDelta: copFeatures.loadDeltaMedian,
          });
        }
      }

      this.updateGestureExplanations(frame, motion, combinedMotion, copFeatures);
      return events;
    }

    updateGestureExplanations(frame, motion, combinedMotion, copFeatures) {
      const currentType = this.currentGesture.type;
      const formatPercent = (value) => `${Math.round((Number(value) || 0) * 100)}%`;
      const leftLanding = this.imuLanding.left;
      const rightLanding = this.imuLanding.right;
      this.explanations.kaholo = {
        active: currentType === "kaholo",
        state: currentType === "kaholo" ? `フェイズ ${this.currentGesture.phase}/8` : "待機",
        phase: currentType === "kaholo" ? this.currentGesture.phase : this.phase.kaholo || null,
        phaseCount: 8,
        score: currentType === "kaholo" ? this.currentGesture.confidence : Math.max(
          motion.left.lateralShare / Math.max(this.options.imuLateralShareThreshold, 0.001),
          motion.right.lateralShare / Math.max(this.options.imuLateralShareThreshold, 0.001),
        ) * (combinedMotion.planarMajor >= this.options.imuMoveThreshold ? 1 : 0.45),
        sequence: [],
        reason: currentType === "kaholo" ? this.currentGesture.reason : "IMUの着地パルス + X/Y比が横方向寄りになる状態を待っています。",
        details: [
          "発音: initial contact相当のIMUパルスを検出した瞬間",
          `IMU X/Y比: 左 ${motion.left.xyRatio.toFixed(2)} / 右 ${motion.right.xyRatio.toFixed(2)} / 横目安 ${this.options.imuAxisRatioThreshold.toFixed(2)}以上`,
          `横成分比: 左 ${formatPercent(motion.left.lateralShare)} / 右 ${formatPercent(motion.right.lateralShare)} / 目安 ${formatPercent(this.options.imuLateralShareThreshold)}以上`,
          `直近パルス: 左 ${leftLanding.lastImpact.toFixed(3)} / 右 ${rightLanding.lastImpact.toFixed(3)} / 閾値 ${this.options.imuImpactThreshold.toFixed(3)}`,
          "フェイズ: 8ステップでドレミファソラシド",
        ],
        algorithm: [
          "加速度差分のパルスをinitial contact相当として検出し、その瞬間に1回だけ発音します。",
          "abs(ΔX)/abs(ΔY)が1以上、またはX成分が52%以上なら横移動系の着地としてKāholoに寄せます。",
          "発音後は約390msロックアウトし、同じ着地中の再発音を防ぎます。",
        ],
        metrics: [
          { label: "左IMUパルス", value: leftLanding.lastImpact, threshold: this.options.imuImpactThreshold, pass: leftLanding.lastImpact >= this.options.imuImpactThreshold },
          { label: "右IMUパルス", value: rightLanding.lastImpact, threshold: this.options.imuImpactThreshold, pass: rightLanding.lastImpact >= this.options.imuImpactThreshold },
          { label: "左X/Y比", value: motion.left.xyRatio, threshold: this.options.imuAxisRatioThreshold, pass: motion.left.xyRatio >= this.options.imuAxisRatioThreshold },
          { label: "右X/Y比", value: motion.right.xyRatio, threshold: this.options.imuAxisRatioThreshold, pass: motion.right.xyRatio >= this.options.imuAxisRatioThreshold },
          { label: "左横成分比", value: motion.left.lateralShare, threshold: this.options.imuLateralShareThreshold, display: formatPercent(motion.left.lateralShare), thresholdLabel: `目安 ${formatPercent(this.options.imuLateralShareThreshold)}`, pass: motion.left.lateralShare >= this.options.imuLateralShareThreshold },
          { label: "右横成分比", value: motion.right.lateralShare, threshold: this.options.imuLateralShareThreshold, display: formatPercent(motion.right.lateralShare), thresholdLabel: `目安 ${formatPercent(this.options.imuLateralShareThreshold)}`, pass: motion.right.lateralShare >= this.options.imuLateralShareThreshold },
        ],
      };
      this.explanations.hela = {
        active: currentType === "hela",
        state: currentType === "hela" ? `フェイズ ${this.currentGesture.phase}/4` : "待機",
        phase: currentType === "hela" ? this.currentGesture.phase : this.phase.hela || null,
        phaseCount: 4,
        score: currentType === "hela" ? this.currentGesture.confidence : Math.max(
          motion.left.forwardShare / Math.max(this.options.imuForwardShareThreshold, 0.001),
          motion.right.forwardShare / Math.max(this.options.imuForwardShareThreshold, 0.001),
        ) * (combinedMotion.planarMajor >= this.options.imuMoveThreshold ? 1 : 0.45),
        candidateSide: currentType === "hela" ? this.currentGesture.signals.foot : null,
        reason: currentType === "hela" ? this.currentGesture.reason : "IMUの着地パルス + Y成分が増える斜め前45度の動きを待っています。",
        details: [
          "発音: initial contact相当のIMUパルスを検出した瞬間",
          `IMU X/Y比: 左 ${motion.left.xyRatio.toFixed(2)} / 右 ${motion.right.xyRatio.toFixed(2)} / Hela目安 ${this.options.imuAxisRatioThreshold.toFixed(2)}以下`,
          `前後成分比: 左 ${formatPercent(motion.left.forwardShare)} / 右 ${formatPercent(motion.right.forwardShare)} / 目安 ${formatPercent(this.options.imuForwardShareThreshold)}以上`,
          `直近パルス: 左 ${leftLanding.lastImpact.toFixed(3)} / 右 ${rightLanding.lastImpact.toFixed(3)} / 閾値 ${this.options.imuImpactThreshold.toFixed(3)}`,
          "フェイズ: 4ステップでギターのドミソシ",
        ],
        algorithm: [
          "加速度差分のパルスをinitial contact相当として検出し、その瞬間に1回だけ発音します。",
          "abs(ΔX)/abs(ΔY)が1以下、またはY成分が50%以上なら斜め前45度のHelaに寄せます。",
          "発音後は約390msロックアウトし、同じ着地中の再発音を防ぎます。",
        ],
        metrics: [
          { label: "左IMUパルス", value: leftLanding.lastImpact, threshold: this.options.imuImpactThreshold, pass: leftLanding.lastImpact >= this.options.imuImpactThreshold },
          { label: "右IMUパルス", value: rightLanding.lastImpact, threshold: this.options.imuImpactThreshold, pass: rightLanding.lastImpact >= this.options.imuImpactThreshold },
          { label: "左X/Y比", value: motion.left.xyRatio, threshold: this.options.imuAxisRatioThreshold, pass: motion.left.xyRatio <= this.options.imuAxisRatioThreshold },
          { label: "右X/Y比", value: motion.right.xyRatio, threshold: this.options.imuAxisRatioThreshold, pass: motion.right.xyRatio <= this.options.imuAxisRatioThreshold },
          { label: "左前後成分比", value: motion.left.forwardShare, threshold: this.options.imuForwardShareThreshold, display: formatPercent(motion.left.forwardShare), thresholdLabel: `目安 ${formatPercent(this.options.imuForwardShareThreshold)}`, pass: motion.left.forwardShare >= this.options.imuForwardShareThreshold },
          { label: "右前後成分比", value: motion.right.forwardShare, threshold: this.options.imuForwardShareThreshold, display: formatPercent(motion.right.forwardShare), thresholdLabel: `目安 ${formatPercent(this.options.imuForwardShareThreshold)}`, pass: motion.right.forwardShare >= this.options.imuForwardShareThreshold },
        ],
      };
      this.explanations.ami = {
        active: currentType === "ami",
        state: currentType === "ami" ? `フェイズ ${this.currentGesture.phase}/8` : "待機",
        phase: currentType === "ami" ? this.currentGesture.phase : this.phase.ami || null,
        phaseCount: 8,
        score: currentType === "ami" ? this.currentGesture.confidence : Math.min(copFeatures.xRange / Math.max(this.options.copLateralThreshold, 0.001), copFeatures.yRange / Math.max(this.options.copForwardThreshold, 0.001)),
        reason: currentType === "ami" ? this.currentGesture.reason : "IMUが静かで、CoPが前後左右に動く状態を待っています。",
        details: [
          "発音: ʻAmi状態に入る/CoP角度フェイズが変わる瞬間",
          `CoP横: ${copFeatures.xRange.toFixed(3)} / 閾値 ${this.options.copLateralThreshold.toFixed(3)}`,
          `CoP前後: ${copFeatures.yRange.toFixed(3)} / 閾値 ${this.options.copForwardThreshold.toFixed(3)}`,
          `CoP軌跡: ${copFeatures.path.toFixed(3)} / 閾値 ${this.options.amiCopPath.toFixed(3)}`,
          `左右荷重差中央値: ${formatPercent(copFeatures.loadDeltaMedian)} / 上限 ${formatPercent(this.options.amiMaxLoadDelta)}`,
        ],
        algorithm: [
          "両足接地かつIMUが静かな状態を前提にします。",
          "CoP横レンジと前後レンジが両方閾値を超えるかを見ます。",
          "左右荷重差が大きすぎず、CoP軌跡長が十分に伸びている場合、円/楕円運動としてʻAmiにします。",
          "CoP角度の8フェイズが変わった時に、Gのウインドシンセを鳴らします。",
        ],
        metrics: [
          { label: "IMU主軸", value: combinedMotion.planarMajor, threshold: this.options.imuStillThreshold, pass: combinedMotion.planarMajor <= this.options.imuStillThreshold },
          { label: "CoP横レンジ", value: copFeatures.xRange, threshold: this.options.copLateralThreshold, pass: copFeatures.xRange >= this.options.copLateralThreshold },
          { label: "CoP前後レンジ", value: copFeatures.yRange, threshold: this.options.copForwardThreshold, pass: copFeatures.yRange >= this.options.copForwardThreshold },
          { label: "CoP軌跡長", value: copFeatures.path, threshold: this.options.amiCopPath, pass: copFeatures.path >= this.options.amiCopPath },
          { label: "左右荷重差中央値", value: copFeatures.loadDeltaMedian, threshold: this.options.amiMaxLoadDelta, display: formatPercent(copFeatures.loadDeltaMedian), thresholdLabel: `上限 ${formatPercent(this.options.amiMaxLoadDelta)}`, pass: copFeatures.loadDeltaMedian <= this.options.amiMaxLoadDelta },
        ],
      };
    }

    detectKaholo(frame) {
      const threshold = this.options.kaholoLoadThreshold;
      const side = frame.balance.rightLoad >= threshold
        ? SIDE_RIGHT
        : frame.balance.leftLoad >= threshold
          ? SIDE_LEFT
          : null;
      const now = frame.timestamp;
      const events = [];
      const pressureReady = frame.total >= this.options.contactPressure * 2;

      if (side && pressureReady && side !== this.lastShiftSide && now - this.lastShiftAt >= this.options.kaholoMinShiftMs) {
        this.shiftHistory.push({ side, timestamp: now });
        this.lastShiftSide = side;
        this.lastShiftAt = now;
      }

      this.shiftHistory = this.shiftHistory.filter((shift) => now - shift.timestamp <= this.options.kaholoMaxWindowMs);
      const recent = this.shiftHistory.slice(-4);
      const alternating = recent.length === 4 && recent.every((shift, index) => index === 0 || shift.side !== recent[index - 1].side);
      const windowMs = recent.length === 4 ? recent[3].timestamp - recent[0].timestamp : 0;
      const score = recent.length / 4;
      const sequence = recent.map((shift) => shift.side);

      this.explanations.kaholo = {
        active: alternating,
        state: alternating ? "成立中: 次のシフト待ち" : recent.length ? `蓄積中: ${recent.length}/4` : "待機",
        score,
        sequence,
        reason: formatReason([
          `必要: 左右交互の荷重シフト4回 / 現在: ${sequence.map(sideLabel).join(" -> ") || "なし"}`,
          `左荷重 ${(frame.balance.leftLoad * 100).toFixed(0)}%`,
          `右荷重 ${(frame.balance.rightLoad * 100).toFixed(0)}%`,
        ]),
        details: [
          `センサー: 左右の合計圧(1-6)`,
          `閾値: 片側荷重 ${(threshold * 100).toFixed(0)}%以上`,
          `接地: 合計圧 ${frame.total.toFixed(0)} / 必要 ${this.options.contactPressure * 2}`,
          `状態遷移: 待機 -> 左/右シフト蓄積 -> 4回交互で発音 -> 次の変化待ち`,
        ],
      };

      if (alternating && windowMs <= this.options.kaholoMaxWindowMs && this.enterState("kaholo", true, now)) {
        const direction = recent[0].side === SIDE_LEFT ? "left-start" : "right-start";
        events.push(this.createEvent("kaholo", now, {
          label: "Kāholo",
          side: direction,
          intensity: clamp(Math.abs(frame.balance.rightLoad - frame.balance.leftLoad) * 2, 0.2, 1),
          reason: `${(windowMs / 1000).toFixed(1)}秒以内に左右交互の荷重シフト4回を検出しました。`,
        }));
        this.shiftHistory = recent.slice(-1);
      } else if (!alternating) {
        this.enterState("kaholo", false, now);
      }

      return events;
    }

    detectHela(frame) {
      const now = frame.timestamp;
      const sides = [
        { point: SIDE_LEFT, support: SIDE_RIGHT },
        { point: SIDE_RIGHT, support: SIDE_LEFT },
      ];
      let best = null;

      sides.forEach(({ point, support }) => {
        const pointFoot = frame.feet[point];
        const supportFoot = frame.feet[support];
        const supportLoad = frame.balance[`${support}Load`];
        const pointIsLight = pointFoot.total >= this.options.lightContactPressure
          && pointFoot.total <= Math.max(this.options.contactPressure * 4, supportFoot.total * 0.78);
        const forefootReady = pointFoot.forefootRatio >= this.options.helaForefootRatio;
        const heelQuiet = pointFoot.heelRatio <= this.options.helaHeelRatio;
        const supportReady = supportLoad >= this.options.helaSupportLoad && supportFoot.total >= this.options.contactPressure;
        const score = [pointIsLight, forefootReady, heelQuiet, supportReady].filter(Boolean).length / 4;
        const candidate = {
          point,
          support,
          score,
          ready: pointIsLight && forefootReady && heelQuiet && supportReady,
          reason: formatReason([
            `${sideLabel(point)}の前足部(1-4) ${(pointFoot.forefootRatio * 100).toFixed(0)}%`,
            `${sideLabel(point)}の踵(6) ${(pointFoot.heelRatio * 100).toFixed(0)}%`,
            `${sideLabel(support)}の支持荷重 ${(supportLoad * 100).toFixed(0)}%`,
            pointIsLight ? "出した足は軽い接地" : "出した足が軽い接地ではない",
          ]),
        };
        if (!best || candidate.score > best.score) best = candidate;
      });

      this.explanations.hela = {
        active: !!best && best.ready,
        state: best && best.ready ? "成立中: 足を戻すまで再発音しません" : best && best.score > 0 ? "候補あり" : "待機",
        score: best ? best.score : 0,
        candidateSide: best ? best.point : null,
        reason: best ? best.reason : "候補足はありません。",
        details: best ? [
          `センサー: 出す足の前足部(1-4)、踵(6)、支える足の合計圧`,
          `閾値: 前足部 ${(this.options.helaForefootRatio * 100).toFixed(0)}%以上 / 踵 ${(this.options.helaHeelRatio * 100).toFixed(0)}%以下 / 支持荷重 ${(this.options.helaSupportLoad * 100).toFixed(0)}%以上`,
          `現在: 候補 ${sideLabel(best.point)} / スコア ${(best.score * 100).toFixed(0)}%`,
          `状態遷移: 待機 -> 軽い前足部接地 -> 発音 -> 足を戻して解除`,
        ] : [],
      };

      if (best && this.enterState("hela", best.ready, now)) {
        const event = this.createEvent("hela", now, {
          label: "Hela",
          side: best.point,
          intensity: clamp(best.score, 0.25, 1),
          reason: `${sideLabel(best.point)}の軽い前足部(1-4)接地と、${sideLabel(best.support)}の支持荷重を検出しました。`,
        });
        this.lastHelaEvent = event;
        return [event];
      }

      return [];
    }

    detectUwehe(frame) {
      const now = frame.timestamp;
      const left = frame.feet.left;
      const right = frame.feet.right;
      const currentGroundedHeels = left.heelRatio >= this.options.uweheGroundedHeelRatio
        && right.heelRatio >= this.options.uweheGroundedHeelRatio;
      const groundedBefore = currentGroundedHeels || now - this.lastBothHeelsGroundedAt <= 900;
      const bothContact = left.total >= this.options.contactPressure && right.total >= this.options.contactPressure;
      const heelsUp = left.heelRatio <= this.options.uweheHeelRatio && right.heelRatio <= this.options.uweheHeelRatio;
      const forefootLoaded = left.nonHeelRatio >= this.options.uweheForefootRatio && right.nonHeelRatio >= this.options.uweheForefootRatio;
      const ready = groundedBefore && !currentGroundedHeels && bothContact && heelsUp && forefootLoaded;
      const score = [groundedBefore, bothContact, heelsUp, forefootLoaded].filter(Boolean).length / 4;

      this.explanations.uwehe = {
        active: ready,
        state: ready ? "成立中: 踵を戻すまで再発音しません" : groundedBefore ? "踵上げ待ち" : "事前接地待ち",
        score,
        reason: formatReason([
          groundedBefore ? "直前に両踵が接地" : "踵を上げる前の接地が必要",
          `左踵(6) ${(left.heelRatio * 100).toFixed(0)}%`,
          `右踵(6) ${(right.heelRatio * 100).toFixed(0)}%`,
          `前足部+中足部(1-5) 最小${(Math.min(left.nonHeelRatio, right.nonHeelRatio) * 100).toFixed(0)}%`,
        ]),
        details: [
          `センサー: 両足の踵(6)、前足+中足(1-5)`,
          `閾値: 踵 ${(this.options.uweheHeelRatio * 100).toFixed(0)}%以下 / 前足+中足 ${(this.options.uweheForefootRatio * 100).toFixed(0)}%以上`,
          `接地履歴: ${groundedBefore ? "あり" : "なし"} / 両足接地: ${bothContact ? "あり" : "不足"}`,
          `状態遷移: 両踵接地 -> 両踵上げ -> 発音 -> 踵を戻して解除`,
        ],
      };

      if (ready && !this.activeStates.uwehe) {
        const recentlyPointed = this.lastHelaEvent && now - this.lastHelaEvent.timestamp <= this.options.leleUweheWindowMs;
        const type = recentlyPointed ? "leleUwehe" : "uwehe";
        const label = type === "leleUwehe" ? "Lele ʻUwehe" : "ʻUwehe";
        const reason = type === "leleUwehe"
          ? `${this.lastHelaEvent.label || "Hela"}の直後に、前足部+中足部(1-5)に荷重を残した踵上げを検出しました。`
          : "両踵(6)が接地した状態の後、前足部+中足部(1-5)に荷重を残したまま踵上げを検出しました。";
        this.activeStates.uwehe = true;
        this.activeStates.leleUwehe = type === "leleUwehe";
        if (this.canFire(type, now)) return [this.createEvent(type, now, {
          label,
          side: "both",
          intensity: clamp((left.nonHeelRatio + right.nonHeelRatio) / 2, 0.3, 1),
          reason,
        })];
      } else if (!ready) {
        this.enterState("uwehe", false, now);
        this.enterState("leleUwehe", false, now);
      }

      if (currentGroundedHeels && bothContact) {
        this.lastBothHeelsGroundedAt = now;
      }

      return [];
    }

    detectLele(frame) {
      const now = frame.timestamp;
      const candidates = SIDES.map((side) => {
        const foot = frame.feet[side];
        const other = frame.feet[side === SIDE_LEFT ? SIDE_RIGHT : SIDE_LEFT];
        const load = frame.balance[`${side}Load`];
        const otherLoad = frame.balance[`${side === SIDE_LEFT ? SIDE_RIGHT : SIDE_LEFT}Load`];
        const ready = foot.total >= this.options.contactPressure * 2.2
          && other.total >= this.options.contactPressure
          && otherLoad >= 0.16
          && load >= 0.55
          && foot.forefootRatio >= this.options.leleForefootRatio
          && foot.heelRatio <= this.options.leleHeelRatio
          && foot.cop.y <= this.options.leleCopForwardY;
        const score = [
          foot.total >= this.options.contactPressure * 2.2,
          otherLoad >= 0.16,
          load >= 0.55,
          foot.forefootRatio >= this.options.leleForefootRatio,
          foot.heelRatio <= this.options.leleHeelRatio,
          foot.cop.y <= this.options.leleCopForwardY,
        ].filter(Boolean).length / 6;
        return { side, ready, score, load, foot, otherLoad };
      });
      const best = candidates.sort((a, b) => b.score - a.score)[0];

      if (best && best.ready && best.side !== this.lastLeleSide && now - this.lastLeleAt >= this.options.kaholoMinShiftMs) {
        this.leleHistory.push({ side: best.side, timestamp: now });
        this.lastLeleSide = best.side;
        this.lastLeleAt = now;
      }

      this.leleHistory = this.leleHistory.filter((step) => now - step.timestamp <= this.options.leleMaxWindowMs);
      const recent = this.leleHistory.slice(-4);
      const alternating = recent.length === 4 && recent.every((step, index) => index === 0 || step.side !== recent[index - 1].side);
      const sequence = recent.map((step) => step.side);

      this.explanations.lele = {
        active: alternating,
        state: alternating ? "成立中: 次のステップ待ち" : recent.length ? `蓄積中: ${recent.length}/4` : "待機",
        score: Math.max(best ? best.score : 0, recent.length / 4),
        sequence,
        reason: formatReason([
          "仮説: 前足部へ乗る歩行的なLele候補",
          `現在: ${sequence.map(sideLabel).join(" -> ") || "なし"}`,
          best ? `${sideLabel(best.side)} forefoot ${(best.foot.forefootRatio * 100).toFixed(0)}% / heel ${(best.foot.heelRatio * 100).toFixed(0)}% / CoP-Y ${best.foot.cop.y.toFixed(2)}` : "",
        ]),
        details: best ? [
          `センサー: 前足部(1-4)、踵(6)、CoP前後`,
          `閾値: 荷重55%以上 / 前足部 ${(this.options.leleForefootRatio * 100).toFixed(0)}%以上 / 踵 ${(this.options.leleHeelRatio * 100).toFixed(0)}%以下`,
          `現在: 候補 ${sideLabel(best.side)} / 荷重 ${(best.load * 100).toFixed(0)}% / CoP-Y ${best.foot.cop.y.toFixed(2)}`,
          `状態遷移: 待機 -> 前足荷重ステップ蓄積 -> 4回交互で発音 -> 次の変化待ち`,
        ] : [],
      };

      if (alternating && this.enterState("lele", true, now)) {
        const direction = recent[0].side === SIDE_LEFT ? "left-start" : "right-start";
        return [this.createEvent("lele", now, {
          label: "Lele",
          side: direction,
          intensity: clamp((best ? best.score : 0.6), 0.3, 1),
          reason: "前足部に乗り、踵が軽い左右交互の歩行的ステップを4回検出しました。",
        })];
      } else if (!alternating) {
        this.enterState("lele", false, now);
      }

      return [];
    }

    detectAmi(frame) {
      const now = frame.timestamp;
      const recent = this.frameHistory.filter((item) => now - item.timestamp <= this.options.amiWindowMs);
      const grounded = recent.filter((item) => item.left.total >= this.options.contactPressure && item.right.total >= this.options.contactPressure);
      const xs = grounded.map((item) => item.centerCop.x);
      const ys = grounded.map((item) => item.centerCop.y);
      const xRange = xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
      const yRange = ys.length ? Math.max(...ys) - Math.min(...ys) : 0;
      const path = grounded.reduce((distance, item, index) => {
        if (index === 0) return distance;
        const previous = grounded[index - 1];
        return distance + Math.hypot(item.centerCop.x - previous.centerCop.x, item.centerCop.y - previous.centerCop.y);
      }, 0);
      const groundedRatio = recent.length ? grounded.length / recent.length : 0;
      const ready = grounded.length >= 5
        && groundedRatio >= 0.7
        && xRange >= this.options.amiCopRange
        && yRange >= this.options.amiCopRange
        && path >= this.options.amiCopPath;
      const score = [
        grounded.length >= 5,
        groundedRatio >= 0.7,
        xRange >= this.options.amiCopRange,
        yRange >= this.options.amiCopRange,
        path >= this.options.amiCopPath,
      ].filter(Boolean).length / 5;

      this.explanations.ami = {
        active: ready,
        state: ready ? "成立中: CoP軌跡が落ち着くまで再発音しません" : grounded.length ? "軌跡蓄積中" : "待機",
        score,
        reason: formatReason([
          "仮説: 両足接地のままCoPが円/楕円を描くʻAmi候補",
          `CoP横幅 ${xRange.toFixed(2)}`,
          `CoP前後 ${yRange.toFixed(2)}`,
          `軌跡長 ${path.toFixed(2)}`,
          `接地率 ${(groundedRatio * 100).toFixed(0)}%`,
        ]),
        details: [
          `センサー: 全センサーから推定した両足CoP`,
          `閾値: 横幅 ${this.options.amiCopRange.toFixed(2)}以上 / 前後 ${this.options.amiCopRange.toFixed(2)}以上 / 軌跡長 ${this.options.amiCopPath.toFixed(2)}以上`,
          `現在: 横 ${xRange.toFixed(2)} / 前後 ${yRange.toFixed(2)} / 軌跡 ${path.toFixed(2)}`,
          `状態遷移: 両足接地 -> CoP軌跡蓄積 -> 円/楕円候補で発音 -> 軌跡が落ち着いて解除`,
        ],
      };

      if (this.enterState("ami", ready, now)) {
        return [this.createEvent("ami", now, {
          label: "ʻAmi",
          side: "both",
          intensity: clamp(path * 2.2, 0.3, 1),
          reason: "両足接地を保ったまま、CoPが円/楕円に近い軌跡を描く動きを検出しました。",
        })];
      }

      return [];
    }
  }

  function sideLabel(side) {
    if (side === SIDE_LEFT) return "左";
    if (side === SIDE_RIGHT) return "右";
    return side;
  }

  return {
    DEFAULT_OPTIONS,
    SENSOR_LAYOUT,
    DEFAULT_SENSOR_MAP,
    SIDE_LEFT,
    SIDE_RIGHT,
    computeFootFeatures,
    getSensorPosition,
    mapPressureToPhysicalSensors,
    HulaEventDetector,
    HulaSessionRecorder,
  };
});
