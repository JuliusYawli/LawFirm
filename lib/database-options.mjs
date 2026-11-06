// Do not let URL sslmode=require silently disable server-certificate verification.
export function databaseOptions(connectionString, { production = false, allowInsecureLocal = false, ca } = {}) {
 const url = new URL(connectionString);
 if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname) throw Error('Invalid database configuration');
 const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
 const ssl = loopback && allowInsecureLocal && !production ? false : { rejectUnauthorized: true, ...(ca ? { ca } : {}) };
 return { ssl, max: 1, idle_timeout: 20, connect_timeout: 10, prepare: false, connection: { statement_timeout: 8000 } };
}
