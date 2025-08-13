// Archivo: debug-db.js
// Script para diagnosticar problemas de conexión a Neon

const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

console.log('🔍 Diagnosing database connection...\n');

// 1. Verificar que DATABASE_URL existe
console.log('1. Checking DATABASE_URL...');
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in .env.local');
  console.log('💡 Create .env.local file with DATABASE_URL=...');
  process.exit(1);
}

console.log('✅ DATABASE_URL found');

// 2. Verificar formato de URL
console.log('\n2. Checking URL format...');
try {
  const url = new URL(dbUrl);
  console.log(`✅ Protocol: ${url.protocol}`);
  console.log(`✅ Host: ${url.hostname}`);
  console.log(`✅ Database: ${url.pathname.substring(1)}`);
  
  // Verificar que es una URL de Neon
  if (!url.hostname.includes('neon')) {
    console.warn('⚠️  URL doesn\'t seem to be from Neon');
  }
  
  // Verificar SSL
  if (!url.searchParams.has('sslmode')) {
    console.warn('⚠️  Missing sslmode parameter');
    console.log('💡 Add ?sslmode=require to your DATABASE_URL');
  }
  
} catch (error) {
  console.error('❌ Invalid DATABASE_URL format:', error.message);
  console.log('💡 Expected format: postgresql://user:pass@host/db?sslmode=require');
  process.exit(1);
}

// 3. Test network connectivity
console.log('\n3. Testing network connectivity...');

async function testConnection() {
  try {
    // Probar conexión HTTP básica al host
    const url = new URL(dbUrl);
    const testUrl = `https://${url.hostname}`;
    
    console.log(`Testing connection to ${url.hostname}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(testUrl, { 
      signal: controller.signal,
      method: 'HEAD' 
    });
    clearTimeout(timeoutId);
    
    console.log('✅ Network connectivity OK');
    
  } catch (error) {
    console.error('❌ Network connectivity failed:', error.message);
    
    if (error.name === 'AbortError') {
      console.log('💡 Connection timeout - check your internet connection');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 DNS resolution failed - check the hostname in DATABASE_URL');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Connection refused - database might be down');
    } else {
      console.log('💡 Network error - check your firewall/proxy settings');
    }
  }
}

// 4. Test database connection
async function testDatabaseConnection() {
  console.log('\n4. Testing database connection...');
  
  try {
    const { Pool } = require('@neondatabase/serverless');
    const pool = new Pool({ 
      connectionString: dbUrl,
      // Add connection options
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    });
    
    console.log('Attempting database connection...');
    const client = await pool.connect();
    
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Query successful');
    console.log(`🕐 Current time: ${result.rows[0].current_time}`);
    console.log(`📊 PostgreSQL version: ${result.rows[0].db_version.split(' ')[0]}`);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('💡 Check your username/password in DATABASE_URL');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('💡 Check your database name in DATABASE_URL');
    } else if (error.message.includes('timeout') || error.message.includes('WebSocket')) {
      console.log('💡 Connection timeout - your Neon database might be sleeping');
      console.log('💡 Try accessing Neon Console to wake it up: https://console.neon.tech/');
    } else if (error.message.includes('fetch failed')) {
      console.log('💡 Network/SSL issue - check your internet connection');
      console.log('💡 Make sure DATABASE_URL has ?sslmode=require');
    } else {
      console.log('💡 Unknown database error - check Neon Console for database status');
    }
  }
}

// Run all tests
async function runDiagnostics() {
  await testConnection();
  await testDatabaseConnection();
  
  console.log('\n🎯 Next steps:');
  console.log('1. If network fails: Check internet connection/firewall');
  console.log('2. If DB connection fails: Check Neon Console (https://console.neon.tech/)');
  console.log('3. If DB is sleeping: Access Neon Console to wake it up');
  console.log('4. If credentials wrong: Update DATABASE_URL in .env.local');
}

runDiagnostics().catch(console.error);