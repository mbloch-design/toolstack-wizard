/**
 * The onboarding hello (29/10/2026), choreographed in script because each letter and word has its own timing.
 * Languages pass through a soft-edged window like a well-oiled counter: the word in place accelerates out
 * through the top while the next one decelerates in from below (expo curves, light motion blur, no bounce).
 * The greeting then rises word by word and stays, a thin line underlines the name, and the hand waves.
 * The hand is not keyframed: a damped spring (the wrist) follows a commanded wave at a human pace, and a slower
 * spring lifts the arm, so the two never move quite together. Returns a stop function.
 */
const EXPO_OUT = "cubic-bezier(.16, 1, .3, 1)";
const EXPO_IN = "cubic-bezier(.7, 0, .84, 0)";
const IN = 520, OUT = 360, HOLD = 60, STAGGER = 14;
const RISE: Keyframe[] = [
  { transform: "translateY(110%)", filter: "blur(5px)", opacity: 0 },
  { transform: "translateY(0)", filter: "blur(0)", opacity: 1 },
];
const LEAVE: Keyframe[] = [
  { transform: "translateY(0)", filter: "blur(0)", opacity: 1 },
  { transform: "translateY(-110%)", filter: "blur(5px)", opacity: 0 },
];

export function playHello(root: HTMLElement, onLanded: () => void): () => void {
  const anims: Animation[] = [];
  const timers: number[] = [];
  let raf = 0;
  const play = (el: Element, frames: Keyframe[], options: KeyframeAnimationOptions) => anims.push(el.animate(frames, { fill: "both", ...options }));

  let t = 0;
  root.querySelectorAll<HTMLElement>(".so-hw").forEach((word) => {
    const letters = [...word.querySelectorAll("i")];
    const leaveAt = t + IN * .55 + HOLD;
    letters.forEach((letter, i) => {
      play(letter, RISE, { duration: IN, delay: t + i * STAGGER, easing: EXPO_OUT });
      // Forwards only, or the exit would override the entrance before it even starts.
      play(letter, LEAVE, { duration: OUT, delay: leaveAt + i * STAGGER, easing: EXPO_IN, fill: "forwards" });
    });
    // The next word rises once this one has picked up speed: they cross inside the window.
    t = leaveAt + OUT * .5;
  });

  const parts = [...root.querySelectorAll(".so-hello-final > span:not(.so-wave)")];
  parts.forEach((part, i) => play(part, [
    { transform: "translateY(110%)", filter: "blur(6px)", opacity: 0 },
    { transform: "translateY(0)", filter: "blur(0)", opacity: 1 },
  ], { duration: 1000, delay: t + i * 70, easing: EXPO_OUT }));
  const settled = t + parts.length * 70 + 420;
  const underline = root.querySelector(".so-hello-final em > i");
  if (underline) play(underline, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 800, delay: settled, easing: EXPO_OUT });
  const hand = root.querySelector<HTMLElement>(".so-wave");
  // The hand takes its turn in the phrase, between the greeting and the name, so the line never shows a hole.
  const handAt = hand ? t + [...hand.parentElement!.children].indexOf(hand) * 70 + 120 : 0;
  if (hand) timers.push(window.setTimeout(() => { raf = requestAnimationFrame((now) => wave(hand, now, (id) => { raf = id; })); }, handAt));
  timers.push(window.setTimeout(onLanded, settled - 200));

  return () => { anims.forEach((anim) => anim.cancel()); timers.forEach(window.clearTimeout); cancelAnimationFrame(raf); };
}

function wave(el: HTMLElement, start: number, schedule: (id: number) => void) {
  // Wrist angle (deg), arm height (em, 0 = resting) and scale, each with its velocity.
  const st = { a: -28, va: 0, y: .55, vy: 0, s: .45, vs: 0 };
  const spring = (x: number, v: number, target: number, k: number, c: number, dt: number) => { const next = v + (k * (target - x) - c * v) * dt; return [x + next * dt, next]; };
  const ease = (x: number) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  let t = 0, last = start;
  const step = (now: number) => {
    // Fixed steps keep the simulation stable whatever the display rate.
    for (let frame = Math.min(.05, (now - last) / 1000); frame > 0; frame -= 1 / 240) {
      const dt = Math.min(frame, 1 / 240); t += dt;
      // A real hello: the hand lifts first, then about 1.5 swings a second, wider outwards, then it lowers unhurried.
      const envelope = ease((t - .25) / .45) * (1 - ease((t - 1.9) / .7));
      [st.a, st.va] = spring(st.a, st.va, envelope * (16 * Math.sin(2 * Math.PI * 1.5 * (t - .25)) + 5), 150, 15, dt);
      [st.y, st.vy] = spring(st.y, st.vy, -.07 * ease(t / .5) * (1 - ease((t - 2.1) / .6)), 60, 15, dt);
      [st.s, st.vs] = spring(st.s, st.vs, 1, 90, 17, dt);
    }
    last = now;
    el.style.opacity = String(Math.min(1, Math.max(0, (st.s - .45) / .4)));
    el.style.transform = `translate(${(st.a * .0016).toFixed(4)}em, ${st.y.toFixed(4)}em) rotate(${st.a.toFixed(3)}deg) scale(${st.s.toFixed(4)})`;
    const calm = t > 2.8 && Math.abs(st.a) < .05 && Math.abs(st.va) < .5 && Math.abs(st.y) < .001;
    if (calm) { el.style.transform = "none"; return; }
    schedule(requestAnimationFrame(step));
  };
  schedule(requestAnimationFrame(step));
}
