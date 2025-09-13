import { css } from 'lit';

/** Tooltip styles */
export const tooltipStyles = css`
  .tooltip {
    position: relative;
    display: inline-block;
  }

  /* Tooltip base */
  .tooltip .tooltiptext {
    visibility: hidden;
    width: max-content;
    background-color: #424242;
    color: #fff;
    text-align: center;
    padding: 4px 8px;
    border-radius: 4px;
    position: absolute;
    z-index: 1001;
    font-size: 12px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .tooltip:hover .tooltiptext {
    visibility: visible;
    opacity: 1;
  }

  /* Tooltip top */
  .tooltip-top .tooltiptext {
    top: -28px;
    left: 50%;
    transform: translateX(-50%);
  }

  /* Tooltip to the left */
  .tooltip-left .tooltiptext {
    top: 50%;
    left: -8px;
    transform: translate(-100%, -50%);
  }

  /* Tooltip to the right */
  .tooltip-right .tooltiptext {
    top: 50%;
    left: 100%;
    transform: translateY(-50%);
    margin-left: 8px;
  }

  /* Tooltip to the bottom */
  .tooltip-bottom .tooltiptext {
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 8px;
  }
`;
