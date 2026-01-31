import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../api/pageApi';

export const loadMasters = createAsyncThunk(
  'masters/loadAll',
  async () => {
    const [
      customers,
      parts,
      models,
      repairCauses,
    ] = await Promise.all([
      api.getMstCustomers(),
      api.getMstParts(),
      api.getMstModels(),
      api.getMstRepairCause(),
    ]);

    return { customers, parts, models, repairCauses };
  }
);

const masterSlice = createSlice({
  name: 'masters',
  initialState: {
    customers: [],
    parts: [],
    models: [],
    repairCauses: [],
    loaded: false,
  },
  extraReducers: (builder) => {
    builder.addCase(loadMasters.fulfilled, (state, action) => {
      state.customers = action.payload.customers || [];
      state.parts = action.payload.parts || [];
      state.models = action.payload.models || [];
      state.repairCauses = action.payload.repairCauses || [];
      state.loaded = true;
    });
  },
});

export default masterSlice.reducer;
