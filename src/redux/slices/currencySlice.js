import {createAsyncThunk, createSlice}from '@reduxjs/toolkit';

import {http}from "../../components/Modules/http.js"

const API_URL=import.meta.env.VITE_API_URL

export const fetchCurrency = createAsyncThunk(
  "currencies/fetchCurrency",
  async (_, { rejectWithValue }) => {
    try {
      const httpReq = http();
      const res = await httpReq.get(`${API_URL}/api/currency/read`);
          return res.data; // should be array of currencies
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || "Failed to fetch currencies");
    }
  }
);

const initialState={
  currencies:[],
  loading:false,
  error:null,
};

const currencySlice=createSlice({
 name:"currencies",
  initialState,
  reducers:{
    setcurrencies:(state,action)=>{
      state.currencies=action.payload;
    },
  },
  extraReducers:(builder)=>{
    builder
    .addCase(fetchCurrency.pending,(state)=>{
      state.loading=true;
      state.error=null;

    })
    .addCase(fetchCurrency.fulfilled,(state,action)=>{
      state.loading=false;
        state.currencies = Array.isArray(action.payload) ? action.payload : action.payload.data || [];
    })
    .addCase(fetchCurrency.rejected,(state,action)=>{
      state.loading=false;
      state.error=action.payload|| [];
    });
     
  },
});

export const {setcurrencies} =currencySlice.actions;
export default currencySlice.reducer;