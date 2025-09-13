import { LitElement, html, css, type TemplateResult, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import {
  CESIUM_VIEWER_EVENT,
  DEFAULT_TOAST_POSITION,
} from '../utils/constants';
import { tooltipStyles } from '../shared/styles/tooltipStyles';
import { currentYear } from '../utils/dateFunctions';
import { toast } from 'lit-toaster';
import type { Entity, PropertyBag } from 'cesium';
import { appStore } from '../stores/app';
import { dialogStyles } from '../shared/styles/dialogStyles';
import { rowDividerStyles } from '../shared/styles/dividerStyles';
import { linkStyles } from '../shared/styles/linkStyles';
import { truncateTextStyles } from '../shared/styles/truncateTextStyles';

import '../components/app-top-bar';
import '../cesium/cesium-viewer';

const TABS = {
  Entities: 0,
  'Map Controls': 1,
};

@customElement('home-page')
export class HomePage extends LitElement {
  @query('cesium-viewer') private _cesiumViewerEl!: HTMLElement;
  @query('#aboutDialog') private _aboutDialogEl!: HTMLDialogElement;
  @state() private _entites: Entity[] = [];
  @state() private _mapLoaded: null | boolean = null;
  @state() private _showHeader: boolean = true;
  @state() private _showSidebarMenu: boolean =
    window.innerWidth <= 768 ? false : true; // TODO: Implement `onresize` event listener to dynamically track and update the window width - show/hide menu and other possibly cases
  @state() private _showEntityLabels: boolean = true;
  @state() private _showPlottedEntites: boolean = true;
  @state() private _showMapOverlays: boolean = true;
  @state() private _activeTab: number = TABS.Entities;

  firstUpdated(): void {
    // Show 'About' dialog if user is visiting the site for the first time
    if (!appStore.hasUserVisited) {
      setTimeout(() => {
        this._aboutDialogEl.showModal();
      }, 20000); // Wait 20 seconds
    }
    this.updateComplete.then(() => {
      this._cesiumViewerEl.dispatchEvent(
        new CustomEvent(CESIUM_VIEWER_EVENT.MENU_INIT_VISIBILITY_STATE, {
          detail: this._showSidebarMenu,
          bubbles: true,
          composed: true,
        })
      );
      this.style.setProperty(
        '--sidebar-width',
        this._showSidebarMenu ? '250px' : '0px'
      );
    });
  }

  /**
   * Get entities list - map on the 'properties' prop which is the yc companies data/props
   */
  private get _entitiesList(): (PropertyBag | undefined)[] {
    return this._entites
      .map((entity) => entity.properties)
      .filter(
        (entity) => entity?.hasLocation.getValue() === this._showPlottedEntites
      );
  }

  render(): TemplateResult {
    return html`
      ${this._mapLoaded === true
        ? html` ${this._showHeader
              ? html` <!-- Header -->
                  <app-top-bar> </app-top-bar>`
              : nothing}
            <!-- Sidebar (menu) -->
            <aside class="sidebar">
              <!-- Content -->
              <div class="content">
                <!-- Tabs -->
                <div class="tabs">
                  ${Object.entries(TABS).map(
                    ([key], index) => html`
                      <button
                        type="button"
                        class="tab-button ${this._activeTab === index
                          ? 'active'
                          : ''}"
                        @click=${(): void => this._onChangeTab(index)}
                      >
                        ${key}
                      </button>
                    `
                  )}
                </div>
                <!-- Tab content -->
                ${this._tabContentTemplate()}
              </div>
              <div class="footer">
                <div class="footer-container">
                  <div class="footer-text">
                    <p>${import.meta.env.VITE_APP_TITLE}</p>
                    |
                    <p>© ${currentYear()}</p>
                    |
                    <div
                      role="button"
                      tabindex="0"
                      aria-pressed="false"
                      class="about"
                      @click=${(): void => this._aboutDialogEl.showModal()}
                    >
                      About
                    </div>
                  </div>
                </div>
              </div>
            </aside>`
        : nothing}
      <!-- Main content -->
      <main>
        <cesium-viewer
          @map-loaded=${this._onMapLoaded}
          @entities-added=${this._onEntitiesAdded}
          @full-screen-change=${this._onFullScreenChange}
          @menu-visibility-change=${this._onMenuVisibilityChange}
          @entity-labels-change-status=${this._onEntityLabelsChangeStatus}
        ></cesium-viewer>
        <!-- About dialog -->
        <dialog id="aboutDialog">
          <h2>About</h2>
          ${!appStore.hasUserVisited
            ? html`<p>
                First, thank you for visiting - I really appreciate you taking
                the time.
              </p>`
            : nothing}
          <div>
            <details open>
              <summary>How This Project Began</summary>
              <p>
                I wanted to explore the
                <a href="https://www.ycombinator.com/companies" target="_blank"
                  >YC Startup Directory</a
                >
                through a map visualization. Since the official
                <a href="https://www.ycombinator.com/" target="_blank"
                  >Y Combinator (aka YC) website</a
                >
                doesn’t currently offer one, I decided to build a version that I
                would personally enjoy using as an end user.
              </p>
              <p>
                I started by building a
                <a href="https://github.com/brysonbw/yc-scraper" target="_blank"
                  >web scraper</a
                >
                to collect the data you see on the map. I then used
                <a
                  href="https://developers.google.com/maps/documentation/places/web-service/overview"
                  target="_blank"
                ></a
                >Google Places (new) API to fetch coordinates and addresses for
                the companies, enabling them to be plotted on the map.
              </p>
              <p>
                This project is built with
                <a href="https://lit.dev/" target="_blank">Lit</a> and using
                <a href="https://cesium.com/platform/cesiumjs/" target="_blank"
                  >CesiumJS</a
                >
                for the map.
              </p>
            </details>
            <details open>
              <summary>Goals For This Project</summary>
              <p>
                This is project is open source so (1) I hope people contribute
                to the project and especially current and alumni YC companies.
                Also, (2) it would be cool if the people at YC decided to
                offically reference and/or add this to their official site.
              </p>
              <p>
                You can help with the first goal by contributing - get started
                by visiting the
                <a
                  href="https://github.com/brysonbw/ycstartupmap.com"
                  target="_blank"
                  >YC Startup Map repository</a
                >.
              </p>
              <p>
                You can help with the second goal by sharing the link to this
                app with the
                <a href="https://www.ycombinator.com/people" target="_blank"
                  >people at YC</a
                >.
              </p>
            </details>
            <details open>
              <summary>Get in Touch</summary>
              <p>
                If you have ideas, feedback, or just want to chat, feel free to
                reach out and
                <a
                  href="https://discordapp.com/users/805262289119739924"
                  target="_blank"
                  >message me on Discord</a
                >.
              </p>
            </details>
            <div class="row-divider"></div>
            <p>
              In closing, continue to dream, work, build, create, spread love,
              and most importantly
              <b>I encourage you to build for the greater good of humanity</b>.
              Also, you have agency over your life so think and act on your
              ideas - <b>anything is possible.</b>
            </p>
            <p>Much peace and love.</p>
          </div>
          <div class="actions">
            <button
              type="button"
              class="primary"
              @click=${(): void => {
                if (!appStore.hasUserVisited) {
                  localStorage.setItem(appStore.VISITED_STORAGE_KEY, 'true');
                }
                this._aboutDialogEl.close();
              }}
            >
              Close
            </button>
          </div>
        </dialog>
      </main>
    `;
  }

  /** Tabs content - render template based on tab selected */
  private _tabContentTemplate(): TemplateResult {
    // Entities tab content
    if (this._activeTab === TABS.Entities) {
      return html` <div class="row">
          <div class="left">
            <input
              type="checkbox"
              id="plottedCheckbox"
              .checked=${this._showPlottedEntites}
              @change=${this._onPlottedEntitiesCheckboxChange}
            />
            <label for="plottedCheckbox">Plotted entities</label>
          </div>
          <div class="right-entities-count">(${this._entitiesList.length})</div>
        </div>
        <div class="entities-list">
          ${this._entitiesList.length
            ? html`${this._entitiesList.map(
                (entity: PropertyBag | undefined) => html`
                  ${entity?.hasLocation.getValue()
                    ? html`<div class="tooltip tooltip-top">
                        <div
                          role="button"
                          tabindex="0"
                          aria-pressed="false"
                          class="entity-item-card"
                          @click=${(): void => this._onFlyToEntity(entity?.id)}
                        >
                          <span class="thumbnail">
                            <img
                              src=${entity?.logoImage}
                              alt="${entity?.name} logo"
                            />
                          </span>
                          <div class="company-info">
                            <p class="name">${entity?.name}</p>
                            ${entity?.region.getValue()
                              ? html` <p class="location">${entity?.region}</p>`
                              : nothing}
                            <p class="description">${entity?.description}</p>
                          </div>
                        </div>
                        <span class="tooltiptext">Fly to ${entity.name} </span>
                      </div>`
                    : html`<div class="tooltip tooltip-top">
                        <div
                          role="button"
                          tabindex="0"
                          aria-pressed="false"
                          class="entity-item-card unplotted"
                        >
                          <span class="thumbnail">
                            <img
                              src=${entity?.logoImage}
                              alt="${entity?.name} logo"
                            />
                          </span>
                          <div class="company-info">
                            <p class="name">${entity?.name}</p>
                            <p class="description">${entity?.description}</p>
                          </div>
                        </div>
                        <span class="tooltiptext truncate"
                          >${entity?.name}
                        </span>
                      </div>`}
                `
              )}`
            : html`${this._emptyEntitesListPlaceholderTemplate()}`}
        </div>`;
    }
    // Map controls tab content
    return html`${this._entitiesList.length
      ? html`
          <div>
            <input
              type="checkbox"
              id="showLabelsCheckbox"
              .checked=${this._showEntityLabels}
              @change=${this._onEntityLabelsCheckboxChange}
            />
            <label for="showLabelsCheckbox">Show entity labels</label>
          </div>
          <div>
            <input
              type="checkbox"
              id="showMapOverlaysCheckbox"
              .checked=${this._showMapOverlays}
              @change=${this._onMapOverlaysCheckboxChange}
            />
            <label for="showMapOverlaysCheckbox">Show map overlays</label>
          </div>
        `
      : html`${this._emptyEntitesListPlaceholderTemplate()}`}`;
  }

  /**
   * Handle `map-loaded` event emitted from `<cesium-viewer>` (element)
   * @param event
   */
  private _onMapLoaded(event: CustomEvent): void {
    this._mapLoaded = event.detail;
  }

  /**
   * Handle `entities-added` event emitted from `<cesium-viewer>` (element)
   * @param event
   */
  private _onEntitiesAdded(event: CustomEvent): void {
    this._entites = event.detail;
  }

  /**
   * Handle `full-screen-change` event emitted from `<cesium-viewer>` (element)
   * @param event
   */
  private _onFullScreenChange(event: CustomEvent): void {
    if (event.detail) {
      this._showHeader = false;
    } else {
      this._showHeader = true;
    }

    const message = event.detail
      ? `${import.meta.env.VITE_APP_TITLE} is now full screen. Exit full screen (esc)`
      : 'Full screen: OFF';
    toast.show(message, undefined, 'info');
  }

  /**
   * Handle `menu-visibility-change` event emitted from `<cesium-viewer>` (element)
   * @param event
   */
  private _onMenuVisibilityChange(event: CustomEvent): void {
    this._showSidebarMenu = event.detail;
    this.style.setProperty(
      '--sidebar-width',
      this._showSidebarMenu ? '250px' : '0px'
    );
  }

  /**
   * Handle `entity-labels-change-status` event emitted from `<cesium-viewer>` (element)
   * @param event
   */
  private _onEntityLabelsChangeStatus(event: CustomEvent): void {
    if (event.detail !== undefined) {
      this._showEntityLabels = event.detail;
      toast.show(
        `Entity labels: ${this._showEntityLabels ? 'ON' : 'OFF'}`,
        undefined,
        'info',
        DEFAULT_TOAST_POSITION
      );
    }
  }

  /**
   * Handle plotted entites checkbox change - toggle entities list view (plotted and non plotted)
   * @param event
   */
  private _onPlottedEntitiesCheckboxChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this._showPlottedEntites = input.checked;
  }

  /**
   * Handle entity labels checkbox change - toggle plotted entities label visibility on the map
   * @param event
   */
  private _onEntityLabelsCheckboxChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this._cesiumViewerEl.dispatchEvent(
      new CustomEvent(CESIUM_VIEWER_EVENT.ENTITY_LABELS_CHANGE, {
        detail: input.checked,
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle map overlays checkbox change - toggle cesium map overlay (button/actions, containers, ect) visibility on the map
   * @param event
   */
  private _onMapOverlaysCheckboxChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this._showMapOverlays = input.checked;
    this._cesiumViewerEl.dispatchEvent(
      new CustomEvent(CESIUM_VIEWER_EVENT.MAP_OVERLAYS_CHANGE, {
        detail: input.checked,
        bubbles: true,
        composed: true,
      })
    );
    toast.show(
      `Map overlays: ${this._showMapOverlays ? 'ON' : 'OFF'}`,
      undefined,
      'info',
      DEFAULT_TOAST_POSITION
    );
  }

  /**
   * OnClick `Fly To` plotted entity [yc company] - dispatch `fly-to-entity` event to `<cesium-viewer>` component (element) to handle action
   * @param entityId
   */
  private _onFlyToEntity(entityId: number): void {
    this._cesiumViewerEl.dispatchEvent(
      new CustomEvent(CESIUM_VIEWER_EVENT.FLY_TO_ENTITY, {
        detail: entityId,
        bubbles: true,
        composed: true,
      })
    );
  }

  /** Empty entities list placeholder */
  private _emptyEntitesListPlaceholderTemplate(): TemplateResult {
    return html`<div class="empty-placeholder">
      There are no entities to display.
    </div>`;
  }

  /**
   * Handle change tab
   * @param index
   */
  private _onChangeTab(index: number): void {
    this._activeTab = index;
  }

  static styles = [
    tooltipStyles,
    dialogStyles,
    rowDividerStyles,
    linkStyles,
    truncateTextStyles,
    css`
      /** Layout/grid */
      :host {
        display: grid;
        grid-template-areas:
          'header header'
          'sidebar main';
        grid-template-columns: var(--sidebar-width, 250px) 1fr;
        grid-template-rows: auto 1fr;
        height: 100vh;
        width: 100%;
        transition: grid-template-columns 0.3s ease;
      }

      app-top-bar {
        grid-area: header;
      }

      .sidebar {
        grid-area: sidebar;
        background: var(--offWhite);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding-bottom: 0.5rem;
        padding-right: 0.5rem;
        padding-left: 0.5rem;
      }

      .footer {
        position: sticky;
        bottom: 0;
        background: var(--offWhite);
        text-align: center;
        border-top: 1px solid #ccc;
        z-index: 1;
      }

      .footer-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 7vh;
        flex-wrap: wrap;
      }

      .footer-text {
        display: flex;
        gap: 10px;
        align-items: center;
        color: var(--black);
        font-size: 0.5rem;
      }

      .footer-text .about {
        border: none;
        background-color: transparent;
        color: var(--text);
        cursor: pointer;
        padding: 0;
        margin: 0;
      }

      .footer-text .about:hover {
        color: var(--orange);
        opacity: 0.9;
      }

      main {
        grid-area: main;
        display: flex;
        overflow: hidden;
        min-height: 0;
      }

      /** Tabs */

      .tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 0.7rem;
      }

      .tab-button {
        background: none;
        border: none;
        padding: 15px 13px;
        font-size: 16px;
        cursor: pointer;
        position: relative;
        outline: none;
        color: #555;
        transition: color 0.3s ease;
      }

      .tab-button.active {
        color: var(--orange);
      }

      .tab-button.active::after {
        content: '';
        position: absolute;
        left: 0;
        bottom: -2px;
        width: 100%;
        height: 3px;
        background-color: var(--orange);
        border-radius: 2px;
      }

      /** Entities list and card */

      .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.3em;
      }

      .left {
        display: flex;
        align-items: center;
        gap: 0.2rem;
      }

      .right-entities-count {
        font-size: 0.8rem;
        font-weight: 200;
      }

      .entities-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .entity-item-card {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 16px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #fff;
        transition:
          background 0.2s,
          box-shadow 0.2s;
        cursor: pointer;
        width: 100%;
        box-sizing: border-box;
      }

      .entity-item-card:hover {
        background: #f9f9f9;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
      }

      .unplotted {
        cursor: default;
      }

      .thumbnail {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        overflow: hidden;
        background: #f1f1ec;
        flex-shrink: 0;
        align-self: flex-start;
      }

      .thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }

      .company-info {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
      }

      .name {
        font-weight: 600;
        font-size: 14px;
        margin: 0;
      }

      .location {
        font-size: 12px;
        font-weight: 200;
        margin: 0;
      }

      .description {
        font-size: 0.875rem;
        line-height: 1.25rem;
        font-weight: lighter;
        margin: 0;
      }

      label {
        font-family: Avenir, Helvetica, Arial, sans-serif;
        font-weight: 600;
        color: #333;
        font-size: 14px;
        line-height: 20px;
        padding-right: 28px;
      }

      input[type='checkbox']:hover {
        cursor: pointer;
      }

      .empty-placeholder {
        color: gray;
        text-align: center;
        font-size: 1rem;
      }

      dialog p {
        margin-top: 1em;
        margin-bottom: 1em;
      }

      @media only screen and (max-width: 640px) {
        .footer-text {
          font-size: 0.7rem;
        }
        dialog {
          width: 85%;
        }
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'home-page': HomePage;
  }
}
