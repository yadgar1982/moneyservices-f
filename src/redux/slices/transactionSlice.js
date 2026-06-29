import {createAsyncThunk, createSlice}from '@reduxjs/toolkit';

import {http}from "../../components/Modules/http.js"

const API_URL=import.meta.env.VITE_API_URL

export const fetchTransaction = createAsyncThunk(
  "transactions/fetchTransaction",
  async (_, { rejectWithValue }) => {
    try {
      const httpReq = http();
      const res = await httpReq.get(`${API_URL}/api/transaction/read`);
          return res.data; // should be array of transactions
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || "Failed to fetch transactions");
    }
  }
);

const initialState={
  transactions:[],
  loading:false,
  error:null,
};

const transactionSlice=createSlice({
 name:"transactions",
  initialState,
  reducers:{
    setTransactions:(state,action)=>{
      state.transactions=action.payload;
    },
  },
  extraReducers:(builder)=>{
    builder
    .addCase(fetchTransaction.pending,(state)=>{
      state.loading=true;
      state.error=null;

    })
    .addCase(fetchTransaction.fulfilled,(state,action)=>{
      state.loading=false;
        state.transactions = Array.isArray(action.payload) ? action.payload : action.payload.data || [];
    })
    .addCase(fetchTransaction.rejected,(state,action)=>{
      state.loading=false;
      state.error=action.payload|| [];
    });
     
  },
});

export const {setTransactions} =transactionSlice.actions;
export default transactionSlice.reducer;