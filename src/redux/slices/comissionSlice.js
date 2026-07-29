import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { http } from "../../components/Modules/http.js";

const API_URL = import.meta.env.VITE_API_URL;

export const fetchComissions = createAsyncThunk(
  "comissions/fetchComissions",
  async (_, { rejectWithValue }) => {

    try {
      const httpReq = http();
      const res = await httpReq.get(`${API_URL}/api/comission/read`);
      return res.data;
    } catch (error) {
      console.error(error);

      return rejectWithValue(
        error.response?.data?.msg || "Failed to fetch commissions"
      );
    }
  }
);

const initialState = {
  comissions: [],
  loading: false,
  error: null,
};

const comissionsSlice = createSlice({
  name: "comissions",
  initialState,
  reducers: {
    setComissions: (state, action) => {
      state.comissions = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComissions.fulfilled, (state, action) => {
        state.loading = false;
        state.comissions = Array.isArray(action.payload)
          ? action.payload
          : action.payload.data || [];
      })
      .addCase(fetchComissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch commissions";
      });
  },
});

export const { setComissions } = comissionsSlice.actions;
export default comissionsSlice.reducer;