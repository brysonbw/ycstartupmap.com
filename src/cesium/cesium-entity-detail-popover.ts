import type { Entity } from 'cesium';
import { LitElement, css, html, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Founder, WebPlatform } from '../types/ycCompany';

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
import { appStore, type UserAgent } from '../stores/app';
import { getEntityLatLon } from '../utils/cesiumFunctions';
import { tooltipStyles } from '../shared/styles/tooltipStyles';
import { truncateTextStyles } from '../shared/styles/truncateTextStyles';
import { rowDividerStyles } from '../shared/styles/dividerStyles';
import { CesiumEntityDetailPopoverStyles } from './styles/cesiumEntityDetailPopoverStyles';

const SOCIAL_IMAGES: Readonly<Record<string, string>> = Object.freeze({
  crunchbase,
  facebook,
  github,
  linkedin,
  x,
});

const BROWSER_IMAGES: Readonly<Record<UserAgent, string>> = Object.freeze({
  chrome,
  chromium,
  edge,
  firefox,
  opera,
  safari,
  seamonkey,
  unknown,
});

@customElement('cesium-entity-detail-popover')
export class CesiumEntityDetailPopover extends LitElement {
  @property({ attribute: false }) popoverX: number = 0;
  @property({ attribute: false }) popoverY: number = 0;
  @property({ attribute: false }) selectedEntity?: Entity;

  render(): TemplateResult {
    return html`
      ${this.selectedEntity && this.selectedEntity?.properties
        ? html`
            <div
              id="entityPopover"
              style="left: ${this.popoverX}px; top: ${this.popoverY}px;"
            >
              <div id="entityPopoverContainer">
                <div class="popover-close">
                  <div class="tooltip tooltip-left">
                    <button
                      type="button"
                      @click=${(): boolean =>
                        this.dispatchEvent(
                          new CustomEvent('close-popover', {
                            bubbles: true,
                            composed: true,
                          })
                        )}
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
                      src=${this.selectedEntity.properties.logoImage}
                      alt="${this.selectedEntity.properties.name} logo"
                    />
                  </div>
                  <div class="popover-info-col">
                    <h2>${this.selectedEntity.properties.name}</h2>
                    <div class="tagline">
                      ${this.selectedEntity.properties.description}
                    </div>
                  </div>
                </div>
                <!-- Tags -->
                <div class="tags">
                  ${this.selectedEntity.properties.batch.getValue()
                    ? html` <span class="tag batch"
                        >${this.selectedEntity.properties.batch}</span
                      >`
                    : nothing}
                  ${this.selectedEntity.properties.status.getValue()
                    ? html` <span class="tag status"
                        >${this.selectedEntity.properties.status}</span
                      >`
                    : nothing}
                  ${this.selectedEntity.properties.industry.getValue().length
                    ? html` ${this.selectedEntity.properties.industry
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
                    href=${this.selectedEntity.properties.yc_page_url}
                    target="_blank"
                    >Company</a
                  >
                  <div class="company-page">
                    ${this.selectedEntity.properties.company_pages
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
                  ${this.selectedEntity.properties.about}
                </div>
                <!-- Founders -->
                ${this.selectedEntity.properties.getValue().founders?.length
                  ? html`
                      <div class="founders-list">
                        <h2 class="section-header-title">Founders</h2>
                        ${this.selectedEntity.properties
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
                  ${this.selectedEntity.properties.company_photos.getValue()
                    .length
                    ? html` <h2 class="section-header-title">Company Photos</h2>
                        ${this.selectedEntity.properties.company_photos
                          .getValue()
                          .map((companyPhoto: string) => {
                            return html`<img
                              src=${new URL(
                                `../assets/img/company_photos/${companyPhoto}.png`,
                                import.meta.url
                              ).href}
                              alt="${this.selectedEntity?.properties
                                ?.name} company photo"
                            />`;
                          })}`
                    : nothing}
                </div>
                <!-- YC info card -->
                <div class="yc-info-card">
                  <div class="yc-company-logo">
                    <a
                      href=${this.selectedEntity.properties.yc_page_url}
                      target="_blank"
                    >
                      <img
                        src=${this.selectedEntity.properties.logoImage}
                        alt="${this.selectedEntity.properties.name} logo"
                      />
                    </a>
                  </div>
                  <div class="yc-company-name">
                    <a
                      href=${this.selectedEntity.properties.yc_page_url}
                      target="_blank"
                      >${this.selectedEntity.properties.name}</a
                    >
                  </div>
                  <!-- YC company details -->
                  <div class="yc-company-details">
                    <!-- Founded -->
                    ${this.selectedEntity.properties.founded.getValue()
                      ? html`<div class="detail-row">
                          <span>Founded:</span
                          ><span
                            >${this.selectedEntity.properties.founded}</span
                          >
                        </div>`
                      : nothing}
                    <!-- Batch -->
                    ${this.selectedEntity.properties.batch.getValue()
                      ? html`<div class="detail-row">
                          <span>Batch:</span
                          ><span>${this.selectedEntity.properties.batch}</span>
                        </div>`
                      : nothing}
                    <!-- Team size -->
                    ${this.selectedEntity.properties.team_size.getValue()
                      ? html`<div class="detail-row">
                          <span>Team Size:</span
                          ><span
                            >${this.selectedEntity.properties.team_size}</span
                          >
                        </div>`
                      : nothing}
                    <!-- Status -->
                    ${this.selectedEntity.properties.status.getValue()
                      ? html`<div class="detail-row">
                          <span>Status:</span>
                          <span class="status"
                            ><div class="status-dot"></div>
                            ${this.selectedEntity.properties.status}</span
                          >
                        </div>`
                      : nothing}
                    <!-- Primary partner -->
                    ${this.selectedEntity.properties.primary_partner.getValue()
                      ? html`<div class="detail-row">
                          <span>Primary Partner:</span
                          ><a
                            href=${`https://www.ycombinator.com/people/${this.selectedEntity.properties.primary_partner
                              .getValue()
                              .toLowerCase()
                              .replace(' ', '-')}`}
                            target="_blank"
                            >${this.selectedEntity.properties
                              .primary_partner}</a
                          >
                        </div>`
                      : nothing}
                    <!-- Location -->
                    ${this.selectedEntity.properties.region.getValue()
                      ? html`<div class="detail-row">
                          <span>Location:</span
                          ><span>${this.selectedEntity.properties.region}</span>
                        </div>`
                      : nothing}
                    <!-- Latitude / Longitude -->
                    ${this.selectedEntity.properties.hasLocation.getValue()
                      ? html`<div class="detail-row">
                          <span>Coordinates:</span
                          ><span
                            class="coords-detail-row-right-text detail-row-right-text"
                            >${getEntityLatLon(
                              this.selectedEntity
                            )?.latitude.toFixed(6)}/${getEntityLatLon(
                              this.selectedEntity
                            )?.longitude.toFixed(6)}
                          </span>
                        </div>`
                      : nothing}
                    <!-- Address -->
                    ${this.selectedEntity?.properties?.location?.getValue()
                      ?.short_address
                      ? html`<div class="detail-row">
                          <span>Address:</span
                          ><span class="detail-row-right-text">
                            ${this.selectedEntity?.properties?.location?.getValue()
                              ?.short_address}
                          </span>
                        </div>`
                      : nothing}
                  </div>
                  ${this.selectedEntity.properties.company_pages.getValue()
                    .length
                    ? html`<div class="social-row">
                        ${this.selectedEntity.properties.company_pages
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

  static styles = [
    tooltipStyles,
    truncateTextStyles,
    rowDividerStyles,
    CesiumEntityDetailPopoverStyles,
    css`
      h2 {
        margin: 0;
        font-size: 1.6rem;
        font-weight: 700;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'cesium-entity-detail-popover': CesiumEntityDetailPopover;
  }
}
