import { css } from 'lit';

/** Cesium overlay styles */
export const cesiumOverlayStyles = css`
  div[slot='overlay-top-right'] button,
  div[slot='overlay-bottom-left'] button,
  div[slot='overlay-bottom-right'] button {
    background-color: var(--white);
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    padding: 6px;
    color: var(--black);
    font-size: 16px;
  }

  div[slot='overlay-bottom-right'] button {
    display: flex;
    align-items: center;
  }
`;
