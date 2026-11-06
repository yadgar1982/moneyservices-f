import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { http } from "../../components/Modules/http.js";

const API_URL = import.meta.env.VITE_API_URL;

export const fetchVaults = createAsyncThunk(
  "vaults/fetchVaults",
  async (_, { rejectWithValue }) => {
    try {
      const httpReq = http();
      const res = await httpReq.get(`${API_URL}/api/vault/read`);
      return res.data;
    } catch (error) {
      console.error(error);

      return rejectWithValue(
        error.response?.data?.msg || "Failed to fetch vaults"
      );
    }
  }
);

const initialState = {
  vaults: [],
  loading: false,
  error: null,
};

const vaultSlice = createSlice({
  name: "vaults",
  initialState,
  reducers: {
    setVaults: (state, action) => {
      state.vaults = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVaults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVaults.fulfilled, (state, action) => {
        state.loading = false;
        state.vaults = Array.isArray(action.payload)
          ? action.payload
          : action.payload.data || [];
      })
      .addCase(fetchVaults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch vaults";
      });
  },
});

export const { setVaults } = vaultSlice.actions;
export default vaultSlice.reducer;