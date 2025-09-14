import type {
  ActionResult,
  Route,
  RouteContext,
  Commands,
} from '@vaadin/router';
import { detectWebGL } from './utils/helperFunctions';
import { appStore } from './stores/app';
import { toast } from 'lit-toaster';

const APP_TITLE = import.meta.env.VITE_APP_TITLE ?? 'YC Startup Map';

export const routes: Route[] = [
  {
    path: '/',
    async action(
      this: Route,
      _context: RouteContext,
      commands: Commands
    ): Promise<ActionResult> {
      const isWebGLEnabled = await detectWebGL();
      if (isWebGLEnabled) {
        appStore.webGLEnabled = isWebGLEnabled;
        await import('./pages/home');
        return commands.component('home-page');
      } else {
        const errorMessage = 'Your browser or device may not support WebGL.';
        toast.show(errorMessage, -1, 'error');
        return commands.redirect('/webgl-error');
      }
    },
  },
  {
    path: '/webgl-error',
    async action(
      this: Route,
      _context: RouteContext,
      commands: Commands
    ): Promise<ActionResult> {
      await import('./pages/webgl-error');
      document.title = `${APP_TITLE} | WebGL error`;
      return commands.component('webgl-error-page');
    },
  },
  {
    path: '(.*)',
    async action(
      this: Route,
      _context: RouteContext,
      commands: Commands
    ): Promise<ActionResult> {
      await import('./pages/not-found');
      document.title = `${APP_TITLE} | Page not found`;
      return commands.component('not-found-page');
    },
  },
];
