const D1_MAX_BOUND_PARAMETERS = 100

export function chunkForD1Bindings<T>(
  values: readonly T[],
  bindingsPerValue = 1,
  reservedBindings = 0
): T[][] {
  const maxValuesPerQuery = Math.floor((D1_MAX_BOUND_PARAMETERS - reservedBindings) / bindingsPerValue)
  if (
    !Number.isInteger(bindingsPerValue)
    || bindingsPerValue < 1
    || !Number.isInteger(reservedBindings)
    || reservedBindings < 0
    || maxValuesPerQuery < 1
  ) {
    throw new RangeError('D1 query binding budget must allow at least one value')
  }

  const batches: T[][] = []
  for (let start = 0; start < values.length; start += maxValuesPerQuery) {
    batches.push(values.slice(start, start + maxValuesPerQuery))
  }

  return batches
}
