import {createAsyncThunk, createSlice}from '@reduxjs/toolkit';

import {http}from "../../components/Modules/http.js"

const API_URL=import.meta.env.VITE_API_URL

export const fetchUsers = createAsyncThunk(
  "user/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const httpReq = http();
      const res = await httpReq.get(`${API_URL}/api/user/read`);
          return res.data; // should be array of user
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || "Failed to fetch user");
    }
  }
);

const initialState={
  users:[],
  loading:false,
  error:null,
};

const userSlice=createSlice({
 name:"user",
  initialState,
  reducers:{
    setUser:(state,action)=>{
      state.users=action.payload;
    },
  },
  extraReducers:(builder)=>{
    builder
    .addCase(fetchUsers.pending,(state)=>{
      state.loading=true;
      state.error=null;

    })
    .addCase(fetchUsers.fulfilled,(state,action)=>{
      state.loading=false;
        state.users = Array.isArray(action.payload) ? action.payload : action.payload.data || [];
    })
    .addCase(fetchUsers.rejected,(state,action)=>{
      state.loading=false;
      state.error=action.payload|| [];
    });
     
  },
});

export const {setUser} =userSlice.actions;
export default userSlice.reducer;