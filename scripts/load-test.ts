/**
 * Load Testing Script
 * 
 * Führt Lasttests für die WattOS Plattform durch
 * 
 * Usage:
 *   LOAD_TEST_BASE_URL=http://localhost:3000 \
 *   LOAD_TEST_CONCURRENT_USERS=10 \
 *   LOAD_TEST_REQUESTS_PER_USER=10 \
 *   ts-node scripts/load-test.ts
 */

/**
 * Load Testing Script
 * 
 * Führt Lasttests für die WattOS Plattform durch
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

interface LoadTestConfig {
  baseUrl: string;
  concurrentUsers: number;
  requestsPerUser: number;
  endpoints: Array<{
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
  }>;
}

interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  requestsPerSecond: number;
}

async function makeRequest(
  baseUrl: string,
  endpoint: { path: string; method: string; body?: any },
): Promise<{ success: boolean; duration: number; statusCode?: number }> {
  const start = performance.now();
  try {
    const response = await axios({
      method: endpoint.method as any,
      url: `${baseUrl}${endpoint.path}`,
      data: endpoint.body,
      timeout: 30000,
    });
    const duration = performance.now() - start;
    return {
      success: response.status >= 200 && response.status < 300,
      duration,
      statusCode: response.status,
    };
  } catch (error: any) {
    const duration = performance.now() - start;
    return {
      success: false,
      duration,
      statusCode: error.response?.status,
    };
  }
}

async function runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
  const results: Array<{ success: boolean; duration: number }> = [];
  const startTime = performance.now();

  // Simuliere concurrent users
  const userPromises = Array.from({ length: config.concurrentUsers }, async () => {
    const userResults: Array<{ success: boolean; duration: number }> = [];
    for (let i = 0; i < config.requestsPerUser; i++) {
      for (const endpoint of config.endpoints) {
        const result = await makeRequest(config.baseUrl, endpoint);
        userResults.push(result);
        results.push(result);
        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return userResults;
  });

  await Promise.all(userPromises);

  const endTime = performance.now();
  const totalDuration = (endTime - startTime) / 1000; // in seconds

  // Calculate statistics
  const successfulRequests = results.filter((r) => r.success).length;
  const failedRequests = results.length - successfulRequests;
  const durations = results.map((r) => r.duration).sort((a, b) => a - b);
  const averageResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length;
  const minResponseTime = durations[0] || 0;
  const maxResponseTime = durations[durations.length - 1] || 0;
  const p50 = durations[Math.floor(durations.length * 0.5)] || 0;
  const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
  const p99 = durations[Math.floor(durations.length * 0.99)] || 0;
  const requestsPerSecond = results.length / totalDuration;

  return {
    totalRequests: results.length,
    successfulRequests,
    failedRequests,
    averageResponseTime,
    minResponseTime,
    maxResponseTime,
    p50,
    p95,
    p99,
    requestsPerSecond,
  };
}

async function main() {
  const baseUrl = process.env.LOAD_TEST_BASE_URL || 'http://localhost:3000';
  const config: LoadTestConfig = {
    baseUrl,
    concurrentUsers: parseInt(process.env.LOAD_TEST_CONCURRENT_USERS || '10', 10),
    requestsPerUser: parseInt(process.env.LOAD_TEST_REQUESTS_PER_USER || '10', 10),
    endpoints: [
      { path: '/api/v1/health', method: 'GET' },
      { path: '/api/v1/characters', method: 'GET' },
      { path: '/api/v1/dashboard/overview', method: 'GET' },
    ],
  };

  console.log('🚀 Starting Load Test...');
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Concurrent Users: ${config.concurrentUsers}`);
  console.log(`Requests per User: ${config.requestsPerUser}`);
  console.log(`Total Requests: ${config.concurrentUsers * config.requestsPerUser * config.endpoints.length}`);
  console.log('');

  const result = await runLoadTest(config);

  console.log('📊 Load Test Results:');
  console.log(`Total Requests: ${result.totalRequests}`);
  console.log(`Successful: ${result.successfulRequests}`);
  console.log(`Failed: ${result.failedRequests}`);
  console.log(`Success Rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%`);
  console.log('');
  console.log('⏱️  Response Times:');
  console.log(`Average: ${result.averageResponseTime.toFixed(2)}ms`);
  console.log(`Min: ${result.minResponseTime.toFixed(2)}ms`);
  console.log(`Max: ${result.maxResponseTime.toFixed(2)}ms`);
  console.log(`P50: ${result.p50.toFixed(2)}ms`);
  console.log(`P95: ${result.p95.toFixed(2)}ms`);
  console.log(`P99: ${result.p99.toFixed(2)}ms`);
  console.log('');
  console.log(`📈 Throughput: ${result.requestsPerSecond.toFixed(2)} requests/second`);

  // Exit with error code if failure rate is too high
  const failureRate = result.failedRequests / result.totalRequests;
  if (failureRate > 0.1) {
    console.error('❌ Failure rate exceeds 10%');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Load test failed:', error);
    process.exit(1);
  });
}

export { runLoadTest, LoadTestConfig, LoadTestResult };

