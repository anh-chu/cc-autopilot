import { createLogger } from "../../src/lib/logger";

export const logger = createLogger("daemon", { sync: true });
