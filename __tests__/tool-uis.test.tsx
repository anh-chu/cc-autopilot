import { describe, expect, it } from "vitest";
import { claudeCodeToolUIs } from "../src/components/chat/tool-uis";

describe("Tool UIs", () => {
	describe("Tool UI Configuration", () => {
		it("exports expected number of tool UIs", () => {
			// Should have 6 specific tools + 1 fallback = 7 total
			expect(claudeCodeToolUIs).toHaveLength(7);
		});

		it("all tool UIs are defined", () => {
			for (const toolUI of claudeCodeToolUIs) {
				expect(toolUI).toBeDefined();
				// makeAssistantToolUI returns a React component (function)
				expect(typeof toolUI).toBe("function");
			}
		});
	});

	describe("Tool UI Array Export", () => {
		it("exports as array", () => {
			expect(Array.isArray(claudeCodeToolUIs)).toBe(true);
		});

		it("array is not empty", () => {
			expect(claudeCodeToolUIs.length).toBeGreaterThan(0);
		});

		it("array contains only React components", () => {
			for (const item of claudeCodeToolUIs) {
				expect(typeof item).toBe("function");
			}
		});

		it("array items are unique objects", () => {
			const seenItems = new Set();
			for (const item of claudeCodeToolUIs) {
				expect(seenItems.has(item)).toBe(false);
				seenItems.add(item);
			}
		});
	});

	describe("Tool UI Import", () => {
		it("can import tool UIs without errors", () => {
			// This test verifies that the module can be imported successfully
			expect(() => {
				const toolUIs = claudeCodeToolUIs;
				expect(toolUIs).toBeDefined();
			}).not.toThrow();
		});

		it("tool UIs maintain reference equality", () => {
			const firstImport = claudeCodeToolUIs;
			const secondReference = claudeCodeToolUIs;

			expect(firstImport).toBe(secondReference);
			expect(firstImport.length).toBe(secondReference.length);
		});
	});
});
