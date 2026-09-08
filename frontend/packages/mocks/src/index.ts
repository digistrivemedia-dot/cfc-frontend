/**
 * The mock layer.
 *
 * Screens import api functions from here. Screens never import fixtures.
 *
 * Every function is async, returns a type from @cfc/types, awaits `latency()`,
 * and passes its result through `applyScenario()`. Swapping to the real backend
 * replaces the body of each function and nothing else — if a change to the real
 * API would require touching a screen file, the boundary is in the wrong place.
 */

export { setScenario, getScenario, type Scenario } from "./control";

export {
  getBooking,
  getBookings,
  getBookingsForExport,
  previewStatusOverride,
} from "./api/bookings";
export {
  getPayouts,
  getPro,
  getProWarnings,
  getPros,
  getWalletEntries,
  type ProQuery,
} from "./api/pros";
export {
  getCustomer,
  getCustomerBookings,
  getCustomerComplaints,
  getCustomers,
  type CustomerQuery,
} from "./api/customers";
export { getQuotations, getQuotation, type QuotationQuery } from "./api/quotations";
export {
  getCategories,
  getSubCategories,
  getServices,
  getPricingRules,
  getCommissionRules,
} from "./api/catalog";
export {
  getTransactions,
  getSettlements,
  getRefunds,
  getGstReport,
} from "./api/finance";
export {
  getCoupons,
  getBanners,
  getTickets,
  getTicket,
} from "./api/promotions";
export {
  getRevenueSeries,
  getActiveUsers,
  getBookingsSeries,
  getProPerformance,
  getServiceDemand,
  getCustomerGrowth,
  getPeakHours,
  getRatingTrend,
  getRevenueByArea,
  getRevenueByCategory,
} from "./api/reports";

export { getSubAdmins } from "./api/admin-users";
export { getDashboardKpis, getJobFeed } from "./api/dashboard";

export { AREA_OPTIONS } from "./fixtures/bookings";
export { SERVICE_NAMES } from "./fixtures/seed";

// Consumer auth.
export { sendOtp, verifyOtp, getConsumerProfile } from "./api/consumer-auth";
export { getReviews, REVIEWS_ARE_PLACEHOLDER } from "./api/reviews";
