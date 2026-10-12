import { AlertButton, Platform, Alert as NativeAlert } from 'react-native';

// react-native-web ships Alert.alert as a no-op, so web falls back to the
// browser's own dialogs. Same call signature as Alert.alert.
function alert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    NativeAlert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;
  const actions = (buttons ?? []).filter((button) => button.style !== 'cancel');
  const cancel = (buttons ?? []).find((button) => button.style === 'cancel');

  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  if (actions.length === 1) {
    if (window.confirm(text)) {
      actions[0].onPress?.();
    } else {
      cancel?.onPress?.();
    }
    return;
  }

  // Several choices: offer them one at a time until one is taken.
  for (const action of actions) {
    if (window.confirm(`${text}\n\n${action.text}?`)) {
      action.onPress?.();
      return;
    }
  }
  cancel?.onPress?.();
}

export const Alert = { alert };
