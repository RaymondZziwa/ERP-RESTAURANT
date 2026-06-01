export const MEALSALEENDPOINTS = {
  RECORD_ORDER: {
    complete_sale: "/api/meal-sales/create",
    modify: (id: string) => `/api/meal-sales/modify/${id}`,
    delete: (id: string) => `/api/meal-sales/delete/${id}`,
    fetch_all: "/api/meal-sales/fetch-all",
    get_credit_sales: (id: string) => `/api/meal-sales/credit-sales/${id}`,
    COLLECT_PAYMENT: `/api/meal-sales/collect-payment`,
    PING_PAYMENT_STATUS: (reference: string) =>
      `/api/transactions/payment-status/${reference}`,
    GET_EMPLOYEE_PENDING_BILLS: (id: string) =>
      `/api/meal-sales/fetch-pending-bills/${id}`,
    GET_EMPLOYEE_PAST_BILLS: (id: string) =>
      `/api/meal-sales/fetch-past-bills/${id}`,
  },
};
