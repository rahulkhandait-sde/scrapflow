import { Log, LogCollector, LogFunction, LogLevel, LogLevels } from "./types";

export function createLogCollector(): LogCollector {
  const logs: Log[] = [];

  const getAll = () => logs;

  const logFunctions = {} as Record<LogLevel, LogFunction>;

  LogLevels.forEach(
    (level) =>
      (logFunctions[level] = (message: string) => {
        logs.push({ level, message, timeStamp: new Date() });
      })
  );

  return {
    getAll,
    ...logFunctions,
  };
}
