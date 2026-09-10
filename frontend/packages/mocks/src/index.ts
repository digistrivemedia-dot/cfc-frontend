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
export {
  getReviews,
  getServiceReviews,
  getServiceReviewCount,
  REVIEWS_ARE_PLACEHOLDER,
} from "./api/reviews";
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
export { searchServices, suggestServices, getTrendingSearches } from "./api/search";
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
  getEarningsSeries,
  getPendingSettlements,
  getPayoutBalance,
  getPayoutDestinations,
  requestPayout,
  PAYOUT_WINDOW_HOURS,
  type EarningsPoint,
  type PendingSettlement,
  type PayoutBalance,
  type PayoutDestination,
  type PayoutRequest,
} from "./api/pro-earnings";
export {
  getProDayStats,
  getProActiveJobs,
  getProJobs,
  getProJobCounts,
  getProJob,
  checklistFor,
} from "./api/pro-jobs";
export {
  nextOffer,
  acceptOffer,
  declineOffer,
  OFFER_WINDOW_SECONDS,
  PROS_NOTIFIED_PER_JOB,
  type OfferOutcome,
} from "./api/pro-offers";
export {
  submitQuotation,
  completeJob,
  addExtraCharge,
  quoteTotal,
  QUOTATION_MIN_BEFORE_PHOTOS,
  PHONE_CONFIRM_THRESHOLD_PAISE,
  QUOTATION_WINDOW_MINUTES,
  type QuoteDraft,
  type QuoteSubmission,
  type QuoteRejection,
  type CompletionResult,
  type CompletionRejection,
} from "./api/pro-work";
export {
  getProServices,
  setProServiceEnabled,
  getProAvailability,
  saveProAvailability,
  updateProProfile,
  getServiceAreas,
} from "./api/pro-profile";

// The signed-in customer's own bookings — Customer 25 to 29, plus the home
// screen's active-job tracker and "Book again" shortcut.
export {
  getMyBookings,
  getMyBooking,
  getMyBookingCounts,
  cancelBooking,
  getActiveBooking,
  getRebookable,
  type BookingTab,
} from "./api/my-bookings";
export {
  getProNotifications,
  getProUnreadCount,
  markProNotificationRead,
  markAllProNotificationsRead,
  getProOwnReviews,
  getProRatingBreakdown,
  replyToReview,
  type ProNotificationFilter,
} from "./api/pro-notifications";
export { getProFaqs, getProTickets } from "./api/pro-support";
export {
  sendProOtp,
  verifyProOtp,
  registerPro,
  saveProfileSetup,
  uploadDocument,
  saveBankDetails,
  acceptTerms,
  getApprovalState,
  getRegisterableServices,
  isValidIfsc,
  isValidAccountNumber,
  isValidUpi,
  REQUIRED_DOCUMENTS,
  PRO_OTP_LENGTH,
  OTP_RESEND_SECONDS,
  type ProRegistration,
  type ProProfileSetup,
  type BankDetails,
  type ApprovalState,
} from "./api/pro-onboarding";
export {
  getGoldenRules,
  getPenaltyStructure,
  acceptConduct,
  PENALTY_AMOUNTS_NOT_SET,
  type GoldenRule,
  type PenaltyStep,
} from "./api/pro-conduct";
