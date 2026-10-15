import tailwind from '@tailwindcss/postcss';
import { legacyCssCascade } from './scripts/lib/legacy-css-cascade.mjs';

export default {
  plugins: [tailwind(), legacyCssCascade()],
};
