import { LitElement, css, html, nothing, type TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import fullScreenIcon from '../assets/svg/fullscreen.svg';
import fullScreenExitIcon from '../assets/svg/fullscreen-exit.svg';
import { appStore, type UserAgent } from '../stores/app';
import type { Founder, WebPlatform, YCCompany } from '../types/ycCompany';
import { toast } from 'lit-toaster';
import { tooltipStyles } from '../shared/styles/tooltipStyles';
import { truncateTextStyles } from '../shared/styles/truncateTextStyles';
import { rowDividerStyles } from '../shared/styles/dividerStyles';
import {
  CESIUM_VIEWER_EVENT,
  DEFAULT_BILLBOARD_IMAGE_SIZE,
  DEFAULT_TOAST_POSITION,
  FONT,
  HOME_CAMERA_COORDINATES,
  LAT_LON_DELIMITER_REGEX,
  MAP_LOADING_MESSAGES,
} from '../utils/constants';
import { getPlaceholderImage } from '../utils/helperFunctions';

import crunchbase from '../assets/img/socials/crunchbase.png';
import facebook from '../assets/img/socials/facebook.png';
import github from '../assets/img/socials/github.png';
import linkedin from '../assets/img/socials/linkedin.png';
import x from '../assets/img/socials/x.png';

import chrome from '../assets/img/browsers/chrome.png';
import chromium from '../assets/img/browsers/chromium.png';
import edge from '../assets/img/browsers/edge.png';
import firefox from '../assets/img/browsers/firefox.png';
import opera from '../assets/img/browsers/opera.png';
import safari from '../assets/img/browsers/safari.png';
import seamonkey from '../assets/img/browsers/seamonkey.png';
import unknown from '../assets/img/browsers/unknown.png';

import ycCompaniesData from '../data/yc_companies.json';
import '../shared/loading-indicator';

import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const SOCIAL_IMAGES: Readonly<Record<string, string>> = Object.freeze({
  crunchbase: crunchbase,
  facebook: facebook,
  github: github,
  linkedin: linkedin,
  x: x,
});

const BROWSER_IMAGES: Readonly<Record<UserAgent, string>> = Object.freeze({
  chrome: chrome,
  chromium: chromium,
  edge: edge,
  firefox: firefox,
  opera: opera,
  safari: safari,
  seamonkey: seamonkey,
  unknown: unknown,
});

@customElement('cesium-viewer')
export class CesiumViewer extends LitElement {
  @query('#cesiumContainer') _cesiumContainerEl?: HTMLElement;
  @query('#search') _searchInputEl?: HTMLInputElement;
  @state() private _popoverVisible = false;
  @state() private _menuOpen: boolean = true;
  @state() private _fullScreen: boolean = false;
  @state() private _mapLoaded: boolean = false;
  @state() private _showMapOverlays: boolean = true;
  @state() private _popoverX: number = 0;
  @state() private _popoverY: number = 0;
  @state() private _selectedEntity: Cesium.Entity | undefined;
  @state() private _search: string = '';
  private _viewer: Cesium.Viewer | undefined;
  private _cesiumHandler: Cesium.ScreenSpaceEventHandler | undefined;
  private _selectedEntityListener?: () => void;
  private _zooming: number = 0;
  private _zoomSpeed: number = 0.05;

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('keydown', this._onKeydown.bind(this));
    window.addEventListener('keyup', this._onKeyup.bind(this));
    this.addEventListener(
      CESIUM_VIEWER_EVENT.FLY_TO_ENTITY,
      this._onFlyToEntity as EventListener
    );
    this.addEventListener(
      CESIUM_VIEWER_EVENT.ENTITY_LABELS_CHANGE,
      this._onEntityLabelsChange as EventListener
    );
    this.addEventListener(
      CESIUM_VIEWER_EVENT.MAP_OVERLAYS_CHANGE,
      this._onMapOverlaysChange as EventListener
    );
    this.addEventListener(
      CESIUM_VIEWER_EVENT.MENU_INIT_VISIBILITY_STATE,
      this._onMenuInitVisibilityState as EventListener
    );
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._selectedEntityListener?.();
    this._cesiumHandler?.destroy();
    this._cesiumHandler = undefined;
    window.removeEventListener('keydown', this._onKeydown);
    window.removeEventListener('keyup', this._onKeyup);
    this.removeEventListener(
      CESIUM_VIEWER_EVENT.FLY_TO_ENTITY,
      this._onFlyToEntity as EventListener
    );
    this.removeEventListener(
      CESIUM_VIEWER_EVENT.ENTITY_LABELS_CHANGE,
      this._onEntityLabelsChange as EventListener
    );
    this.removeEventListener(
      CESIUM_VIEWER_EVENT.MAP_OVERLAYS_CHANGE,
      this._onMapOverlaysChange as EventListener
    );
    this.removeEventListener(
      CESIUM_VIEWER_EVENT.MENU_INIT_VISIBILITY_STATE,
      this._onMenuInitVisibilityState as EventListener
    );
  }

  private get _ycombinatorEntity(): Cesium.Entity | undefined {
    return this._viewer?.entities.values.find(
      (entity) => entity.name === 'Y Combinator'
    );
  }

  private get _showSearchBar(): boolean {
    if (window.innerWidth <= 640) {
      return this._menuOpen ? false : true;
    }
    return true;
  }

  firstUpdated(): void {
    this._loadCesium().then((result) => {
      if (this._viewer && this._viewer instanceof Cesium.Viewer && result) {
        setTimeout(() => {
          this._mapLoaded = result;
          this._emitEvent(CESIUM_VIEWER_EVENT.MAP_LOADED, result);
          // Reset camera to home and fly to Y Combinator entity on init
          this._flyTo(
            HOME_CAMERA_COORDINATES.longitude,
            HOME_CAMERA_COORDINATES.latitude,
            HOME_CAMERA_COORDINATES.height,
            {
              complete: () => {
                const YC_COORDS = this._getEntityLatLon(
                  this._ycombinatorEntity
                );
                this._flyTo(
                  YC_COORDS?.longitude ?? -122.4215,
                  YC_COORDS?.latitude ?? 37.779,
                  300,
                  {
                    complete: () => {
                      if (YC_COORDS?.latitude && YC_COORDS.longitude) {
                        const position = this._viewer?.camera.position;
                        const newPosition = new Cesium.Cartesian3(
                          position!.x,
                          position!.y,
                          position!.z + 80
                        );
                        this._viewer?.camera.setView({
                          destination: newPosition,
                        });
                        this._viewer!.selectedEntity = this._ycombinatorEntity;
                      }
                    },
                  }
                );
              },
            }
          );
        }, 2500);

        // === Init Cesium (Event) Handler == //
        this._cesiumHandler = new Cesium.ScreenSpaceEventHandler(
          this._viewer.canvas
        );

        // === Mouse (movement) ===
        this._cesiumHandler.setInputAction(
          (event: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
            const { endPosition } = event;

            // Pick object at mouse position
            const pickedObject = this._viewer?.scene.pick(endPosition);

            if (Cesium.defined(pickedObject) && pickedObject.id) {
              // Show cursor pointer for valid picked entity
              this._viewer!.canvas.style.cursor = 'pointer';
            } else {
              this._viewer!.canvas.style.cursor = 'default';
            }
          },
          Cesium.ScreenSpaceEventType.MOUSE_MOVE
        );

        // === Pick entity on map (click) ===
        this._cesiumHandler.setInputAction(() => {
          // Turn off focus for search input onClick cesium map
          if (this.shadowRoot?.activeElement === this._searchInputEl) {
            this._searchInputEl?.blur();
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // === Entity selection changed ===
        this._selectedEntityListener =
          this._viewer.selectedEntityChanged.addEventListener(
            (selectedEntity) => {
              // Picked entity defined
              if (Cesium.defined(selectedEntity)) {
                if (window.innerWidth > 768) {
                  const positionProperty = selectedEntity.position;
                  if (!positionProperty) return;

                  const currentPosition = positionProperty.getValue(
                    Cesium.JulianDate.now()
                  );
                  if (!currentPosition) return;

                  // Convert world position to window (pixel) coordinates
                  const windowPosition =
                    Cesium.SceneTransforms.worldToWindowCoordinates(
                      this._viewer!.scene,
                      currentPosition
                    );

                  // Setup selected entity detail popover
                  if (windowPosition) {
                    const popoverEl = this.renderRoot.querySelector(
                      '#popover'
                    ) as HTMLElement;
                    const popoverWidth = popoverEl?.offsetWidth || 300;
                    const popoverHeight = popoverEl?.offsetHeight || 400;

                    const canvasRect =
                      this._viewer!.canvas.getBoundingClientRect();
                    const margin = 10;

                    // Initial position relative to viewport
                    let x = canvasRect.left + windowPosition.x;
                    let y = canvasRect.top + windowPosition.y;

                    // Vertical placement
                    if (y + popoverHeight + margin > window.innerHeight) {
                      // Flip above if bottom would overflow
                      y = y - popoverHeight - 10;
                      if (y < margin) y = margin; // Clamp top
                    } else {
                      y += 10; // Default below
                    }

                    // Horizontal placement and flip/nudge
                    // Right edge
                    if (x + popoverWidth + margin > window.innerWidth) {
                      // Not enough space on right, try left
                      if (x - popoverWidth - 10 >= margin) {
                        x = x - popoverWidth - 10; // Flip left
                      } else {
                        // If flipping left still overflows, nudge to fit
                        x = window.innerWidth - popoverWidth - margin;
                      }
                    }

                    // Left edge
                    if (x < margin) {
                      x = margin;
                    }

                    // Final clamps
                    x = Math.min(
                      Math.max(x, margin),
                      window.innerWidth - popoverWidth - margin
                    );
                    y = Math.min(
                      Math.max(y, margin),
                      window.innerHeight - popoverHeight - margin
                    );

                    this._popoverX = x;
                    this._popoverY = y;
                  }
                }
                this._popoverVisible = true;
                this._selectedEntity = selectedEntity as Cesium.Entity;
              } else {
                this._popoverVisible = false;
                this._selectedEntity = undefined;
              }
            }
          );
      } else {
        this._emitEvent(CESIUM_VIEWER_EVENT.MAP_LOADED, false);
      }
    });
  }

  render(): TemplateResult {
    return html`
      <!-- Map -->
      <div
        id="cesiumContainer"
        style=${`visibility: ${this._mapLoaded ? 'visible' : 'hidden'};`}
      ></div>
      <!-- Loading indicator -->
      <loading-indicator
        color="orange"
        style=${`visibility: ${!this._mapLoaded ? 'visible' : 'hidden'}`}
      >
        <span slot="text"
          >${MAP_LOADING_MESSAGES[
            Math.floor(Math.random() * MAP_LOADING_MESSAGES.length)
          ]}</span
        >
      </loading-indicator>
      <!-- Overlays -->
      ${this._mapLoaded && this._showMapOverlays
        ? html`
            <!-- Top left -->
            ${this._showSearchBar
              ? html`<div class="overlay-top-left-container">
                  <form @submit=${this._onSearchSubmit} class="search-wrapper">
                    <div class="search-bar">
                      <input
                        id="search"
                        .value=${this._search}
                        @input=${this._onSearchChange}
                        type="text"
                        placeholder="Search and fly to..."
                      />
                      <button type="submit">🔍</button>
                    </div>
                  </form>
                </div>`
              : nothing}
            <!-- Top right -->
            <div class="overlay-top-right-container">
              <div class="tooltip tooltip-left">
                <button
                  type="button"
                  @click=${(): Promise<boolean> =>
                    this._flyTo(
                      HOME_CAMERA_COORDINATES.longitude,
                      HOME_CAMERA_COORDINATES.latitude,
                      HOME_CAMERA_COORDINATES.height
                    )}
                >
                  🌍
                </button>
                <span class="tooltiptext">Reset Camera</span>
              </div>
              <div class="tooltip tooltip-left">
                <button
                  type="button"
                  @mousedown=${(): void => this._startZoom(1)}
                  @mouseup=${(): void => this._stopZoom()}
                  @mouseleave=${(): void => this._stopZoom()}
                >
                  ➕
                </button>
                <span class="tooltiptext">Zoom In</span>
              </div>
              <div class="tooltip tooltip-left">
                <button
                  type="button"
                  @mousedown=${(): void => this._startZoom(-1)}
                  @mouseup=${(): void => this._stopZoom()}
                  @mouseleave=${(): void => this._stopZoom()}
                >
                  ➖
                </button>
                <span class="tooltiptext">Zoom Out</span>
              </div>
            </div>
            <!-- Bottom left -->
            ${!this._fullScreen
              ? html` <div class="overlay-bottom-left-container">
                  <div class="tooltip tooltip-right">
                    <button
                      type="button"
                      @click=${(): void =>
                        this._emitEvent(
                          CESIUM_VIEWER_EVENT.MENU_VISIBILITY_CHANGE,
                          (this._menuOpen = !this._menuOpen)
                        )}
                    >
                      ${this._menuOpen ? '‹' : '›'}
                    </button>
                    <span class="tooltiptext"
                      >${this._menuOpen ? 'Collapse menu' : 'Open menu'}</span
                    >
                  </div>
                </div>`
              : nothing}
            <!-- Bottom right -->
            <div class="overlay-bottom-right-container">
              <div class="tooltip tooltip-left">
                <button
                  @click=${(): void => {
                    this._fullScreen = !this._fullScreen;
                    this._emitEvent(
                      CESIUM_VIEWER_EVENT.FULL_SCREEN_CHANGE,
                      this._fullScreen
                    );
                    this._emitEvent(
                      CESIUM_VIEWER_EVENT.MENU_VISIBILITY_CHANGE,
                      !this._fullScreen
                    );
                    this._menuOpen = !this._fullScreen;
                  }}
                  type="button"
                >
                  ${this._fullScreen
                    ? html`<img
                        src=${fullScreenExitIcon}
                        alt="Exit full screen icon"
                      />`
                    : html`<img
                        src=${fullScreenIcon}
                        alt="Full screen icon"
                      /> `}
                </button>
                <span class="tooltiptext">
                  ${this._fullScreen ? 'Exit full screen' : 'Full Screen'}</span
                >
              </div>
            </div>
          `
        : nothing}
      <!-- Entity detail popover -->
      ${this._mapLoaded &&
      this._popoverVisible &&
      this._selectedEntity &&
      this._selectedEntity.properties
        ? html`
            <div
              id="popover"
              style="left: ${this._popoverX}px; top: ${this._popoverY}px;"
            >
              <div id="popoverContainer">
                <div class="popover-close">
                  <div class="tooltip tooltip-left">
                    <button
                      type="button"
                      @click=${(): void =>
                        (this._viewer!.selectedEntity = undefined)}
                    >
                      X
                    </button>
                    <span class="tooltiptext">Close</span>
                  </div>
                </div>
                <!-- Top row -->
                <div class="popover-top-row">
                  <div class="popover-logo-col">
                    <img
                      src=${this._selectedEntity.properties.logoImage}
                      alt="${this._selectedEntity.properties.name} logo"
                    />
                  </div>
                  <div class="popover-info-col">
                    <h2>${this._selectedEntity.properties.name}</h2>
                    <div class="tagline">
                      ${this._selectedEntity.properties.description}
                    </div>
                  </div>
                </div>
                <!-- Tags -->
                <div class="tags">
                  ${this._selectedEntity.properties.batch.getValue()
                    ? html` <span class="tag batch"
                        >${this._selectedEntity.properties.batch}</span
                      >`
                    : nothing}
                  ${this._selectedEntity.properties.status.getValue()
                    ? html` <span class="tag status"
                        >${this._selectedEntity.properties.status}</span
                      >`
                    : nothing}
                  ${this._selectedEntity.properties.industry.getValue().length
                    ? html` ${this._selectedEntity.properties.industry
                        .getValue()
                        .map((industry: string) => {
                          return html` <span class="tag">${industry}</span>`;
                        })}`
                    : nothing}
                </div>
                <div class="row-divider"></div>
                <!-- Company cta (links) -->
                <div class="popover-company-cta-col">
                  <a
                    class="yc-company-page"
                    href=${this._selectedEntity.properties.yc_page_url}
                    target="_blank"
                    >Company</a
                  >
                  <div class="company-page">
                    ${this._selectedEntity.properties.company_pages
                      .getValue()
                      ?.filter(
                        (item: WebPlatform) =>
                          item.platform.toLowerCase() === 'company website'
                      )
                      .map(
                        (item: WebPlatform) =>
                          html`🔗&nbsp;
                            <a
                              class="website"
                              href=${item.url}
                              target="_blank"
                              data-tooltip-content=${item.platform}
                              aria-label=${item.platform}
                            >
                              ${item.url}
                            </a>`
                      ) ?? nothing}
                  </div>
                </div>
                <div class="row-divider"></div>
                <!-- About -->
                <div class="popover-about-col truncate">
                  ${this._selectedEntity.properties.about}
                </div>
                <!-- Founders -->
                ${this._selectedEntity.properties.getValue().founders?.length
                  ? html`
                      <div class="founders-list">
                        <h2 class="section-header-title">Founders</h2>
                        ${this._selectedEntity.properties
                          .getValue()
                          .founders.map(
                            (founder: Founder) => html`
                              <!-- Founder card -->
                              <div class="founder-card">
                                <!-- Avatar -->
                                <img
                                  class="founder-avatar"
                                  src=${`${!founder.has_placeholder_avatar ? new URL(`../assets/img/avatars/${founder.avatar}.png`, import.meta.url).href : founder.avatar}`}
                                  alt="${founder.name}"
                                />
                                <!-- Info -->
                                <div class="founder-info">
                                  <div class="founder-header">
                                    <!-- Name -->
                                    <span class="founder-name"
                                      >${founder.name}</span
                                    >
                                    <!-- Social profiles -->
                                    ${founder.social_media_profiles.length
                                      ? html`${founder.social_media_profiles.map(
                                          (item: WebPlatform) => {
                                            return html`
                                              <div
                                                class="tooltip tooltip-bottom"
                                              >
                                                <a
                                                  href=${item.url}
                                                  target="_blank"
                                                  data-tooltip-content=${item.platform}
                                                  aria-label=${item.platform}
                                                >
                                                  <img
                                                    src=${SOCIAL_IMAGES[
                                                      item.platform.toLowerCase()
                                                    ]}
                                                    alt="${item.platform} logo"
                                                  />
                                                </a>
                                                <span class="tooltiptext"
                                                  >${item.platform}</span
                                                >
                                              </div>
                                            `;
                                          }
                                        )}`
                                      : nothing}
                                  </div>
                                  <!-- Job title -->
                                  <div class="founder-job-title">
                                    ${founder.job_title}
                                  </div>
                                  <!-- Bio -->
                                  ${founder.bio
                                    ? html`<div class="founder-bio">
                                        ${founder.bio}
                                      </div>`
                                    : nothing}
                                </div>
                              </div>
                            `
                          )}
                      </div>
                    `
                  : nothing}
                <!-- Company photos -->
                <div class="company-photos">
                  ${this._selectedEntity.properties.company_photos.getValue()
                    .length
                    ? html` <h2 class="section-header-title">Company Photos</h2>
                        ${this._selectedEntity.properties.company_photos
                          .getValue()
                          .map((companyPhoto: string) => {
                            return html`<img
                              src=${new URL(
                                `../assets/img/company_photos/${companyPhoto}.png`,
                                import.meta.url
                              ).href}
                              alt="${this._selectedEntity?.properties
                                ?.name} company photo"
                            />`;
                          })}`
                    : nothing}
                </div>
                <!-- YC info card -->
                <div class="yc-info-card">
                  <div class="yc-company-logo">
                    <a
                      href=${this._selectedEntity.properties.yc_page_url}
                      target="_blank"
                    >
                      <img
                        src=${this._selectedEntity.properties.logoImage}
                        alt="${this._selectedEntity.properties.name} logo"
                      />
                    </a>
                  </div>
                  <div class="yc-company-name">
                    <a
                      href=${this._selectedEntity.properties.yc_page_url}
                      target="_blank"
                      >${this._selectedEntity.properties.name}</a
                    >
                  </div>
                  <!-- YC company details -->
                  <div class="yc-company-details">
                    <!-- Founded -->
                    ${this._selectedEntity.properties.founded.getValue()
                      ? html`<div class="detail-row">
                          <span>Founded:</span
                          ><span
                            >${this._selectedEntity.properties.founded}</span
                          >
                        </div>`
                      : nothing}
                    <!-- Batch -->
                    ${this._selectedEntity.properties.batch.getValue()
                      ? html`<div class="detail-row">
                          <span>Batch:</span
                          ><span>${this._selectedEntity.properties.batch}</span>
                        </div>`
                      : nothing}
                    <!-- Team size -->
                    ${this._selectedEntity.properties.team_size.getValue()
                      ? html`<div class="detail-row">
                          <span>Team Size:</span
                          ><span
                            >${this._selectedEntity.properties.team_size}</span
                          >
                        </div>`
                      : nothing}
                    <!-- Status -->
                    ${this._selectedEntity.properties.status.getValue()
                      ? html`<div class="detail-row">
                          <span>Status:</span>
                          <span class="status"
                            ><div class="status-dot"></div>
                            ${this._selectedEntity.properties.status}</span
                          >
                        </div>`
                      : nothing}
                    <!-- Primary partner -->
                    ${this._selectedEntity.properties.primary_partner.getValue()
                      ? html`<div class="detail-row">
                          <span>Primary Partner:</span
                          ><a
                            href=${`https://www.ycombinator.com/people/${this._selectedEntity.properties.primary_partner
                              .getValue()
                              .toLowerCase()
                              .replace(' ', '-')}`}
                            target="_blank"
                            >${this._selectedEntity.properties
                              .primary_partner}</a
                          >
                        </div>`
                      : nothing}
                    <!-- Location -->
                    ${this._selectedEntity.properties.region.getValue()
                      ? html`<div class="detail-row">
                          <span>Location:</span
                          ><span
                            >${this._selectedEntity.properties.region}</span
                          >
                        </div>`
                      : nothing}
                    <!-- Latitude / Longitude -->
                    ${this._selectedEntity.properties.hasLocation.getValue()
                      ? html`<div class="detail-row">
                          <span>Coordinates:</span
                          ><span
                            class="coords-detail-row-right-text detail-row-right-text"
                            >${this._getEntityLatLon(
                              this._selectedEntity
                            )?.latitude.toFixed(6)}/${this._getEntityLatLon(
                              this._selectedEntity
                            )?.longitude.toFixed(6)}
                          </span>
                        </div>`
                      : nothing}
                    <!-- Address -->
                    ${this._selectedEntity?.properties?.location?.getValue()
                      ?.short_address
                      ? html`<div class="detail-row">
                          <span>Address:</span
                          ><span class="detail-row-right-text">
                            ${this._selectedEntity?.properties?.location?.getValue()
                              ?.short_address}
                          </span>
                        </div>`
                      : nothing}
                  </div>
                  ${this._selectedEntity.properties.company_pages.getValue()
                    .length
                    ? html`<div class="social-row">
                        ${this._selectedEntity.properties.company_pages
                          .getValue()
                          .map((item: WebPlatform) => {
                            return html`
                              <div class="tooltip tooltip-bottom">
                                <a
                                  href=${item.url}
                                  target="_blank"
                                  data-tooltip-content=${item.platform}
                                  aria-label=${item.platform}
                                >
                                  ${item.platform.toLowerCase() ===
                                  'company website'
                                    ? html` <img
                                        src=${BROWSER_IMAGES[
                                          appStore.userAgent
                                        ]}
                                        alt="${item.platform} logo"
                                      />`
                                    : html` <img
                                        src=${SOCIAL_IMAGES[
                                          item.platform.toLowerCase()
                                        ]}
                                        alt="${item.platform} logo"
                                      />`}
                                </a>
                                <span class="tooltiptext"
                                  >${item.platform}</span
                                >
                              </div>
                            `;
                          })}
                      </div>`
                    : nothing}
                </div>
              </div>
            </div>
          `
        : nothing}
    `;
  }

  /**
   * Get latitude and longitude in degrees for a Cesium entity
   * @param entity
   */
  private _getEntityLatLon(
    entity: Cesium.Entity | undefined
  ): { latitude: number; longitude: number } | undefined {
    if (!entity || !entity?.position) return;

    const position = entity.position.getValue(Cesium.JulianDate.now());
    if (!position) return;

    const cartographic = Cesium.Cartographic.fromCartesian(
      position as Cesium.Cartesian3
    );
    return {
      latitude: Cesium.Math.toDegrees(cartographic.latitude),
      longitude: Cesium.Math.toDegrees(cartographic.longitude),
    };
  }

  /** Load cesium (init map) */
  private async _loadCesium(): Promise<boolean> {
    if (!this._cesiumContainerEl) return false;
    try {
      //! WebGL not enabled
      if (!appStore.webGLEnabled) {
        throw new Error(
          'Could not load map. Browser or device may not support WebGL.'
        );
      }
      Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION;
      // Setup and config viewer
      this._viewer = new Cesium.Viewer(this._cesiumContainerEl as HTMLElement, {
        terrain: Cesium.Terrain.fromWorldTerrain(),
        baseLayer: new Cesium.ImageryLayer(
          new Cesium.OpenStreetMapImageryProvider({})
        ),
        navigationHelpButton: false,
        infoBox: false,
        baseLayerPicker: false,
        animation: false,
        geocoder: false,
        timeline: false,
        sceneModePicker: false,
        fullscreenButton: false,
        selectionIndicator: false,
        homeButton: false,
      });

      // Add Cesium OSM Buildings, a global 3D buildings layer
      Cesium.createOsmBuildingsAsync().then((buildingTileset) => {
        this._viewer?.scene.primitives.add(buildingTileset);
      });

      // Enable zoom
      this._viewer.scene.screenSpaceCameraController.enableZoom = true;

      // Allow zooming using mouse wheel and touch pinch gestures
      this._viewer.scene.screenSpaceCameraController.zoomEventTypes = [
        Cesium.CameraEventType.WHEEL,
        Cesium.CameraEventType.PINCH,
      ];

      // Adjust maximum and minimum zoom distances
      this._viewer.scene.screenSpaceCameraController.maximumZoomDistance = 1000000000;
      this._viewer.scene.screenSpaceCameraController.minimumZoomDistance = 10;

      // Get yc companies JSON
      const data: YCCompany[] = ycCompaniesData;
      if (!data || !data.length || typeof data !== 'object') {
        throw new Error('Entities not found or invalid');
      }

      // Add and plot entities [yc companies]
      for (const item of data) {
        const hasLocation =
          !!item.location?.latitude && !!item.location?.longitude;
        const hasLogo = Boolean(item.logo);
        const image = hasLogo
          ? `logos/${item.logo}.png`
          : await getPlaceholderImage(item.name ?? '?');

        for (const founder of item.founders) {
          if (!founder.avatar) {
            founder.avatar = await getPlaceholderImage(founder.name ?? '?');
            founder.has_placeholder_avatar = true;
          }
        }

        this._viewer.entities.add({
          id: String(item.id),
          name: item.name,
          position: hasLocation
            ? Cesium.Cartesian3.fromDegrees(
                item.location.longitude as number,
                item.location.latitude as number
              )
            : undefined,
          show: hasLocation,
          point: {
            pixelSize: 0,
          },
          billboard: {
            image,
            width: DEFAULT_BILLBOARD_IMAGE_SIZE,
            height: DEFAULT_BILLBOARD_IMAGE_SIZE,
          },
          label: {
            text: item.name,
            font: `14pt ${FONT}`,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.WHITE,
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            pixelOffset: new Cesium.Cartesian2(0, 32),
            show: true,
          },
          properties: {
            ...item,
            logoImage: image,
            hasLocation,
            hasLogo,
          },
        });
      }

      if (this._viewer?.entities.values) {
        this._emitEvent(
          CESIUM_VIEWER_EVENT.ENTITIES_ADDED,
          this._viewer?.entities.values
        );
      }

      return true;
    } catch (error: unknown) {
      console.error(error);
      return false;
    }
  }

  /**
   * Fly to destination on the map
   * @param longitude
   * @param latitude
   * @param height
   * @param options
   * @param options.orientation
   * @param options.duration
   * @param options.complete
   * @param options.cancel
   * @param options.endTransform
   * @param options.maximumHeight
   * @param options.pitchAdjustHeight
   * @param options.flyOverLongitude
   * @param options.flyOverLongitudeWeight
   * @param options.convert
   * @param options.easingFunction
   */
  private _flyTo(
    longitude?: number,
    latitude?: number,
    height: number | undefined = 3000,
    options: {
      orientation?: unknown;
      duration?: number;
      complete?: Cesium.Camera.FlightCompleteCallback;
      cancel?: Cesium.Camera.FlightCancelledCallback;
      endTransform?: Cesium.Matrix4;
      maximumHeight?: number;
      pitchAdjustHeight?: number;
      flyOverLongitude?: number;
      flyOverLongitudeWeight?: number;
      convert?: boolean;
      easingFunction?: Cesium.EasingFunction.Callback;
    } = {}
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        if (
          longitude == null ||
          latitude == null ||
          isNaN(longitude) ||
          isNaN(latitude)
        ) {
          toast.show(
            'Failed to fly to entity',
            undefined,
            'error',
            DEFAULT_TOAST_POSITION
          );
          throw Error();
        }
        this._viewer?.camera.flyTo({
          ...options,
          destination: Cesium.Cartesian3.fromDegrees(
            longitude,
            latitude,
            height
          ),
        });
        resolve(true);
      } catch {
        reject(false);
      }
    });
  }

  /**
   * Handle search form submit
   * @param event
   */
  private _onSearchSubmit(event: Event): void {
    event.preventDefault();
    const isLatLon = LAT_LON_DELIMITER_REGEX.test(this._search);
    const coords = String(this._search)
      .split(LAT_LON_DELIMITER_REGEX) // Split on "," or "/"
      .map((c) => c.trim());

    let longitude;
    let latitude;
    let message;
    let matchedEntity: Cesium.Entity | undefined;

    // Searching lat/lon
    if (isLatLon && coords.length === 2) {
      latitude = parseFloat(coords[0]);
      longitude = parseFloat(coords[1]);
      message = `Fly to coordinates [${latitude}/${longitude}] successfully!`;
    } else {
      // Otherwise searching entity name
      const entitiesArray = Array.from(this._viewer?.entities.values || []);
      matchedEntity = entitiesArray.find((entity) =>
        entity.name?.toLowerCase().includes(this._search.toLowerCase())
      );

      if (
        matchedEntity &&
        matchedEntity.properties &&
        matchedEntity.properties.hasLocation.getValue() &&
        matchedEntity.position
      ) {
        const entityCoords = this._getEntityLatLon(matchedEntity);
        latitude = entityCoords?.latitude;
        longitude = entityCoords?.longitude;
        message = `Fly to ${matchedEntity.name} (entity) successfully!`;
      } else {
        toast.show(
          'Entity not found on the map. Please try again.',
          undefined,
          'error',
          DEFAULT_TOAST_POSITION
        );
        return;
      }
    }
    this._viewer!.selectedEntity = undefined;
    this._flyTo(longitude as number, latitude as number, undefined, {
      complete: () => {
        this._viewer!.selectedEntity = matchedEntity;
      },
    }).then((result) => {
      if (result) {
        toast.show(message, undefined, 'success', DEFAULT_TOAST_POSITION);
      }
    });
  }

  /**
   * Handle search change
   * @param event
   */
  private _onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this._search = input.value.trim();
  }

  /**
   * Handle `fly-to-entity` event
   * @param event
   */
  private _onFlyToEntity(event: CustomEvent): void {
    const entityId = event.detail;
    if (!entityId || isNaN(entityId)) return;

    const entitiesArray = Array.from(this._viewer?.entities.values || []);
    const matchedEntity = entitiesArray.find(
      (entity) => entity.id === String(entityId)
    );

    if (
      matchedEntity &&
      matchedEntity.properties &&
      matchedEntity.properties.hasLocation.getValue() &&
      matchedEntity.position
    ) {
      const entityCoords = this._getEntityLatLon(matchedEntity);
      this._viewer!.selectedEntity = undefined;
      this._flyTo(
        entityCoords?.longitude as number,
        entityCoords?.latitude as number,
        undefined,
        {
          complete: () => {
            this._viewer!.selectedEntity = matchedEntity;
          },
        }
      ).then((result) => {
        if (result) {
          toast.show(
            `Fly to ${matchedEntity.name} (entity) successfully!`,
            undefined,
            'success',
            DEFAULT_TOAST_POSITION
          );
        }
      });
    } else {
      toast.show(
        'Entity not found on the map. Please try again.',
        undefined,
        'error',
        DEFAULT_TOAST_POSITION
      );
      return;
    }
  }

  /**
   * Handle `entity-labels-change` event
   * @param event
   */
  private _onEntityLabelsChange(event: CustomEvent): void {
    const value = Boolean(event.detail);
    try {
      if (this._viewer?.entities?.values) {
        const entitiesArray = Array.from(this._viewer.entities.values);
        for (const entity of entitiesArray) {
          // Only update if the entity has a label
          if (entity.label) {
            entity.label.show = new Cesium.ConstantProperty(value);
          }
        }
      }
      this._emitEvent(CESIUM_VIEWER_EVENT.ENTITY_LABELS_CHANGE_STATUS, value);
    } catch {
      this._emitEvent(
        CESIUM_VIEWER_EVENT.ENTITY_LABELS_CHANGE_STATUS,
        undefined
      );
      toast.show(
        'Failed to change label visiblity.',
        undefined,
        'error',
        DEFAULT_TOAST_POSITION
      );
    }
  }

  /**
   * Handle `map-overlays-change` event
   * @param event
   */
  private _onMapOverlaysChange(event: CustomEvent): void {
    const value = Boolean(event.detail);
    this._showMapOverlays = value;
  }

  /**
   * Handle `menu-init-visibility-state` event
   * @param event
   */
  private _onMenuInitVisibilityState(event: CustomEvent): void {
    this._menuOpen = Boolean(event.detail);
  }

  /**
   * Handle window `keydown` event
   * @param event
   */
  private _onKeydown(event: KeyboardEvent): void {
    if (event.code === 'Equal') this._startZoom(1);
    if (event.code === 'Minus') this._startZoom(-1);
    if (event.key === 'Escape' && this._fullScreen) {
      this._fullScreen = false;
      this._menuOpen = true;
      this._emitEvent(CESIUM_VIEWER_EVENT.FULL_SCREEN_CHANGE, false);
    }
  }

  /**
   * Handle window `keyup` event
   * @param event
   */
  private _onKeyup(event: KeyboardEvent): void {
    if (event.code === 'Equal' || event.code === 'Minus') this._stopZoom();
  }

  /**
   * Handle start zoom on `keydown` or `mousedown`
   * @param direction
   */
  private _startZoom(direction: 1 | -1): void {
    this._zooming = direction;
    requestAnimationFrame(this._zoomStep.bind(this));
  }

  /**
   * Handle stop zoom on `keyup` or `mouseup`
   */
  private _stopZoom(): void {
    this._zooming = 0;
  }

  /**
   * Handle zoom (animation) step
   */
  private _zoomStep(): void {
    if (!this._viewer || this._zooming === 0) return;

    const camera = this._viewer.camera;
    const controller = this._viewer.scene.screenSpaceCameraController;

    // Get current height
    const cartographic = Cesium.Cartographic.fromCartesian(camera.position);
    const height = cartographic.height;

    // Compute intended move distance
    let distance = this._zooming * this._zoomSpeed * height;

    // Don't allow zoom (in and out) to exceed min/max zoom distance
    if (height - distance < controller.minimumZoomDistance) {
      distance = height - controller.minimumZoomDistance;
    } else if (height - distance > controller.maximumZoomDistance) {
      distance = height - controller.maximumZoomDistance;
    }

    // Move the camera
    camera.moveForward(distance);

    // Continue to next frame if still zooming
    if (this._zooming !== 0) {
      requestAnimationFrame(this._zoomStep.bind(this));
    }
  }

  /**
   * Emit an `Event` (local `dispatchEvent()` wrapper)
   * @param name
   * @param detail
   */
  private _emitEvent(name: string, detail: unknown): void {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  static styles = [
    tooltipStyles,
    truncateTextStyles,
    rowDividerStyles,
    css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
        position: relative;
      }

      /** Cesium container */

      #cesiumContainer,
      canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: block;
      }

      .cesium-widget-credits {
        display: none !important;
      }

      .overlay-top-left-container {
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .overlay-top-center-container {
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .overlay-top-right-container {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .overlay-bottom-left-container {
        position: absolute;
        bottom: 10px;
        left: 10px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .overlay-bottom-right-container {
        position: absolute;
        bottom: 10px;
        right: 10px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .overlay-top-right-container button,
      .overlay-bottom-left-container button,
      .overlay-bottom-right-container button {
        background-color: var(--white);
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        padding: 6px;
        color: var(--black);
        font-size: 16px;
      }

      .overlay-bottom-right-container button {
        display: flex;
        align-items: center;
      }

      /** Search bar */

      .search-wrapper {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .search-bar {
        display: flex;
        align-items: center;
        width: 100%;
        max-width: 400px;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 4px;
        overflow: hidden;
      }

      .search-bar:focus-within {
        border-color: #007bff;
      }

      .search-bar input {
        flex: 1;
        border: none;
        outline: none;
        padding: 10px 16px;
        font-size: 16px;
        border-radius: 50px 0 0 50px;
      }

      .search-bar button {
        color: #fff;
        border: none;
        outline: none;
        padding: 10px 16px;
        font-size: 16px;
        cursor: pointer;
        border-radius: 20%;
        transition: background 0.3s ease;
      }

      .search-bar button:hover {
        background: #268bd2ff;
      }

      /* Popover */

      #popover {
        position: fixed;
        max-width: 500px;
        max-height: 400px;
        overflow-y: auto;
        background: var(--offWhite);
        color: var(--black);
        padding: 12px;
        border-radius: 10px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
        z-index: 1000;
      }

      #popoverContainer {
        display: flex;
        flex-direction: column;
        border-radius: 12px;
        padding: 16px;
        width: 100%;
        box-sizing: border-box;
      }

      .popover-close {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: transparent;
        font-size: 1.25rem;
        line-height: 1;
      }

      .popover-close button {
        color: red;
        background-color: transparent;
        border: none;
        cursor: pointer;
        font-weight: bold;
      }

      .popover-close button:hover {
        opacity: 0.75;
      }

      .popover-top-row {
        display: flex;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .popover-logo-col {
        flex-shrink: 0;
        margin-right: 20px;
        align-self: center;
      }

      .popover-logo-col img {
        width: 80px;
        height: 80px;
        border-radius: 8px;
        object-fit: contain;
      }

      .popover-info-col {
        display: flex;
        flex-direction: column;
        flex: 1;
      }

      .popover-company-cta-col {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      a.yc-company-page {
        text-decoration: none;
        color: #333;
        font-weight: bold;
        font-size: 0.85rem;
        padding: 6px;
      }

      a.yc-company-page:hover {
        background: #edebe3;
        border-radius: 6px;
      }

      .company-page {
        margin-left: auto;
        display: flex;
        align-self: center;
      }

      .company-page a {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 1.5rem;
        text-decoration: none;
        color: #268bd2ff;
      }

      .company-page a:hover {
        text-decoration: underline;
      }

      .popover-about-col {
        font-size: 0.95rem;
        line-height: 1.4;
        color: #444;
      }

      /** Founder list and card */

      .founders-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .founder-card {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #fff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .founder-avatar {
        width: 64px;
        height: 64px;
        border-radius: 8px;
        object-fit: cover;
      }

      .founder-info {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .founder-info a {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 1.5rem;
        width: 1.5rem;
        border-radius: 0.375rem;
        transition: background 0.2s;
      }

      .founder-info a:hover {
        background-color: #e5e7eb;
      }

      .founder-info a > img {
        height: 1rem;
        width: 1rem;
      }

      .founder-info a[aria-label='LinkedIn'] > img {
        height: 1.25rem;
        width: 1.25rem;
      }

      .founder-header {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .founder-name {
        font-weight: bold;
        font-size: 16px;
        color: #111;
      }

      .founder-job-title {
        font-size: 14px;
        color: #555;
        margin-bottom: 6px;
      }

      .founder-bio {
        font-size: 14px;
        line-height: 1.4;
        color: #333;
      }

      /* Company photos */

      .company-photos {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
      }

      .company-photos img {
        border-radius: 8px;
      }

      /* YC info card */

      .yc-info-card {
        display: flex;
        flex-direction: column;
        padding: 16px;
        margin-top: 29px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      }

      .yc-company-logo {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .yc-company-logo img {
        max-width: 100px;
        height: auto;
        border-radius: 8px;
      }

      .yc-company-logo img:hover {
        opacity: 0.93;
      }

      .yc-company-name {
        font-size: 1.25rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
      }

      .yc-company-name a {
        font-weight: 700;
        font-size: 1.25rem;
        line-height: 1.75rem;
        text-decoration: none;
        color: #333;
      }

      .yc-company-name a:hover {
        color: rgb(38 139 210);
      }

      .yc-company-details {
        padding-top: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
      }

      .social-row {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        align-items: center;
        margin-top: 0.5em;
      }

      .social-row a {
        display: flex;
        height: 2.25rem;
        width: 2.25rem;
        align-items: center;
        justify-content: center;
        border-radius: 0.375rem;
        border: 1px solid #ebebeb;
        background-color: #fff;
        transition: background-color 150ms;
      }

      .social-row a:hover {
        background-color: #f9fafb;
      }

      .social-row a img {
        display: inline-block;
        width: 1.25rem;
        height: 1.25rem;
      }

      .detail-row a {
        text-decoration: none;
        color: #268bd2ff;
      }

      .detail-row a:hover {
        text-decoration: underline;
      }

      .status {
        display: flex;
        align-items: center;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #22c55e;
        margin-right: 6px;
      }

      /** Tags */

      .tagline {
        font-size: 1.1rem;
        margin: 6px 0 14px;
        color: #333;
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 8px 0 12px;
      }

      .tag {
        background: #e6e4dc;
        border-radius: 6px;
        padding: 4px 10px;
        font-size: 0.85rem;
        letter-spacing: 0.05em;
        font-weight: 100;
        text-transform: uppercase;
      }

      .tag.batch {
        background: #fff0e6;
        color: #e65100;
        display: flex;
        align-items: center;
      }

      .tag.batch::before {
        content: 'Y';
        font-weight: bold;
        margin-right: 6px;
        background: #ff6d00;
        color: white;
        font-size: 0.7rem;
        padding: 2px 4px;
        border-radius: 3px;
      }

      .tag.status {
        display: flex;
        align-items: center;
      }

      .tag.status::before {
        content: '';
        display: inline-block;
        width: 8px;
        height: 8px;
        background: #00c389;
        border-radius: 50%;
        margin-right: 6px;
      }

      .detail-row-right-text {
        text-align: right;
      }

      .section-header-title {
        margin-top: 1rem;
        font-size: 1.5rem;
        font-weight: bold;
        color: #333333;
      }

      h2 {
        margin: 0;
        font-size: 1.6rem;
        font-weight: 700;
      }

      loading-indicator {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }

      @media only screen and (max-width: 640px) {
        .search-bar input {
          width: 150px;
        }

        #popover {
          max-width: 90%;
          transform: translateX(2.3%);
        }

        .coords-detail-row-right-text {
          word-break: break-all;
        }
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'cesium-viewer': CesiumViewer;
  }
}
