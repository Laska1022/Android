import { Capacitor, registerPlugin } from '@capacitor/core';

export type OrientationMode = 'landscape' | 'follow';

const nativeOrientation = registerPlugin<{
  getMode(): Promise<{ mode: OrientationMode }>;
  setMode(options: { mode: OrientationMode }): Promise<void>;
}>('GameOrientation');

export function supportsNativeOrientation() {
  return Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('GameOrientation');
}

export async function getOrientationMode(): Promise<OrientationMode> {
  if (!supportsNativeOrientation()) return 'follow';
  return (await nativeOrientation.getMode()).mode;
}

export async function setOrientationMode(mode: OrientationMode): Promise<void> {
  if (supportsNativeOrientation()) await nativeOrientation.setMode({ mode });
}
