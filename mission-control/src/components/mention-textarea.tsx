"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { AgentDefinition } from "@/lib/types";
import { getAgentIcon } from "@/lib/agent-icons";
import { cn } from "@/lib/utils";

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  agents: AgentDefinition[];
  placeholder?: string;
  className?: string;
  onSubmit?: () => void;
}

export function MentionTextarea({
  value,
  onChange,
  agents,
  placeholder = "Add a comment... Use @ to mention an agent",
  className,
  onSubmit,
}: MentionTextareaProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeAgents = agents.filter((a) => a.status === "active" && a.id !== "me");

  const filteredAgents = mentionQuery
    ? activeAgents.filter(
        (a) =>
          a.id.includes(mentionQuery.toLowerCase()) ||
          a.name.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : activeAgents;

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPos = e.target.selectionStart ?? 0;
      onChange(newValue);

      // Check if we're in an @-mention context
      const textBeforeCursor = newValue.slice(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex >= 0) {
        const charBefore = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " ";
        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
        // Only trigger if @ is at start or after whitespace, and no space after @
        if ((charBefore === " " || charBefore === "\n" || lastAtIndex === 0) && !/\s/.test(textAfterAt)) {
          setMentionQuery(textAfterAt);
          setMentionStart(lastAtIndex);
          setShowDropdown(true);
          setSelectedIndex(0);
          return;
        }
      }

      setShowDropdown(false);
    },
    [onChange]
  );

  const insertMention = useCallback(
    (agentId: string) => {
      if (mentionStart < 0) return;
      const before = value.slice(0, mentionStart);
      const cursorPos = textareaRef.current?.selectionStart ?? value.length;
      const after = value.slice(cursorPos);
      const newValue = `${before}@${agentId} ${after}`;
      onChange(newValue);
      setShowDropdown(false);
      setMentionStart(-1);

      // Refocus textarea
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const newCursorPos = before.length + agentId.length + 2; // +2 for @ and space
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    },
    [value, mentionStart, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (showDropdown && filteredAgents.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredAgents.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredAgents.length) % filteredAgents.length);
          return;
        }
        if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          insertMention(filteredAgents[selectedIndex].id);
          return;
        }
        if (e.key === "Tab") {
          e.preventDefault();
          insertMention(filteredAgents[selectedIndex].id);
          return;
        }
        if (e.key === "Escape") {
          setShowDropdown(false);
          return;
        }
      }

      // Cmd/Ctrl+Enter to submit
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && onSubmit) {
        e.preventDefault();
        onSubmit();
      }
    },
    [showDropdown, filteredAgents, selectedIndex, insertMention, onSubmit]
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn("min-h-[60px] text-xs resize-none", className)}
      />

      {/* @-mention autocomplete dropdown */}
      {showDropdown && filteredAgents.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 mb-1 w-56 max-h-48 overflow-y-auto rounded-lg border bg-popover shadow-lg z-50"
        >
          {filteredAgents.map((agent, idx) => {
            const Icon = getAgentIcon(agent.id, agent.icon);
            return (
              <button
                key={agent.id}
                type="button"
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs hover:bg-accent transition-colors",
                  idx === selectedIndex && "bg-accent"
                )}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur
                  insertMention(agent.id);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{agent.name}</span>
                  <span className="text-muted-foreground ml-1">@{agent.id}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Render comment text with highlighted @-mentions.
 */
export function CommentContent({ content }: { content: string }) {
  const parts = content.split(/(@[a-z0-9-]+)/g);
  return (
    <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
      {parts.map((part, i) =>
        /^@[a-z0-9-]+$/.test(part) ? (
          <span key={i} className="text-blue-400 font-medium">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}
