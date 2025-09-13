import { Router } from '@lit-labs/router';
import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { appStore } from './stores/app';
import { toast } from 'lit-toaster';
import { detectUserAgent, detectWebGL } from './utils/helperFunctions';

appStore.userAgent = detectUserAgent();

@customElement('app-root')
export class App extends LitElement {
  private _router = new Router(this, [
    {
      path: '/',
      render: (): TemplateResult => html`<home-page></home-page>`,
      enter: async (): Promise<boolean> => {
        try {
          const isWebGLEnabled = await detectWebGL();
          if (isWebGLEnabled) {
            appStore.webGLEnabled = isWebGLEnabled;
            await import('./pages/home');
            return true;
          } else {
            const errorMessage =
              'Your browser or device may not support WebGL.';
            toast.show(errorMessage, -1, 'error');
            throw new Error(errorMessage);
          }
        } catch (error) {
          console.error(error);
          history.replaceState({}, '', '/webgl-error');
          await this._router.goto('/webgl-error');
          return false;
        }
      },
    },
    {
      path: '/webgl-error',
      render: (): TemplateResult => html`${this._webGLErrorTemplate()}`,
      enter: async (): Promise<boolean> => {
        try {
          const isWebGLEnabled = await detectWebGL();
          if (isWebGLEnabled) {
            appStore.webGLEnabled = isWebGLEnabled;
            await import('./pages/home');
            history.replaceState({}, '', '/');
            await this._router.goto('/');
            return false;
          } else {
            const errorMessage =
              'Your browser or device may not support WebGL.';
            toast.show(errorMessage, -1, 'error');
            throw new Error(errorMessage);
          }
        } catch (error) {
          console.error(error);
          return true;
        }
      },
    },
    {
      path: '/*',
      render: (): TemplateResult => {
        return html`<not-found-page></not-found-page>`;
      },
      enter: async (): Promise<boolean> => {
        await import('./pages/not-found');
        return true;
      },
    },
  ]);

  render(): TemplateResult {
    return html`${this._router.outlet()}`;
  }

  /** WebGL error template */
  private _webGLErrorTemplate(): TemplateResult {
    return html`<div class="container">
      <div class="card">
        <h2 id="card-title" class="title">WebGL Error</h2>
        <p class="subtitle">
          Your browser was unable to initialize
          <a href="https://en.wikipedia.org/wiki/WebGL" target="_blank">WebGL</a
          >, which is required for this app to run.
        </p>
        <p class="subtitle">Try the following to resolve:</p>
        <ul class="list">
          <li>Refresh the page and try again.</li>
          <li>
            Update your <em>(${appStore.userAgent})</em> browser to the latest
            version.
          </li>
          <li>
            <a
              href="https://us.norton.com/blog/hardware/hardware-acceleration"
              target="_blank"
              >Enable hardware acceleration in browser settings.
            </a>
          </li>
          <li>Check that your graphics drivers are up to date.</li>
        </ul>
        <div class="actions">
          <button
            class="primary"
            type="button"
            @click=${(): void => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      </div>
    </div>`;
  }

  static styles = css`
    :host {
      height: 100vh;
      width: 100%;
      --card: #ffffff;
      --text: #1f2937;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
    }

    .container {
      min-height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
      box-sizing: border-box;
    }

    .card {
      width: 100%;
      max-width: 380px;
      background: var(--card, #fff);
      border-radius: 16px;
      padding: 24px;
      box-shadow:
        0 1px 2px rgba(0, 0, 0, 0.05),
        0 8px 24px rgba(0, 0, 0, 0.08);
    }

    .title {
      margin: 0 0 6px;
      font-size: 1.25rem;
      line-height: 1.25;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: red;
      text-align: center;
    }

    .subtitle {
      margin: 0 0 18px;
      color: var(--text);
      font-size: 0.975rem;
      line-height: 1.5;
      text-align: center;
    }

    .list {
      margin: 0 0 18px;
      color: var(--text);
      font-size: 0.975rem;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      gap: 10px;
      margin-top: 8px;
    }

    button {
      appearance: none;
      border: 0;
      padding: 10px 14px;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition:
        transform 120ms ease,
        background-color 120ms ease,
        box-shadow 120ms ease;
      width: 100%;
    }

    button:active {
      transform: translateY(1px);
    }

    button:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.35);
    }

    .primary {
      background: var(--primary);
      color: white;
    }

    .primary:hover {
      background: var(--primary-hover);
    }

    a {
      text-decoration: none;
      color: #268bd2ff;
    }

    a:hover {
      text-decoration: underline;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'app-root': App;
  }
}
