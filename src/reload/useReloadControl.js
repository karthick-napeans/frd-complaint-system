import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { markRehydrated } from './reloadSlice';
import { loadMasters } from '../store/masterSlice';
import { shouldLoadMasters } from './reloadManager';

export const useReloadControl = () => {
  const dispatch = useDispatch();
  const state = useSelector(state => state);

  useEffect(() => {
    if (shouldLoadMasters(state)) {
      dispatch(loadMasters());
    }

    dispatch(markRehydrated());
  }, [dispatch]); // runs ONCE after reload
};
