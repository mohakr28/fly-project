import { useEffect, useCallback } from 'react';

/**
 * A custom hook to implement infinite scrolling.
 * @param {React.RefObject} loaderRef - A ref attached to the loader element at the bottom of the list.
 * @param {boolean} isLoading - State to prevent fetching while another fetch is in progress.
 * @param {boolean} hasNextPage - State to know if there are more pages to load.
 * @param {function} loadMore - The callback function to fetch the next page.
 */
export const useInfiniteScroll = (loaderRef, isLoading, hasNextPage, loadMore) => {
  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    // Trigger loadMore only when the loader is visible, not currently loading, and has more pages.
    if (target.isIntersecting && !isLoading && hasNextPage) {
      loadMore();
    }
  }, [isLoading, hasNextPage, loadMore]);

  useEffect(() => {
    const options = {
      root: null, // relative to the viewport
      rootMargin: '20px', // start loading 20px before it's visible
      threshold: 0,
    };

    const observer = new IntersectionObserver(handleObserver, options);
    const currentLoader = loaderRef.current;

    if (currentLoader) {
      observer.observe(currentLoader);
    }

    // Cleanup observer on component unmount
    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [loaderRef, handleObserver]);
};