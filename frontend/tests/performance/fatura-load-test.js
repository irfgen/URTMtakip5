/**
 * k6 Performance Test for Fatura & İrsaliye System
 * Run with: k6 run fatura-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const faturaListTiming = new Rate('fatura_list_timing');
const faturaDetailTiming = new Rate('fatura_detail_timing');
const eslestirmeTiming = new Rate('eslestirme_timing');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.05'],    // Error rate under 5%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export default function () {
  // Test 1: Get fatura list
  const listRes = http.get(`${BASE_URL}/api/faturalar?page=1&limit=20`, {
    tags: { name: 'FaturaList' },
  });

  check(listRes, {
    'fatura list status 200': (r) => r.status === 200,
    'fatura list response time < 500ms': (r) => r.timings.duration < 500,
  }) && faturaListTiming.add(listRes.timings.duration < 500);

  sleep(1);

  // Test 2: Get random fatura detail
  const randomId = Math.floor(Math.random() * 50) + 1;
  const detailRes = http.get(`${BASE_URL}/api/faturalar/${randomId}`, {
    tags: { name: 'FaturaDetail' },
  });

  check(detailRes, {
    'fatura detail status 200 or 404': (r) => r.status === 200 || r.status === 404,
    'fatura detail response time < 300ms': (r) => r.timings.duration < 300,
  }) && faturaDetailTiming.add(detailRes.timings.duration < 300);

  sleep(1);

  // Test 3: Get eşleştirme önerileri
  const eslestirmeRes = http.get(`${BASE_URL}/api/eslestirme/${randomId}/oneriler`, {
    tags: { name: 'EslestirmeOneriler' },
  });

  check(eslestirmeRes, {
    'eşleştirme önerileri status 200': (r) => r.status === 200,
    'eşleştirme response time < 1000ms': (r) => r.timings.duration < 1000,
  }) && eslestirmeTiming.add(eslestirmeRes.timings.duration < 1000);

  sleep(2);
}

export function handleSummary(data) {
  console.log('Performance Test Summary:');
  console.log(`- Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`- P95 response time: ${data.metrics.http_req_duration.values['p(95)']}ms`);
  console.log(`- Error rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  console.log(`- Fatura list P95: ${data.metrics.fatura_list_timing.values['p(95)']}`);
  console.log(`- Fatura detail P95: ${data.metrics.fatura_detail_timing.values['p(95)']}`);
  console.log(`- Eşleştirme P95: ${data.metrics.eslestirme_timing.values['p(95)']}`);
}
