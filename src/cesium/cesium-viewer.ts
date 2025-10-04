import { Router } from '@vaadin/router';
import { LitElement, css, html, nothing, type TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import fullScreenIcon from '../assets/svg/fullscreen.svg';
import fullScreenExitIcon from '../assets/svg/fullscreen-exit.svg';
import { appStore } from '../stores/app';
import type { YCCompany } from '../types/ycCompany';
import { toast } from 'lit-toaster';
import { tooltipStyles } from '../shared/styles/tooltipStyles';
import { truncateTextStyles } from '../shared/styles/truncateTextStyles';
import { rowDividerStyles } from '../shared/styles/dividerStyles';
import { cesiumOverlayStyles } from './styles/cesiumOverlayStyles';
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
import { getEntityLatLon } from '../utils/cesiumFunctions';

import ycCompaniesData from '../data/yc_companies.json';

import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

import '../shared/loading-indicator';
import './cesium-overlay';
import './cesium-entity-detail-popover';

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
      CESIUM_VIEWER_EVENT.SHOW_ENTITY_ITEM_DETAIL_POPOVER,
      this._onShowEntityItemDetailPopover as EventListener
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
      CESIUM_VIEWER_EVENT.SHOW_ENTITY_ITEM_DETAIL_POPOVER,
      this._onShowEntityItemDetailPopover as EventListener
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
                const YC_COORDS = getEntityLatLon(this._ycombinatorEntity);
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
              if (
                Cesium.defined(selectedEntity) &&
                Cesium.defined(selectedEntity.properties) &&
                'hasLocation' in selectedEntity.properties
              ) {
                if (window.innerWidth > 768) {
                  // Setup selected entity detail popover position
                  const positionProperty = selectedEntity?.position;
                  let windowPosition: Cesium.Cartesian2 | undefined;

                  if (positionProperty) {
                    const currentPosition = positionProperty.getValue(
                      Cesium.JulianDate.now()
                    );
                    // Convert world position to window (pixel) coordinates
                    windowPosition =
                      Cesium.SceneTransforms.worldToWindowCoordinates(
                        this._viewer!.scene,
                        currentPosition
                      );
                  }

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
                  } else {
                    // Default popover position on medium-large screens
                    this._popoverX = 262;
                    this._popoverY = 140;
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
      <!-- Cesium Overlay -->
      ${this._mapLoaded && this._showMapOverlays
        ? html`
            <cesium-overlay>
              ${this._showSearchBar
                ? html`
                    <div slot="overlay-top-left">
                      <form
                        @submit=${this._onSearchSubmit}
                        class="search-wrapper"
                      >
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
                    </div></cesium-overlay
                  >`
                : nothing}
              <div slot="overlay-top-right">
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
              ${!this._fullScreen
                ? html` <div slot="overlay-bottom-left">
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
              <div slot="overlay-bottom-right">
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
                    ${this._fullScreen
                      ? 'Exit full screen'
                      : 'Full Screen'}</span
                  >
                </div>
              </div>
            </cesium-overlay>
          `
        : nothing}
      <!-- Entity detail popover -->
      ${this._mapLoaded && this._popoverVisible
        ? html`<cesium-entity-detail-popover
            .popoverX=${this._popoverX}
            .popoverY=${this._popoverY}
            .selectedEntity=${this._selectedEntity}
            @close-popover=${(): void =>
              (this._viewer!.selectedEntity = undefined)}
          ></cesium-entity-detail-popover>`
        : nothing}
    `;
  }

  /** Load cesium (init map) */
  private async _loadCesium(): Promise<boolean> {
    if (!this._cesiumContainerEl) return false;
    try {
      //! WebGL not enabled
      if (!appStore.webGLEnabled) {
        Router.go('/webgl-error');
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
        const entityCoords = getEntityLatLon(matchedEntity);
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
    if (!entityId || isNaN(entityId)) {
      toast.show(
        'Unable to preform action. Please try again.',
        undefined,
        'error',
        DEFAULT_TOAST_POSITION
      );
      return;
    }

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
      const entityCoords = getEntityLatLon(matchedEntity);
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
   * Handle `show-entity-detail-popover` event
   * @param event
   */
  private _onShowEntityItemDetailPopover(event: CustomEvent): void {
    const entityId = event.detail;
    if (!entityId || isNaN(entityId)) {
      toast.show(
        'Unable to preform action. Please try again.',
        undefined,
        'error',
        DEFAULT_TOAST_POSITION
      );
      return;
    }

    const entitiesArray = Array.from(this._viewer?.entities.values || []);
    const matchedEntity = entitiesArray.find(
      (entity) => entity.id === String(entityId)
    );

    if (matchedEntity && matchedEntity.properties) {
      this._viewer!.selectedEntity = matchedEntity;
    } else {
      toast.show(
        'Unable to display entity detail.',
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
    cesiumOverlayStyles,
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
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'cesium-viewer': CesiumViewer;
  }
}
