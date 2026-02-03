export const shouldLoadMasters = (state) => {
  return !state.masters.loaded;
};

export const shouldReloadPageData = () => {
  return true; // always reload page-level APIs
};
