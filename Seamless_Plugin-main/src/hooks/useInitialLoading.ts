import { useEffect, useState } from 'react';

export const useInitialLoading = (loading: boolean): boolean => {
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (!loading) {
      setHasLoadedOnce(true);
    }
  }, [loading]);

  return loading && !hasLoadedOnce;
};

