interface ParsedMssqlConnection {
  server: string;
  port: number;
  database?: string;
  user?: string;
  password?: string;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
  };
}

export function parseMssqlConnectionString(url: string): ParsedMssqlConnection {
  const withoutScheme = url.replace(/^sqlserver:\/\//i, '');
  const segments = withoutScheme.split(';').filter((s) => s.trim() !== '');

  const [hostPort, ...rest] = segments;
  const [server, portStr] = hostPort.split(':');

  const params: Record<string, string> = {};
  for (const segment of rest) {
    const idx = segment.indexOf('=');
    if (idx === -1) continue;
    const key = segment.slice(0, idx).trim().toLowerCase();
    const value = segment.slice(idx + 1).trim();
    params[key] = value;
  }

  return {
    server,
    port: portStr ? Number(portStr) : 1433,
    database: params['database'] ?? params['initial catalog'],
    user: params['user'] ?? params['username'],
    password: params['password'],
    options: {
      encrypt: params['encrypt'] === 'true',
      trustServerCertificate: params['trustservercertificate'] === 'true',
    },
  };
}
