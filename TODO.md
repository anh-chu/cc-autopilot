# TODO
<!-- pi-todo-md:schema=1 -->

## Conversation system
- [ ] Cross-process file locking (data integrity) <!-- pi-todo-md:id=1 -->
- [ ] Stale refresh dispatch after conversationId change <!-- pi-todo-md:id=2 -->

## Critical Hardening (from deep review 2026-05-11)
- [ ] SSE can miss events during initial connect <!-- pi-todo-md:id=3 -->
- [ ] File watcher can drop events while a read is in progress <!-- pi-todo-md:id=4 -->
- [ ] conversations.json writes are not atomic <!-- pi-todo-md:id=5 -->
- [ ] PATCH accepts arbitrary Partial<Conversation> <!-- pi-todo-md:id=6 -->

## Tests
- [ ] Prune low-value tests (remaining candidates) <!-- pi-todo-md:id=7 -->

## Memory
- [ ] Auto wiki write-back on task completion (memory loop) <!-- pi-todo-md:id=8 -->
  - note: task completes → agent writes summary page to wiki → doc-maintainer consolidates. SOP instruction change in run-task.ts prompt, not a new architecture. Closes the pseudo-memory gap vs hermes-agent.
