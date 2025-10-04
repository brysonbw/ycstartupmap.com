import { css } from 'lit';

/** Cesium entity detail popover styles */
export const CesiumEntityDetailPopoverStyles = css`
  /* Popover */

  #entityPopover {
    position: fixed;
    max-width: 500px;
    max-height: 400px;
    overflow-y: auto;
    background: var(--offWhite);
    color: var(--black);
    padding: 12px;
    border-radius: 10px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }

  #entityPopoverContainer {
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    padding: 16px;
    width: 100%;
    box-sizing: border-box;
  }

  .popover-close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: transparent;
    font-size: 1.25rem;
    line-height: 1;
  }

  .popover-close button {
    color: red;
    background-color: transparent;
    border: none;
    cursor: pointer;
    font-weight: bold;
  }

  .popover-close button:hover {
    opacity: 0.75;
  }

  .popover-top-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .popover-logo-col {
    flex-shrink: 0;
    margin-right: 20px;
    align-self: center;
  }

  .popover-logo-col img {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    object-fit: contain;
  }

  .popover-info-col {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .popover-company-cta-col {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  a.yc-company-page {
    text-decoration: none;
    color: #333;
    font-weight: bold;
    font-size: 0.85rem;
    padding: 6px;
  }

  a.yc-company-page:hover {
    background: #edebe3;
    border-radius: 6px;
  }

  .company-page {
    margin-left: auto;
    display: flex;
    align-self: center;
  }

  .company-page a {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 1.5rem;
    text-decoration: none;
    color: #268bd2ff;
  }

  .company-page a:hover {
    text-decoration: underline;
  }

  .popover-about-col {
    font-size: 0.95rem;
    line-height: 1.4;
    color: #444;
  }

  /** Founder list and card */

  .founders-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .founder-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .founder-avatar {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    object-fit: cover;
  }

  .founder-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .founder-info a {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 1.5rem;
    width: 1.5rem;
    border-radius: 0.375rem;
    transition: background 0.2s;
  }

  .founder-info a:hover {
    background-color: #e5e7eb;
  }

  .founder-info a > img {
    height: 1rem;
    width: 1rem;
  }

  .founder-info a[aria-label='LinkedIn'] > img {
    height: 1.25rem;
    width: 1.25rem;
  }

  .founder-header {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .founder-name {
    font-weight: bold;
    font-size: 16px;
    color: #111;
  }

  .founder-job-title {
    font-size: 14px;
    color: #555;
    margin-bottom: 6px;
  }

  .founder-bio {
    font-size: 14px;
    line-height: 1.4;
    color: #333;
  }

  /* Company photos */

  .company-photos {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .company-photos img {
    border-radius: 8px;
  }

  /* YC info card */

  .yc-info-card {
    display: flex;
    flex-direction: column;
    padding: 16px;
    margin-top: 29px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  .yc-company-logo {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .yc-company-logo img {
    max-width: 100px;
    height: auto;
    border-radius: 8px;
  }

  .yc-company-logo img:hover {
    opacity: 0.93;
  }

  .yc-company-name {
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .yc-company-name a {
    font-weight: 700;
    font-size: 1.25rem;
    line-height: 1.75rem;
    text-decoration: none;
    color: #333;
  }

  .yc-company-name a:hover {
    color: rgb(38 139 210);
  }

  .yc-company-details {
    padding-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
  }

  .social-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: center;
    margin-top: 0.5em;
  }

  .social-row a {
    display: flex;
    height: 2.25rem;
    width: 2.25rem;
    align-items: center;
    justify-content: center;
    border-radius: 0.375rem;
    border: 1px solid #ebebeb;
    background-color: #fff;
    transition: background-color 150ms;
  }

  .social-row a:hover {
    background-color: #f9fafb;
  }

  .social-row a img {
    display: inline-block;
    width: 1.25rem;
    height: 1.25rem;
  }

  .detail-row a {
    text-decoration: none;
    color: #268bd2ff;
  }

  .detail-row a:hover {
    text-decoration: underline;
  }

  .status {
    display: flex;
    align-items: center;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    margin-right: 6px;
  }

  /** Tags */

  .tagline {
    font-size: 1.1rem;
    margin: 6px 0 14px;
    color: #333;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 8px 0 12px;
  }

  .tag {
    background: #e6e4dc;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 0.85rem;
    letter-spacing: 0.05em;
    font-weight: 100;
    text-transform: uppercase;
  }

  .tag.batch {
    background: #fff0e6;
    color: #e65100;
    display: flex;
    align-items: center;
  }

  .tag.batch::before {
    content: 'Y';
    font-weight: bold;
    margin-right: 6px;
    background: #ff6d00;
    color: white;
    font-size: 0.7rem;
    padding: 2px 4px;
    border-radius: 3px;
  }

  .tag.status {
    display: flex;
    align-items: center;
  }

  .tag.status::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    background: #00c389;
    border-radius: 50%;
    margin-right: 6px;
  }

  .detail-row-right-text {
    text-align: right;
  }

  .section-header-title {
    margin-top: 1rem;
    font-size: 1.5rem;
    font-weight: bold;
    color: #333333;
  }
  @media only screen and (max-width: 640px) {
    #entityPopover {
      max-width: 90%;
      transform: translateX(2.3%);
    }

    .coords-detail-row-right-text {
      word-break: break-all;
    }
  }
`;
