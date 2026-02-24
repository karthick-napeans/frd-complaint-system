import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../api/pageApi';

export const loadMasters = createAsyncThunk(
  'masters/loadAll',
  async () => {
    const customers1 = await api.getMstCustomers();
    console.log("CUSTOMERS FROM API:", customers1);
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
  reducers: {
    addCustomer: (state, action) => {
      state.customers.unshift(action.payload);
    },

    updateCustomer: (state, action) => {
      const index = state.customers.findIndex(
        x => x.CustomerId === action.payload.CustomerId
      );
      if (index !== -1) {
        state.customers[index] = action.payload;
      }
    },

    deleteCustomer: (state, action) => {
      state.customers = state.customers.filter(
        x => x.CustomerId !== action.payload
      );
    },
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

export const {
  addCustomer,
  updateCustomer,
  deleteCustomer,
} = masterSlice.actions;

export default masterSlice.reducer;
