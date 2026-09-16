/**
 * The cleanup function also carries `refresh`, which re-paints the cart-driven
 * parts of the DOM (the rail's Add buttons, the pip, the cart bar). The rail is
 * populated from an async catalogue read, so it has to be called once the cards
 * are actually in the DOM.
 */
export interface CFCAppHandle {
  (): void;
  refresh: () => void;
}

export function initCFCApp(): CFCAppHandle;
