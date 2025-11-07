// Test script to verify status conversion logic
console.log('🧪 Testing Status Conversion Logic...\n');

// Test the conversion logic from backend status string to frontend isActive boolean
function convertStatusToIsActive(status) {
  return status === 'active';
}

// Test cases
const testCases = [
  { status: 'active', expected: true, description: 'Active user should show as active' },
  { status: 'inactive', expected: false, description: 'Inactive user should show as inactive' },
  { status: 'suspended', expected: false, description: 'Suspended user should show as inactive' },
  { status: null, expected: false, description: 'Null status should show as inactive' },
  { status: undefined, expected: false, description: 'Undefined status should show as inactive' },
  { status: '', expected: false, description: 'Empty status should show as inactive' },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = convertStatusToIsActive(test.status);
  const success = result === test.expected;

  console.log(`Test ${index + 1}: ${success ? '✅ PASS' : '❌ FAIL'} - ${test.description}`);
  console.log(`  Input: '${test.status}' | Expected: ${test.expected} | Got: ${result}`);

  if (success) {
    passed++;
  } else {
    failed++;
  }
  console.log('');
});

console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 All status conversion tests passed!');
} else {
  console.log('❌ Some tests failed. Please check the conversion logic.');
}
