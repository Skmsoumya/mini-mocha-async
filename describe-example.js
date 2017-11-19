import assert from 'assert';
import { test, testSuite, setup, teardown } from './describe';

const obj = {};
testSuite('True Or False? ', () => {
  testSuite('setup', () => {
    test('should setup num', () => {
      assert.equal(obj.num, 2);
    });
    setup(() => {
      obj.num = 2;
    });
    teardown(() => {
      obj.num = null;
    });
  });

  testSuite('teardown', () => {
    test('should teardown num', () => {
      assert.equal(obj.num, null);
    });
  });

  testSuite('truthy => ', () => {
    test('empty array', () => {
      assert.equal(!![0], true);
    });

    test('empty object', () => {
      assert.equal(!!{}, true);
    });
  });

  testSuite('falsy => ', () => {
    testSuite('undefined & nil', () => {
      test('undefined', () => {
        assert.equal(!(void 0), true);
      });
      test('null', () => {
        assert.equal(!null, true);
      });
    });

    test('should test ![] === true ', () => {
      assert.equal(![], true);
    });

    test('!NaN === true', () => {
      assert.equal(!NaN, true);
    });
    test('!(empty string) === true', () => {
      assert.equal(!'', true);
    });
  });
});
