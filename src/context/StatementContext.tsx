import dayjs from 'dayjs';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { AssetData } from '../components/AssetsResult';
import { getAddressesFromInput } from '../components/StatementForm';
import { RunningBalances } from '../modules/assets/getAssetsFromTransactions';
import { useAssetResults } from '../modules/assets/useAssetResults';
import { useAssets } from '../modules/assets/useAssets';
import { CombinedTransactions } from '../modules/transactions/combineTransactions/combineTransactions';
import { useAllTransactions } from '../modules/transactions/useAllTransactions';

interface StatementContext {
  addressesString: string;
  addresses: string[];
  startDate: Date;
  endDate: Date;
  setAddressesString: (value: string) => void;
  setStartDate: (value: Date) => void;
  setEndDate: (value: Date) => void;
  allTransactions: CombinedTransactions;
  transactionsWithinDateRange: CombinedTransactions;
  isFetching: boolean;
  hasFetched: boolean;
  error: Error | null;
  startAssetsData: AssetData;
  endAssetsData: AssetData;
  runningBalances: RunningBalances | null;
  fetchTransactions: () => Promise<void>;
}

const StatementContext = React.createContext<StatementContext | null>(null);

const LOCAL_STORAGE_KEY = 'eth-statement-addresses';
const setAddressesStringToLocalStorage = (addressesString: string) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, addressesString);
};
const getAddressesStringFromLocalStorage = () => {
  return localStorage.getItem(LOCAL_STORAGE_KEY) ?? '';
};

export const StatementContextProvider: React.FC = ({ children }) => {
  // Note this is a comma separated string, not an array
  const [addressesString, setAddressesString] = useState(getAddressesStringFromLocalStorage());
  const [startDate, setStartDate] = useState(
    dayjs().subtract(1, 'month').startOf('month').toDate()
  );
  const [endDate, setEndDate] = useState(dayjs().subtract(1, 'month').endOf('month').toDate());

  const addresses = useMemo(() => {
    return getAddressesFromInput(addressesString);
  }, [addressesString]);

  const {
    transactions,
    transactionsWithinDateRange,
    fetchTransactions,
    hasFetched,
    isFetching,
    error,
  } = useAllTransactions({
    addresses: addresses,
    startDate: startDate,
    endDate: endDate,
  });

  const { assets: startAssets } = useAssets({
    transactions,
    date: startDate,
  });

  const { assets: endAssets, runningBalances } = useAssets({
    transactions,
    date: endDate,
  });

  const startAssetsResults = useAssetResults(startAssets, startDate);
  const endAssetsResults = useAssetResults(endAssets, endDate);

  const handleFetchTransactions = useCallback(async () => {
    setAddressesStringToLocalStorage(addressesString);
    return fetchTransactions();
  }, [addressesString]);

  return (
    <StatementContext.Provider
      value={{
        addressesString,
        addresses,
        startDate,
        endDate,
        setAddressesString,
        setStartDate,
        setEndDate,
        allTransactions: transactions,
        transactionsWithinDateRange,
        startAssetsData: {
          date: startDate,
          assets: startAssets,
          ...startAssetsResults,
        },
        endAssetsData: {
          date: endDate,
          assets: endAssets,
          ...endAssetsResults,
        },
        runningBalances,
        isFetching,
        hasFetched,
        error,
        fetchTransactions: handleFetchTransactions,
      }}
    >
      {children}
    </StatementContext.Provider>
  );
};

export const useStatementContext = () => {
  const context = useContext(StatementContext);

  if (!context) {
    throw new Error('No Context Provider for StatementContext found');
  }

  return context;
};
