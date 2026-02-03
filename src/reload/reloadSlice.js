import { createSlice } from '@reduxjs/toolkit';

const reloadSlice = createSlice({
  name: 'reload',
  initialState: {
    rehydrated: false, // redux-persist finished
    lastReloadAt: null,
  },
  reducers: {
    markRehydrated(state) {
      state.rehydrated = true;
      state.lastReloadAt = Date.now();
    },
  },
});

export const { markRehydrated } = reloadSlice.actions;
export default reloadSlice.reducer;
