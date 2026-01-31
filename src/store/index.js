import { configureStore } from '@reduxjs/toolkit';
import masters from './masterSlice';

export const store = configureStore({
  reducer: {
    masters,
  },
});
