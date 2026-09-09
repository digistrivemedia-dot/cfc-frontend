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
  getService,
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
export {
  sendOtp,
  verifyOtp,
  getConsumerProfile,
  updateConsumerProfile,
} from "./api/consumer-auth";
export { getReviews, REVIEWS_ARE_PLACEHOLDER } from "./api/reviews";
export { getPublicPro, getProReviews } from "./api/public-pro";
export {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationFilter,
} from "./api/notifications";
export {
  submitReview,
  chipsFor,
  POSITIVE_CHIPS,
  NEGATIVE_CHIPS,
  type ReviewSubmitResult,
} from "./api/reviews-submit";
export { searchServices, getTrendingSearches } from "./api/search";
export { getServiceFaqs } from "./api/faqs";
export {
  getSupportFaqs,
  getMyTickets,
  getMyTicket,
  replyToTicket,
  raiseTicket,
  askAssistant,
  SUPPORT_PHONE,
  SUPPORT_HOURS,
  AI_ASSISTANT_IS_SHELL,
} from "./api/my-support";
export { getSlots } from "./api/slots";
export {
  getMyQuotations,
  getMyQuotation,
  splitQuotation,
  acceptQuotation,
  declineQuotation,
  askQuotationQuestion,
  getPendingQuotationCount,
} from "./api/my-quotations";
export {
  getMyBookings,
  getMyBooking,
  getMyBookingCounts,
  cancelBooking,
  type BookingTab,
} from "./api/my-bookings";
export { getAddresses, saveAddress, deleteAddress } from "./api/addresses";
export {
  getWalletBalance,
  getWalletTransactions,
  addMoney,
  type WalletFilter,
} from "./api/wallet";
export {
  getReferralProgramme,
  REFERRAL_TERMS_ARE_PLACEHOLDER,
} from "./api/referral";
export {
  priceBooking,
  applyCoupon,
  getAvailableCoupons,
  createBooking,
  type CouponResult,
  type CouponFailure,
} from "./api/booking-draft";
export {
  getProEarnings,
  getEarningsSummary,
  getCommissionFreeRemaining,
  commissionFor,
  settleJob,
} from "./api/pro-earnings";
export {
  getProDayStats,
  getProActiveJobs,
  getProJobs,
  getProJobCounts,
  getProJob,
} from "./api/pro-jobs";
