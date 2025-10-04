import { LitElement, css, html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('cesium-overlay')
export class CesiumOverlay extends LitElement {
  render(): TemplateResult {
    return html`
      <slot name="overlay-top-left"></slot>
      <slot name="overlay-top-right"></slot>
      <slot name="overlay-bottom-left"></slot>
      <slot name="overlay-bottom-right"></slot>
    `;
  }

  static styles = css`
    ::slotted([slot='overlay-top-left']) {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    ::slotted([slot='overlay-top-right']) {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    ::slotted([slot='overlay-bottom-left']) {
      position: absolute;
      bottom: 10px;
      left: 10px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    ::slotted([slot='overlay-bottom-right']) {
      position: absolute;
      bottom: 10px;
      right: 10px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'cesium-overlay': CesiumOverlay;
  }
}
