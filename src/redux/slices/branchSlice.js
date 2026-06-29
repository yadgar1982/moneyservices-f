import {createAsyncThunk, createSlice}from '@reduxjs/toolkit';

import {http}from "../../components/Modules/http.js"

const API_URL=import.meta.env.VITE_API_URL

export const fetchBranch = createAsyncThunk(
  "branches/fetchBranch",
  async (_, { rejectWithValue }) => {
    try {
      const httpReq = http();
      const res = await httpReq.get(`${API_URL}/api/branch/read`);
          return res.data; // should be array of branches
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || "Failed to fetch branches");
    }
  }
);

const initialState={
  branches:[],
  loading:false,
  error:null,
};

const branchSlice=createSlice({
 name:"branches",
  initialState,
  reducers:{
    setbranches:(state,action)=>{
      state.branches=action.payload;
    },
  },
  extraReducers:(builder)=>{
    builder
    .addCase(fetchBranch.pending,(state)=>{
      state.loading=true;
      state.error=null;

    })
    .addCase(fetchBranch.fulfilled,(state,action)=>{
      state.loading=false;
        state.branches = Array.isArray(action.payload) ? action.payload : action.payload.data || [];
    })
    .addCase(fetchBranch.rejected,(state,action)=>{
      state.loading=false;
      state.error=action.payload|| [];
    });
     
  },
});

export const {setBranches} =branchSlice.actions;
export default branchSlice.reducer;