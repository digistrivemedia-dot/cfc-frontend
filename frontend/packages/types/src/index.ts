/**
 * Shared types for rendering.
 *
 * The backend team owns the data model. What lives here is only the shape a
 * screen needs so it is not written against `any`. Types are added when a screen
 * needs one, never ahead of the screens, and they align to the backend's schema
 * when it is published.
 */

export * from "./primitives";
export * from "./permission";
export * from "./booking";
export * from "./pro";
export * from "./customer";
export * from "./quotation";
export * from "./catalog";
export * from "./pricing";
export * from "./pro-earnings";
export * from "./pro-job";
export * from "./pro-profile";
export * from "./finance";
export * from "./promotion";
export * from "./report";
export * from "./admin-user";
export * from "./dashboard";
export * from "./consumer";
