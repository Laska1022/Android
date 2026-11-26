import { Capacitor, registerPlugin } from '@capacitor/core';

export const GAME_BACK_EVENT = 'rvaBack';

const navigation = registerPlugin<{
  setHandled(options: { handled: boolean }): Promise<void>;
}>('GameNavigation');

export async function setGameBackHandled(handled: boolean): Promise<void> {
  if (Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('GameNavigation')) {
    await navigation.setHandled({ handled });
  }
}
