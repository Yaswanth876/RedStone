import { useEffect } from 'react';

/**
 * Custom hook to update document title per view.
 * @param {string} title
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} — RedStone` : 'RedStone — Student Timetable & Productivity';
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}

export default useDocumentTitle;
