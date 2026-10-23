import { createContext, useContext } from 'react';

const DataSourceContext = createContext(null);

/** Provides the app's data source (lib/dataSource.js) to every page. */
export function DataSourceProvider({ source, children }) {
  return <DataSourceContext.Provider value={source}>{children}</DataSourceContext.Provider>;
}

export function useDataSource() {
  const source = useContext(DataSourceContext);
  if (!source) throw new Error('useDataSource must be used inside <DataSourceProvider>');
  return source;
}
