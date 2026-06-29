import { configureStore } from "@reduxjs/toolkit";
import transactionsReducer from "./slices/transactionSlice.js";
import userReducer from "./slices/customerSlice.js";
import currencyReducer from "./slices/currencySlice.js";
import branchReducer from "./slices/branchSlice.js";

export const store = configureStore({
  reducer: {
    transactions: transactionsReducer,
    users: userReducer,
    currencies: currencyReducer,
    branches: branchReducer,
  },
});