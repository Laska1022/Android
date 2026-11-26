import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getOrientationMode,
  setOrientationMode,
  supportsNativeOrientation,
} from '../../src/game/orientation';

const bridge = vi.hoisted(() => ({
  getPlatform: vi.fn(),
  isPluginAvailable: vi.fn(),
  getMode: vi.fn(),
  setMode: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: bridge,
  registerPlugin: () => bridge,
}));

describe('orientation preference', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.each(['web', 'android'])(
    'leaves orientation to the device without a plugin on %s',
    async (platform) => {
      bridge.getPlatform.mockReturnValue(platform);
      bridge.isPluginAvailable.mockReturnValue(false);
      expect(supportsNativeOrientation()).toBe(false);
      expect(await getOrientationMode()).toBe('follow');
      await setOrientationMode('landscape');
      expect(bridge.getMode).not.toHaveBeenCalled();
      expect(bridge.setMode).not.toHaveBeenCalled();
    },
  );

  it('reads native preferences and propagates an unsuccessful Android write', async () => {
    bridge.getPlatform.mockReturnValue('android');
    bridge.isPluginAvailable.mockReturnValue(true);
    bridge.getMode.mockResolvedValue({ mode: 'landscape' });
    expect(supportsNativeOrientation()).toBe(true);
    expect(await getOrientationMode()).toBe('landscape');
    await setOrientationMode('follow');
    expect(bridge.setMode).toHaveBeenCalledWith({ mode: 'follow' });
    bridge.setMode.mockRejectedValue(new Error('storage unavailable'));
    await expect(setOrientationMode('landscape')).rejects.toThrow('storage unavailable');
  });
});
