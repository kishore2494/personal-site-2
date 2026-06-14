// Imperative scene state shared between React (writes) and the R3F frame loop
// (reads). Kept outside React so pointer/scroll/route changes never trigger
// re-renders — the 3D layer animates by reading these values in useFrame.

import * as THREE from "three";

export type Mood = "home" | "projects" | "articles" | "about" | "contact";

export type Vec3 = [number, number, number];

export type MoodTarget = {
  /** Camera world position when this page is active. */
  camPos: Vec3;
  /** Point the camera looks at (the station's object). */
  focus: Vec3;
  /** 0 = cyan/neural dominant, 1 = amber/star dominant. */
  accent: number;
  /** Short label for the HUD. */
  label: string;
};

// Each page is a different "station" in one continuous universe.
// The camera flies between them. Object components below are placed at these foci.
export const STATIONS: Record<Mood, Vec3> = {
  home: [0, 0, 0], // neural constellation
  projects: [38, -1, 2], // the workstation / computer
  articles: [-34, 7, -8], // the black hole
  about: [8, 32, -12], // the atom
  contact: [-8, -30, 6], // the wireframe planet
};

// Inner pages frame their object high in the viewport (above the title scrim) by
// aiming the camera a few units BELOW the object's center. Home stays centered.
export const MOODS: Record<Mood, MoodTarget> = {
  home: { camPos: [0, 0.5, 15], focus: STATIONS.home, accent: 0.34, label: "NEURAL CORE" },
  projects: { camPos: [38, 0.5, 15], focus: [38, -5, 2], accent: 0.5, label: "WORKSTATION" },
  articles: { camPos: [-34, 8, 7], focus: [-34, 3, -8], accent: 0.22, label: "SINGULARITY" },
  about: { camPos: [8, 33, 1], focus: [8, 28, -12], accent: 0.62, label: "ATOMIC LAB" },
  contact: { camPos: [-8, -29, 19], focus: [-8, -34, 6], accent: 0.45, label: "DEEP SPACE" },
};

export const sceneState = {
  mood: "home" as Mood,
  /** Normalized pointer, -1..1 on each axis. */
  pointer: { x: 0, y: 0 },
  /** Page scroll progress, 0..1. */
  scroll: 0,
  /** Smoothed accent value the renderer actually uses. */
  accent: MOODS.home.accent,
  /** Whether heavy motion/effects should be reduced. */
  reduced: false,
  /** Live camera position (written by the Rig) — read by the HUD telemetry. */
  cam: new THREE.Vector3(0, 0.5, 15),
};

export const setMood = (m: Mood) => {
  sceneState.mood = m;
};
export const setPointer = (x: number, y: number) => {
  sceneState.pointer.x = x;
  sceneState.pointer.y = y;
};
export const setScroll = (s: number) => {
  sceneState.scroll = s;
};
export const setReduced = (r: boolean) => {
  sceneState.reduced = r;
};
