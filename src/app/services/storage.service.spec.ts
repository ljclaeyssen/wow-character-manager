import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    spyOn(localStorage, 'getItem').and.callFake((key: string) => mockLocalStorage[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete mockLocalStorage[key];
    });
    spyOn(localStorage, 'clear').and.callFake(() => {
      mockLocalStorage = {};
    });
    spyOnProperty(localStorage, 'length', 'get').and.returnValue(Object.keys(mockLocalStorage).length);

    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get method', () => {
    it('should retrieve data from localStorage', () => {
      const testData = { name: 'test', value: 123 };
      mockLocalStorage['testKey'] = JSON.stringify(testData);

      const result = service.get('testKey');

      expect(result).toEqual(testData);
      expect(localStorage.getItem).toHaveBeenCalledWith('testKey');
    });

    it('should return null for non-existent keys', () => {
      const result = service.get('nonExistentKey');

      expect(result).toBeNull();
      expect(localStorage.getItem).toHaveBeenCalledWith('nonExistentKey');
    });

    it('should return null and log error for invalid JSON', () => {
      spyOn(console, 'error');
      mockLocalStorage['invalidKey'] = 'invalid json {';

      const result = service.get('invalidKey');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle localStorage access errors', () => {
      spyOn(console, 'error');
      (localStorage.getItem as jasmine.Spy).and.throwError('Storage error');

      const result = service.get('testKey');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('set method', () => {
    it('should store data in localStorage', () => {
      const testData = { name: 'test', value: 123 };

      const result = service.set('testKey', testData);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify(testData));
    });

    it('should return false and log error on storage failure', () => {
      spyOn(console, 'error');
      (localStorage.setItem as jasmine.Spy).and.throwError('Storage error');

      const result = service.set('testKey', { data: 'test' });

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle circular reference objects', () => {
      spyOn(console, 'error');
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      const result = service.set('testKey', circularObj);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('remove method', () => {
    it('should remove data from localStorage', () => {
      mockLocalStorage['testKey'] = 'test data';

      const result = service.remove('testKey');

      expect(result).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith('testKey');
      expect(mockLocalStorage['testKey']).toBeUndefined();
    });

    it('should return false and log error on removal failure', () => {
      spyOn(console, 'error');
      (localStorage.removeItem as jasmine.Spy).and.throwError('Storage error');

      const result = service.remove('testKey');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('clear method', () => {
    it('should clear all localStorage data', () => {
      mockLocalStorage['key1'] = 'value1';
      mockLocalStorage['key2'] = 'value2';

      const result = service.clear();

      expect(result).toBe(true);
      expect(localStorage.clear).toHaveBeenCalled();
      expect(Object.keys(mockLocalStorage).length).toBe(0);
    });

    it('should return false and log error on clear failure', () => {
      spyOn(console, 'error');
      (localStorage.clear as jasmine.Spy).and.throwError('Storage error');

      const result = service.clear();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('exists method', () => {
    it('should return true for existing keys', () => {
      mockLocalStorage['testKey'] = 'test data';

      const result = service.exists('testKey');

      expect(result).toBe(true);
      expect(localStorage.getItem).toHaveBeenCalledWith('testKey');
    });

    it('should return false for non-existing keys', () => {
      const result = service.exists('nonExistentKey');

      expect(result).toBe(false);
      expect(localStorage.getItem).toHaveBeenCalledWith('nonExistentKey');
    });

    it('should return false and log error on access failure', () => {
      spyOn(console, 'error');
      (localStorage.getItem as jasmine.Spy).and.throwError('Storage error');

      const result = service.exists('testKey');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getAllKeys method', () => {
    it('should return all localStorage keys', () => {
      mockLocalStorage['key1'] = 'value1';
      mockLocalStorage['key2'] = 'value2';
      mockLocalStorage['key3'] = 'value3';

      const keys = service.getAllKeys();

      expect(keys).toEqual(['key1', 'key2', 'key3']);
    });

    it('should return empty array on error', () => {
      spyOn(console, 'error');
      spyOn(Object, 'keys').and.throwError('Error accessing keys');

      const keys = service.getAllKeys();

      expect(keys).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getSize method', () => {
    it('should return localStorage size', () => {
      mockLocalStorage['key1'] = 'value1';
      mockLocalStorage['key2'] = 'value2';

      const size = service.getSize();

      expect(size).toBe(2);
    });

    it('should return 0 on error', () => {
      spyOn(console, 'error');
      Object.defineProperty(localStorage, 'length', {
        get: () => { throw new Error('Access error'); }
      });

      const size = service.getSize();

      expect(size).toBe(0);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('isAvailable method', () => {
    it('should return true when localStorage is available', () => {
      const result = service.isAvailable();

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('___storage_test___', 'test');
      expect(localStorage.removeItem).toHaveBeenCalledWith('___storage_test___');
    });

    it('should return false when localStorage is not available', () => {
      (localStorage.setItem as jasmine.Spy).and.throwError('Storage not available');

      const result = service.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe('validateData method', () => {
    it('should validate data using provided validator', () => {
      const validator = (data: unknown): data is { name: string } => {
        return typeof data === 'object' && data !== null && 'name' in data;
      };
      const validData = { name: 'test' };
      const invalidData = 'invalid';

      expect(service.validateData(validData, validator)).toBe(true);
      expect(service.validateData(invalidData, validator)).toBe(false);
    });
  });

  describe('getWithValidation method', () => {
    it('should return validated data', () => {
      const testData = { name: 'test', value: 123 };
      const validator = (data: unknown): data is typeof testData => {
        return typeof data === 'object' && data !== null && 'name' in data && 'value' in data;
      };
      mockLocalStorage['testKey'] = JSON.stringify(testData);

      const result = service.getWithValidation('testKey', validator);

      expect(result).toEqual(testData);
    });

    it('should return null for invalid data and log warning', () => {
      spyOn(console, 'warn');
      const invalidData = { wrongField: 'test' };
      const validator = (data: unknown): data is { name: string } => {
        return typeof data === 'object' && data !== null && 'name' in data;
      };
      mockLocalStorage['testKey'] = JSON.stringify(invalidData);

      const result = service.getWithValidation('testKey', validator);

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should return null for non-existent keys', () => {
      const validator = (data: unknown): data is { name: string } => true;

      const result = service.getWithValidation('nonExistentKey', validator);

      expect(result).toBeNull();
    });
  });

  describe('setWithExpiry method', () => {
    it('should store data with expiry time', () => {
      const testData = { name: 'test' };
      const expiryInMinutes = 60;

      const result = service.setWithExpiry('testKey', testData, expiryInMinutes);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();

      // Verify the stored data has expiry
      const storedDataCall = (localStorage.setItem as jasmine.Spy).calls.mostRecent();
      const storedData = JSON.parse(storedDataCall.args[1]);
      expect(storedData.value).toEqual(testData);
      expect(storedData.expiry).toBeGreaterThan(Date.now());
    });

    it('should return false on storage error', () => {
      spyOn(console, 'error');
      (localStorage.setItem as jasmine.Spy).and.throwError('Storage error');

      const result = service.setWithExpiry('testKey', { data: 'test' }, 60);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getWithExpiry method', () => {
    it('should return data before expiry', () => {
      const testData = { name: 'test' };
      const futureExpiry = Date.now() + (60 * 60 * 1000); // 1 hour from now
      const dataWithExpiry = { value: testData, expiry: futureExpiry };
      mockLocalStorage['testKey'] = JSON.stringify(dataWithExpiry);

      const result = service.getWithExpiry('testKey');

      expect(result).toEqual(testData);
    });

    it('should return null and remove expired data', () => {
      const testData = { name: 'test' };
      const pastExpiry = Date.now() - (60 * 60 * 1000); // 1 hour ago
      const dataWithExpiry = { value: testData, expiry: pastExpiry };
      mockLocalStorage['testKey'] = JSON.stringify(dataWithExpiry);

      const result = service.getWithExpiry('testKey');

      expect(result).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('testKey');
    });

    it('should return null for non-existent data', () => {
      const result = service.getWithExpiry('nonExistentKey');

      expect(result).toBeNull();
    });

    it('should return null and log error on access failure', () => {
      spyOn(console, 'error');
      (localStorage.getItem as jasmine.Spy).and.throwError('Access error');

      const result = service.getWithExpiry('testKey');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });
});