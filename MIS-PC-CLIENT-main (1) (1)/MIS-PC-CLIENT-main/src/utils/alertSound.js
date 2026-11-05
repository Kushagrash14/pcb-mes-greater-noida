// utils/alertSound.js

let ctx = null;
let unsupported = false;
let warned = false;
let activeNodes = []; // oscillators of the alarm currently playing

const clamp = (n, min, max, fallback) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
};

function warnOnce(msg, err) {
  if (warned) return;
  warned = true;
  console.warn(`[alertSound] ${msg}`, err || "");
}

function getCtx() {
  if (unsupported) return null;

  // a closed context can't be reused, so make a new one
  if (ctx && ctx.state === "closed") ctx = null;

  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) {
        unsupported = true;
        warnOnce("Web Audio is not supported in this browser.");
        return null;
      }
      ctx = new AC();
    } catch (err) {
      unsupported = true;
      warnOnce("Could not create AudioContext.", err);
      return null;
    }
  }
  return ctx;
}

// Browsers block audio until the user interacts with the page.
// Safe to call as often as you like (every keydown / click).
export function unlockAudio() {
  try {
    const c = getCtx();
    if (c && c.state !== "running") {
      c.resume().catch(() => {});
    }
  } catch (err) {
    warnOnce("unlockAudio failed.", err);
  }
}

// "running" | "suspended" | "closed" | "unsupported"
export function getAudioState() {
  if (unsupported) return "unsupported";
  return ctx ? ctx.state : "suspended";
}

function stopActiveAlarm() {
  activeNodes.forEach((osc) => {
    try {
      osc.stop();
      osc.disconnect();
    } catch {
      /* already stopped */
    }
  });
  activeNodes = [];
}

function schedule(c, { beeps, freq, beepMs, gapMs, volume }) {
  stopActiveAlarm(); // a new alarm replaces the old one instead of layering on it

  const ramp = 0.01; // 10 ms fade in/out, avoids clicks
  const beepSec = beepMs / 1000;
  let t = c.currentTime;

  for (let i = 0; i < beeps; i++) {
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = "square"; // harsh, cuts through factory noise
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + ramp);
    gain.gain.setValueAtTime(volume, t + beepSec - ramp);
    gain.gain.linearRampToValueAtTime(0, t + beepSec);

    osc.connect(gain).connect(c.destination);
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        /* ignore */
      }
      activeNodes = activeNodes.filter((n) => n !== osc);
    };

    osc.start(t);
    osc.stop(t + beepSec);
    activeNodes.push(osc);

    t += beepSec + gapMs / 1000;
  }
}

// Never throws. Returns true if an alarm was started or queued.
export function playAlarm(options = {}) {
  try {
    const opts = {
      beeps: Math.round(clamp(options.beeps, 1, 20, 3)),
      freq: clamp(options.freq, 100, 4000, 900),
      beepMs: clamp(options.beepMs, 50, 2000, 200),
      gapMs: clamp(options.gapMs, 0, 2000, 100),
      volume: clamp(options.volume, 0, 1, 1),
    };

    const c = getCtx();
    if (!c) return false;

    if (c.state === "running") {
      schedule(c, opts);
      return true;
    }

    // Not running (autoplay policy or sleeping device): try to resume, but only
    // play if that happens quickly. A late alarm for an old error is misleading.
    let stale = false;
    const staleTimer = setTimeout(() => {
      stale = true;
    }, 500);

    c.resume()
      .then(() => {
        clearTimeout(staleTimer);
        if (stale) return;
        if (c.state === "running") schedule(c, opts);
        else warnOnce("Audio is not running. Click or press a key on the page once.");
      })
      .catch((err) => {
        clearTimeout(staleTimer);
        warnOnce("Audio could not be resumed.", err);
      });

    return true;
  } catch (err) {
    warnOnce("playAlarm failed.", err);
    return false;
  }
}

// Handy for checking the speaker: type testAlarm() in the browser console.
if (typeof window !== "undefined" && import.meta.env?.DEV) {
  window.testAlarm = () => playAlarm({ beeps: 3 });
}