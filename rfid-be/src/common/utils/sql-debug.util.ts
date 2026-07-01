export function interpolateSqlParams(
  query: string,
  paramsJson: string,
): string {
  let params: unknown[];
  try {
    params = JSON.parse(paramsJson);
  } catch {
    return `${query}\n-- Params (raw, không parse được): ${paramsJson}`;
  }

  return query.replace(/@P(\d+)/g, (match, indexStr: string) => {
    const index = Number(indexStr) - 1;
    if (index < 0 || index >= params.length) return match;
    return formatSqlValue(params[index]);
  });
}

function formatSqlValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';

  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }

  if (value instanceof Date) {
    return `N'${value.toISOString()}'`;
  }

  const escaped = String(value).replace(/'/g, "''");
  return `N'${escaped}'`;
}
