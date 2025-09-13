import { LitElement, css, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('loading-indicator')
export class LoadingIndicator extends LitElement {
  @property({ reflect: true }) size: string = 'default';
  @property({ reflect: true }) color: string = '#ffffff';

  render(): TemplateResult {
    return html`<div class="spinner-container">
      <div class="spinner" style="--spinner-color: ${this.color}"></div>
      <slot name="text">Loading...</slot>
    </div>`;
  }

  static styles = css`
    :host {
      display: inline-block;
    }

    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 100%;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.2);
      border-top-color: var(--spinner-color, #ffffff);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-text {
      font-size: 14px;
      color: var(--spinner-color, #007bff);
      text-align: center;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    :host([size='small']) .spinner {
      width: 24px;
      height: 24px;
      border-width: 3px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'loading-indicator': LoadingIndicator;
  }
}
