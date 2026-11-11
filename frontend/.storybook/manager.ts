import { addons } from 'storybook/manager-api';
import { blueprintDarkTheme } from './blueprintTheme';

addons.setConfig({
  theme: blueprintDarkTheme,
  sidebar: {
    showRoots: true,
  },
});
