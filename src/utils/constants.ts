import type { ToastPosition } from 'lit-toaster';
// === Constants ===
// App
export const COLOR_PALETTE = Object.freeze({
  white: '#FFFFFF',
  offWhite: '#F5F5EE',
  orange: '#F26522',
  darkOrange: '#d9531f',
});
export const DEFAULT_TOAST_POSITION: ToastPosition = 'bottom-right';

// Cesium
export const MAP_LOADING_MESSAGES: readonly string[] = Object.freeze([
  '🗺️ Hold tight! Arranging pixels...',
  '🧑‍🍳 The Map is cooking...',
  '⏳ Hang on! The globe is spinning up...',
  '🧩 Assembling map...',
  '🐢 Patience, young grasshopper...',
  '🏞️ Painting landscapes...',
  '🚧 Loading tiles...',
  '🛰️ Satellites aligning...',
]);
export const FONT =
  'Avenir, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", Segoe UI Symbol, "Noto Color Emoji"';
export const LAT_LON_DELIMITER_REGEX = /[,/]/;
export const DEFAULT_BILLBOARD_IMAGE_SIZE = 32;
export const HOME_CAMERA_COORDINATES = Object.freeze({
  longitude: -95.7129,
  latitude: 37.0902,
  height: 30000000,
});

// === Events ===
/**
 * Cesium Viewer (element) events
 * @property {string} MAP_LOADED
 * @property {string} FULL_SCREEN_CHANGE
 * @property {string} MENU_INIT_VISIBILITY_STATE
 * @property {string} ENTITIES_ADDED
 * @property {string} ENTITY_LABELS_CHANGE_STATUS
 * @property {string} ENTITY_LABELS_CHANGE
 * @property {string} MAP_OVERLAYS_CHANGE
 * @property {string} FLY_TO_ENTITY
 */
export const CESIUM_VIEWER_EVENT = Object.freeze({
  /** Dispatched after attempt to load cesium finished. Event detail (`event.detail`) contains the return value (true or false) from `loadCesium()` specifying if loading map was success or fail */
  MAP_LOADED: 'map-loaded',
  /** Dispatched onClick full-screen overlay map button. Event detail (`event.detail`) contains the current full-screen mode as true or false */
  FULL_SCREEN_CHANGE: 'full-screen-change',
  /** Dispatched onMount for `<home-page></home-page>` element. Event detail (`event.detail`) contains value true or false depending on whether the current `window.innerWidth` corresponds to a mobile view */
  MENU_INIT_VISIBILITY_STATE: 'menu-init-visibility-state',
  /** Dispatched onClick for menu toggle map overlay button. Event detail (`event.detail`) contains menu open state - value true or false */
  MENU_VISIBILITY_CHANGE: 'menu-visibility-change',
  /** Dispatched once entities are added to `Cesium.Viewer`. Event detail (`event.detail`) contains list of the entities populated on the map */
  ENTITIES_ADDED: 'entities-added',
  /** Dispatched within the flow of `entity-labels-change` event. Event detail (`event.detail`) contains value true or false depending on whether `entity-labels-change` was success or fail */
  ENTITY_LABELS_CHANGE_STATUS: 'entity-labels-change-status',
  /** Dispatched onClick for `Show entity labels` checkbox. Event detail (`event.detail`) contains checkbox state - value true or false */
  ENTITY_LABELS_CHANGE: 'entity-labels-change',
  /** Dispatched onClick for `Show map overlays` checkbox. Event detail (`event.detail`) contains checkbox state - value true or false */
  MAP_OVERLAYS_CHANGE: 'map-overlays-change',
  /** Dispatched onClick for entity list/card button. Event detail (`event.detail`) contains the entity ID of the entity as a number */
  FLY_TO_ENTITY: 'fly-to-entity',
});
