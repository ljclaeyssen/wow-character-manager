import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  get<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      if (data === null) {
        return null;
      }
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Failed to retrieve data for key "${key}":`, error);
      return null;
    }
  }

  set<T>(key: string, value: T): boolean {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      console.error(`Failed to store data for key "${key}":`, error);
      return false;
    }
  }

  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove data for key "${key}":`, error);
      return false;
    }
  }

  clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }

  exists(key: string): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Failed to check existence for key "${key}":`, error);
      return false;
    }
  }

  getAllKeys(): string[] {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Failed to retrieve localStorage keys:', error);
      return [];
    }
  }

  getSize(): number {
    try {
      return localStorage.length;
    } catch (error) {
      console.error('Failed to get localStorage size:', error);
      return 0;
    }
  }

  isAvailable(): boolean {
    try {
      const testKey = '___storage_test___';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  validateData<T>(data: unknown, validator: (data: unknown) => data is T): data is T {
    return validator(data);
  }

  getWithValidation<T>(key: string, validator: (data: unknown) => data is T): T | null {
    try {
      const data = this.get(key);
      if (data === null) {
        return null;
      }
      if (this.validateData(data, validator)) {
        return data;
      }
      console.warn(`Invalid data format for key "${key}"`);
      return null;
    } catch (error) {
      console.error(`Failed to retrieve and validate data for key "${key}":`, error);
      return null;
    }
  }

  setWithExpiry<T>(key: string, value: T, expiryInMinutes: number): boolean {
    try {
      const expiryTime = Date.now() + (expiryInMinutes * 60 * 1000);
      const dataWithExpiry = {
        value,
        expiry: expiryTime
      };
      return this.set(key, dataWithExpiry);
    } catch (error) {
      console.error(`Failed to store data with expiry for key "${key}":`, error);
      return false;
    }
  }

  getWithExpiry<T>(key: string): T | null {
    try {
      const data = this.get<{ value: T; expiry: number }>(key);
      if (data === null) {
        return null;
      }

      if (Date.now() > data.expiry) {
        this.remove(key);
        return null;
      }

      return data.value;
    } catch (error) {
      console.error(`Failed to retrieve data with expiry for key "${key}":`, error);
      return null;
    }
  }
}