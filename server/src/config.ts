import { env } from './config/env.js';

export { env };
export const config = () => env;
export type AppConfig = typeof env;
