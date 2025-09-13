/** A user's (browser) agent */
export type UserAgent =
  | 'chrome'
  | 'chromium'
  | 'edge'
  | 'firefox'
  | 'opera'
  | 'safari'
  | 'seamonkey'
  | 'unknown';

export class AppStore extends EventTarget {
  public readonly VISITED_STORAGE_KEY = `${import.meta.env.VITE_APP_TITLE?.toLowerCase()?.replaceAll(' ', '-')}-visited`;
  private _webGLEnabled = false;
  private _userAgent: UserAgent = 'unknown';
  private _hasUserVisited: boolean = true;

  constructor() {
    super();
    const hasUserVisitedValue = localStorage.getItem(this.VISITED_STORAGE_KEY);
    this._hasUserVisited =
      hasUserVisitedValue !== null
        ? Boolean(JSON.parse(hasUserVisitedValue))
        : false;
  }

  get hasUserVisited(): boolean {
    return this._hasUserVisited;
  }

  get webGLEnabled(): boolean {
    return this._webGLEnabled;
  }

  set webGLEnabled(value) {
    this._webGLEnabled = Boolean(value);
  }

  get userAgent(): UserAgent {
    return this._userAgent;
  }

  set userAgent(value) {
    const browserName =
      value && typeof value === 'string' ? value.toLowerCase() : '';
    if (
      [
        'chrome',
        'chromium',
        'edge',
        'firefox',
        'opera',
        'safari',
        'seamonkey',
      ].includes(browserName)
    ) {
      this._userAgent = browserName as UserAgent;
    } else {
      this._userAgent = 'unknown';
    }
  }
}

export const appStore = new AppStore();
