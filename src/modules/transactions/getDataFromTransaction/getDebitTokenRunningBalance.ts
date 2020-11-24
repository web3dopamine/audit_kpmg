import { validate } from '../../../utils/validate';
import { RunningBalances } from '../../assets/getAssetsFromTransactions';
import { formatValue } from '../../tokens/formatValue';
import { CombinedTransaction } from '../combineTransactions/combineTransactions';
import { getDebitToken } from './getDebitToken';
import { SymbolData } from './types';

export const getDebitTokenRunningBalance = (
  combinedTransaction: CombinedTransaction,
  runningBalances?: RunningBalances
): SymbolData | null => {
  const { date } = combinedTransaction;
  const currentRunningBalances = validate(runningBalances, 'No runningBalances');

  const debitToken = getDebitToken(combinedTransaction);

  if (!debitToken) {
    return null;
  }

  const tokenRunningBalances = currentRunningBalances[debitToken.name];

  if (!tokenRunningBalances) {
    throw new Error(`No running balance for token ${tokenRunningBalances} found`);
  }

  const tokenRunningBalancesAtDate = tokenRunningBalances[date.valueOf()];

  if (!tokenRunningBalancesAtDate) {
    throw new Error(
      `No running balance for token found for ${debitToken.name} at ${date.valueOf()}`
    );
  }

  const value = tokenRunningBalancesAtDate.value;
  const valueInDecimals = formatValue(value, 18, false);
  const valueInRoundedDecimals = formatValue(value, 18);

  return {
    value,
    valueInDecimals,
    valueInRoundedDecimals,
    decimals: tokenRunningBalancesAtDate.decimals,
    symbol: tokenRunningBalancesAtDate.symbol,
    name: tokenRunningBalancesAtDate.name,
  };
};
