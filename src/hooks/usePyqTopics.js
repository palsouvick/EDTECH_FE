import { useMemo } from 'react';
import { useDataSource } from '../app/DataSourceContext';
import { useResource } from './useResource';

/**
 * The chapters that have at least one previous-year question, as a Set of "subject.topic".
 * Null while loading or when the list can't be loaded. Shares the PYQ page's cached
 * /pyq/filters response, so it costs one request per session.
 */
export function usePyqTopics() {
  const source = useDataSource();
  const filters = useResource('pyq:filters', () => source.getPyqFilters?.() ?? Promise.resolve(null));
  return useMemo(() => {
    const topics = filters.data?.topics;
    return topics ? new Set(topics.filter((t) => t.count > 0).map((t) => `${t.subject}.${t.topic}`)) : null;
  }, [filters.data]);
}
