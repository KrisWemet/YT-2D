import {createContext} from 'react';

// Enabled only by the chapter's vertical cuts. Existing compositions use their own dimensions.
export const ShortLayout = createContext<{focusX?: number} | null>(null);
