/**
 * Check if a process is alive by PID.
 * @param assumeAliveIfZero - If true, pid <= 0 returns true (for just-spawned processes). Default: false.
 */
export function isProcessAlive(
	pid: number,
	assumeAliveIfZero = false,
): boolean {
	if (pid <= 0) return assumeAliveIfZero;
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}
