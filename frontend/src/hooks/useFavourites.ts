import { useState, useCallback } from 'react';

const STORAGE_KEY = 'footylive:favouriteTeams';

const load = (): Set<number> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set();
  } catch {
    return new Set();
  }
};

const save = (ids: Set<number>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
};

export const useFavourites = () => {
  const [favourites, setFavourites] = useState<Set<number>>(load);

  const toggle = useCallback((teamId: number) => {
    setFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      save(next);
      return next;
    });
  }, []);

  const isFavourite = useCallback(
    (teamId: number) => favourites.has(teamId),
    [favourites],
  );

  return { favourites, toggle, isFavourite };
};
