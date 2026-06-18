import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.swccg.catalogue',
  appName: 'SWCCG Catalogue',
  webDir: 'dist',
  android: {
    // Allow hot-linked card art (res.starwarsccg.org) over the WebView.
    allowMixedContent: false,
  },
};

export default config;
