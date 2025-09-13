import { html, LitElement, css, type TemplateResult, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import appLogo from '../assets/img/logo-yc-only.png';
import githubLogo from '../assets/img/github.png';

@customElement('app-top-bar')
export class AppTopBar extends LitElement {
  render(): TemplateResult {
    return html`<header>
      <nav>
        <div class="nav-logo">
          <img
            class="logo"
            src=${appLogo}
            alt=${import.meta.env.VITE_APP_TITLE.toLowerCase() + ' logo image'}
          />
          <p class="app-title" aria-current="page">
            Startup Map
            ${import.meta.env.DEV ? html`<span>[DEV]</span>` : nothing}
          </p>
        </div>

        <div class="nav-links">
          <a
            class="github"
            target="_blank"
            href="https://github.com/brysonbw/ycstartupmap.com"
          >
            <img src=${githubLogo} alt="GitHub icon" />
          </a>
        </div>
      </nav>
    </header> `;
  }

  static styles = css`
    :host {
      background-color: var(--offWhite);
      padding-right: 0.5rem;
      padding-left: 0.5rem;
      border-bottom: 1px solid #ccc;
    }
    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-logo {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .logo {
      height: 1.8rem;
      width: auto;
      align-items: center;
      margin-right: 0.25rem;
    }

    .app-title {
      font-size: 1.125rem;
      font-weight: 500;
      margin-left: 0.1em;
    }

    .app-title span {
      color: var(--darkOrange);
    }

    .nav-links {
      display: flex;
      gap: 1.5rem;
    }

    .nav-links a {
      text-decoration: none;
      color: var(--text);
      font-weight: 500;
    }

    a:hover {
      color: var(--orange);
    }

    .github {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .github img {
      width: 24px;
      height: 24px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'app-top-bar': AppTopBar;
  }
}
