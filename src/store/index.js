import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import masters from './masterSlice';
import reload from '../reload/reloadSlice'; 
import auth from '../reload/authSlice';

const rootReducer = combineReducers({
  auth,
  masters,
  reload,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'masters', 'reload'], // 👈 IMPORTANT
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);
