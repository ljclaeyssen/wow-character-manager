import { TestBed } from '@angular/core/testing';
import { ResetService } from './reset.service';

describe('ResetService', () => {
  let service: ResetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have resetEvent$ observable', () => {
    expect(service.resetEvent$).toBeDefined();
    expect(typeof service.resetEvent$.subscribe).toBe('function');
  });

  it('should provide next reset date', () => {
    const nextReset = service.getNextResetDate();
    expect(nextReset).toBeInstanceOf(Date);
  });

  it('should provide current week reset date', () => {
    const currentWeekReset = service.getCurrentWeekResetDate();
    expect(currentWeekReset).toBeInstanceOf(Date);
  });

  it('should provide reset info', () => {
    const resetInfo = service.getResetInfo();
    expect(resetInfo).toBeDefined();
    expect(typeof resetInfo.daysUntilReset).toBe('number');
    expect(typeof resetInfo.hoursUntilReset).toBe('number');
    expect(typeof resetInfo.minutesUntilReset).toBe('number');
    expect(typeof resetInfo.isResetDay).toBe('boolean');
    expect(resetInfo.nextResetDate).toBeInstanceOf(Date);
  });

  it('should format time until reset', () => {
    const formatted = service.getFormattedTimeUntilReset();
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('should check for reset', () => {
    const result = service.checkForReset();
    expect(typeof result).toBe('boolean');
  });

  it('should get days since reset', () => {
    const days = service.getDaysSinceReset();
    expect(typeof days).toBe('number');
    expect(days).toBeGreaterThanOrEqual(0);
  });

  it('should get reset status message', () => {
    const message = service.getResetStatusMessage();
    expect(typeof message).toBe('string');
    expect(message.length).toBeGreaterThan(0);
  });

  it('should start periodic reset check without errors', () => {
    expect(() => service.startPeriodicResetCheck()).not.toThrow();
  });

  it('should trigger manual reset', () => {
    expect(() => service.triggerManualReset()).not.toThrow();
  });

  it('should destroy cleanly', () => {
    expect(() => service.destroy()).not.toThrow();
  });
});