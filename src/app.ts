import { Router } from '@vaadin/router';
import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { appStore } from './stores/app';
import { detectUserAgent } from './utils/helperFunctions';
import { routes } from './routes';

appStore.userAgent = detectUserAgent();

@customElement('app-root')
export class App extends LitElement {
  @query('#outlet') private _outlet!: HTMLElement | null;

  firstUpdated(): void {
    const router = new Router(this._outlet);
    router.setRoutes(routes);
  }

  render(): TemplateResult {
    return html`<div id="outlet"></div>`;
  }

  static styles = css``;
}

declare global {
  interface HTMLElementTagNameMap {
    'app-root': App;
  }
}
