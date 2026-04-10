"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import {
  FileText, Upload, Trash2, Loader2, File, AlertCircle,
  Folder, FolderOpen, FolderPlus, ChevronRight, ChevronDown,
  X, Pencil, Check, Image,
} from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface TreeNode {
  name: string;
  path: string;
  type: "dir" | "file";
  size?: number;
  modifiedAt: string;
  children?: TreeNode[];
  expanded?: boolean;
  loading?: boolean;
}

const TEXT_EXTS = new Set(["txt", "md", "markdown", "json", "yaml", "yml", "toml", "csv", "xml", "html", "sh"]);
const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);

function ext(name: string) { return name.split(".").pop()?.toLowerCase() ?? ""; }
function isText(name: string) { return TEXT_EXTS.has(ext(name)); }
function isImage(name: string) { return IMAGE_EXTS.has(ext(name)); }
function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

async function fetchDir(dir: string): Promise<TreeNode[]> {
  const res = await fetch(`/api/wiki?dir=${encodeURIComponent(dir)}`);
  if (!res.ok) return [];
  const data: { entries: Array<{ name: string; type: "dir" | "file"; size?: number; modifiedAt: string }> } = await res.json();
  return data.entries.map((e) => ({
    name: e.name,
    path: dir ? `${dir}/${e.name}` : e.name,
    type: e.type,
    size: e.size,
    modifiedAt: e.modifiedAt,
    expanded: false,
  }));
}

export default function DocumentsPage() {
  const [roots, setRoots] = useState<TreeNode[]>([]);
  const [rootLoaded, setRootLoaded] = useState(false);
  const [rootLoading, setRootLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDirRef = useRef<string>("");

  const [newFolderParent, setNewFolderParent] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderError, setFolderError] = useState<string | null>(null);

  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [deletingIsDir, setDeletingIsDir] = useState(false);

  const [openFile, setOpenFile] = useState<{ path: string; name: string } | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Drag state
  const dragNodeRef = useRef<TreeNode | null>(null);
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);

  // --- Tree helpers ---
  function updateNodes(nodes: TreeNode[], targetPath: string, updater: (n: TreeNode) => TreeNode): TreeNode[] {
    return nodes.map((n) => {
      if (n.path === targetPath) return updater(n);
      if (n.children) return { ...n, children: updateNodes(n.children, targetPath, updater) };
      return n;
    });
  }

  function removeNode(nodes: TreeNode[], targetPath: string): TreeNode[] {
    return nodes
      .filter((n) => n.path !== targetPath)
      .map((n) => (n.children ? { ...n, children: removeNode(n.children, targetPath) } : n));
  }

  // Load root once
  const loadedRef = useRef(false);
  if (!loadedRef.current) {
    loadedRef.current = true;
    (async () => {
      if (rootLoaded || rootLoading) return;
      setRootLoading(true);
      const nodes = await fetchDir("");
      setRoots(nodes);
      setRootLoaded(true);
      setRootLoading(false);
    })();
  }

  async function reloadDir(dir: string) {
    const fresh = await fetchDir(dir);
    if (dir === "") {
      setRoots(fresh);
    } else {
      setRoots((prev) => updateNodes(prev, dir, (n) => ({ ...n, children: fresh, expanded: true })));
    }
  }

  async function toggleFolder(node: TreeNode) {
    if (node.type !== "dir") return;
    if (!node.expanded) {
      if (node.children === undefined) {
        setRoots((prev) => updateNodes(prev, node.path, (n) => ({ ...n, loading: true })));
        const children = await fetchDir(node.path);
        setRoots((prev) => updateNodes(prev, node.path, (n) => ({ ...n, loading: false, children, expanded: true })));
      } else {
        setRoots((prev) => updateNodes(prev, node.path, (n) => ({ ...n, expanded: true })));
      }
    } else {
      setRoots((prev) => updateNodes(prev, node.path, (n) => ({ ...n, expanded: false })));
    }
  }

  async function openViewer(node: TreeNode) {
    setOpenFile({ path: node.path, name: node.name });
    setEditing(false);
    setSaveError(null);
    setFileContent(null);
    if (!isText(node.name)) return;
    setFileLoading(true);
    try {
      const res = await fetch(`/api/wiki/content?path=${encodeURIComponent(node.path)}`);
      if (res.ok) { const d: { content: string } = await res.json(); setFileContent(d.content); }
    } catch { /* ignore */ }
    setFileLoading(false);
  }

  async function handleSave() {
    if (!openFile) return;
    setSaving(true); setSaveError(null);
    const res = await fetch("/api/wiki/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: openFile.path, content: editContent }),
    });
    if (res.ok) { setFileContent(editContent); setEditing(false); }
    else { const e: { error?: string } = await res.json(); setSaveError(e.error ?? "Save failed"); }
    setSaving(false);
  }

  const doUpload = useCallback(async (files: FileList | File[], dir: string) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true); setUploadError(null);
    try {
      for (const file of list) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("dir", dir);
        const res = await fetch("/api/wiki/upload", { method: "POST", body: fd });
        if (!res.ok) { const e: { error?: string } = await res.json(); setUploadError(e.error ?? "Upload failed"); break; }
      }
      await reloadDir(dir);
    } catch { setUploadError("Upload failed."); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function triggerUpload(dir: string) {
    uploadDirRef.current = dir;
    fileInputRef.current?.click();
  }

  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name || newFolderParent === null) return;
    setFolderError(null);
    const rel = newFolderParent ? `${newFolderParent}/${name}` : name;
    const res = await fetch("/api/wiki/folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: rel }),
    });
    if (res.ok) {
      setNewFolderParent(null); setNewFolderName("");
      await reloadDir(newFolderParent);
      if (newFolderParent !== "") {
        setRoots((prev) => updateNodes(prev, newFolderParent, (n) => ({ ...n, expanded: true })));
      }
    } else {
      const e: { error?: string } = await res.json();
      setFolderError(e.error ?? "Failed");
    }
  }

  async function handleDelete() {
    if (!deletingPath) return;
    await fetch("/api/wiki", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: deletingPath }),
    });
    if (openFile?.path === deletingPath || openFile?.path.startsWith(deletingPath + "/")) {
      setOpenFile(null); setFileContent(null);
    }
    setRoots((prev) => removeNode(prev, deletingPath));
    setDeletingPath(null);
  }

  // --- Drag to reorganize ---
  function handleDragStart(e: React.DragEvent, node: TreeNode) {
    dragNodeRef.current = node;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", node.path);
  }

  function handleDragOver(e: React.DragEvent, targetPath: string, targetType: "dir" | "root") {
    e.preventDefault();
    e.stopPropagation();
    const dragging = dragNodeRef.current;
    if (!dragging) return;
    // Can't drop onto itself or a descendant
    if (dragging.path === targetPath || targetPath.startsWith(dragging.path + "/")) return;
    e.dataTransfer.dropEffect = "move";
    setDragOverPath(targetType === "root" ? "" : targetPath);
  }

  async function handleDropOnFolder(e: React.DragEvent, targetDirPath: string) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPath(null);
    const node = dragNodeRef.current;
    dragNodeRef.current = null;
    if (!node) return;
    if (node.path === targetDirPath || targetDirPath.startsWith(node.path + "/")) return;

    const newPath = targetDirPath ? `${targetDirPath}/${node.name}` : node.name;
    if (newPath === node.path) return;

    const res = await fetch("/api/wiki/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: node.path, to: newPath }),
    });
    if (res.ok) {
      // Reload both source parent and target dir
      const sourceParent = node.path.includes("/") ? node.path.split("/").slice(0, -1).join("/") : "";
      await reloadDir(sourceParent);
      if (targetDirPath !== sourceParent) await reloadDir(targetDirPath);
      if (openFile?.path === node.path) setOpenFile({ path: newPath, name: node.name });
    }
  }

  // --- Render tree ---
  function renderNodes(nodes: TreeNode[], depth = 0): React.ReactNode {
    return nodes.map((node) => (
      <div key={node.path}>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
          onDragOver={(e) => node.type === "dir" ? handleDragOver(e, node.path, "dir") : e.preventDefault()}
          onDragLeave={() => setDragOverPath(null)}
          onDrop={(e) => node.type === "dir" ? handleDropOnFolder(e, node.path) : e.preventDefault()}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm cursor-pointer group transition-colors select-none",
            openFile?.path === node.path ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
            dragOverPath === node.path && "ring-2 ring-primary bg-primary/10"
          )}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          onClick={() => { if (node.type === "dir") toggleFolder(node); else openViewer(node); }}
        >
          {node.type === "dir" ? (
            node.loading
              ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
              : node.expanded
              ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <span className="w-3.5 shrink-0" />
          )}

          {node.type === "dir"
            ? node.expanded
              ? <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
              : <Folder className="h-4 w-4 shrink-0 text-amber-500" />
            : isImage(node.name)
            ? <Image className="h-4 w-4 shrink-0 text-green-500" />
            : isText(node.name)
            ? <FileText className="h-4 w-4 shrink-0 text-blue-500" />
            : <File className="h-4 w-4 shrink-0 text-muted-foreground" />}

          <span className="flex-1 truncate">{node.name}</span>

          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            {node.type === "dir" && (
              <>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  title="Upload here" onClick={() => triggerUpload(node.path)}>
                  <Upload className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  title="New subfolder"
                  onClick={() => { setNewFolderParent(node.path); setNewFolderName(""); setFolderError(null); }}>
                  <FolderPlus className="h-3 w-3" />
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              title="Delete"
              onClick={() => { setDeletingPath(node.path); setDeletingIsDir(node.type === "dir"); }}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {newFolderParent === node.path && node.type === "dir" && (
          <div className="flex items-center gap-1.5 px-2 py-1" style={{ paddingLeft: `${(depth + 1) * 14 + 8}px` }}>
            <span className="w-3.5 shrink-0" />
            <Folder className="h-4 w-4 shrink-0 text-amber-400" />
            <input autoFocus className="flex-1 bg-transparent text-sm outline-none border-b border-border min-w-0"
              placeholder="Folder name" value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
                if (e.key === "Escape") { setNewFolderParent(null); setNewFolderName(""); }
              }} />
            {folderError && <span className="text-xs text-destructive">{folderError}</span>}
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCreateFolder}><Check className="h-3 w-3" /></Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setNewFolderParent(null); setNewFolderName(""); }}><X className="h-3 w-3" /></Button>
          </div>
        )}

        {node.type === "dir" && node.expanded && node.children && node.children.length > 0 && renderNodes(node.children, depth + 1)}
        {node.type === "dir" && node.expanded && node.children?.length === 0 && (
          <div className="text-xs text-muted-foreground/50 py-0.5" style={{ paddingLeft: `${(depth + 1) * 14 + 8 + 14 + 6 + 16 + 6}px` }}>Empty</div>
        )}
      </div>
    ));
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 min-h-0">
      {/* Tree panel */}
      <Card className="flex flex-col w-72 shrink-0 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/20 shrink-0">
          <BreadcrumbNav items={[{ label: "Documents" }]} />
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="New root folder"
              onClick={() => { setNewFolderParent(""); setNewFolderName(""); setFolderError(null); }}>
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Upload to root"
              onClick={() => triggerUpload("")} disabled={uploading}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {uploadError && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-destructive bg-destructive/10 shrink-0">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />{uploadError}
          </div>
        )}

        {newFolderParent === "" && (
          <div className="flex items-center gap-1.5 px-2 py-1 border-b shrink-0">
            <Folder className="h-4 w-4 shrink-0 text-amber-400" />
            <input autoFocus className="flex-1 bg-transparent text-sm outline-none border-b border-border min-w-0"
              placeholder="Folder name" value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
                if (e.key === "Escape") { setNewFolderParent(null); setNewFolderName(""); }
              }} />
            {folderError && <span className="text-xs text-destructive">{folderError}</span>}
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCreateFolder}><Check className="h-3 w-3" /></Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setNewFolderParent(null); setNewFolderName(""); }}><X className="h-3 w-3" /></Button>
          </div>
        )}

        <div
          className={cn("flex-1 overflow-auto py-1", dragOverPath === "" && "ring-2 ring-inset ring-primary bg-primary/5")}
          onDragOver={(e) => handleDragOver(e, "", "root")}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverPath(null); }}
          onDrop={(e) => handleDropOnFolder(e, "")}
        >
          {rootLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : roots.length === 0 ? (
            <p className="px-4 py-6 text-xs text-muted-foreground text-center">No files yet. Upload or create a folder.</p>
          ) : renderNodes(roots)}
        </div>
      </Card>

      {/* File viewer / editor */}
      {openFile ? (
        <Card className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {isImage(openFile.name)
                ? <Image className="h-4 w-4 shrink-0 text-green-500" />
                : isText(openFile.name)
                ? <FileText className="h-4 w-4 shrink-0 text-blue-500" />
                : <File className="h-4 w-4 shrink-0 text-muted-foreground" />}
              <span className="text-sm font-medium truncate" title={openFile.path}>{openFile.path}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isText(openFile.name) && !editing && fileContent !== null && (
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                  onClick={() => { setEditing(true); setEditContent(fileContent); setSaveError(null); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                onClick={() => { setOpenFile(null); setFileContent(null); setEditing(false); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 min-h-0">
            {fileLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : isImage(openFile.name) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/wiki/file?path=${encodeURIComponent(openFile.path)}`}
                alt={openFile.name}
                className="max-w-full max-h-full object-contain rounded"
              />
            ) : editing ? (
              <Textarea
                className="min-h-[400px] font-mono text-xs resize-none w-full"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                autoFocus
              />
            ) : fileContent !== null ? (
              ["md", "markdown"].includes(ext(openFile.name)) ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-3 pb-1 border-b">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-semibold mt-5 mb-2 pb-1 border-b">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-base font-semibold mt-3 mb-1">{children}</h4>,
                    p: ({ children }) => <p className="text-sm leading-relaxed mb-3">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-sm">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-sm">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground my-3 text-sm">{children}</blockquote>,
                    code: ({ className, children, ...props }) => {
                      const isBlock = className?.includes("language-");
                      return isBlock
                        ? <code className={`block bg-muted rounded px-3 py-2 text-xs font-mono overflow-x-auto my-3 ${className ?? ""}`} {...props}>{children}</code>
                        : <code className="bg-muted rounded px-1 py-0.5 text-xs font-mono" {...props}>{children}</code>;
                    },
                    pre: ({ children }) => <pre className="my-3 overflow-x-auto">{children}</pre>,
                    a: ({ href, children }) => <a href={href} className="text-primary underline hover:no-underline" target="_blank" rel="noreferrer">{children}</a>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    hr: () => <hr className="my-4 border-border" />,
                    table: ({ children }) => <div className="overflow-x-auto my-3"><table className="w-full text-sm border-collapse">{children}</table></div>,
                    th: ({ children }) => <th className="border border-border px-3 py-1.5 bg-muted font-semibold text-left">{children}</th>,
                    td: ({ children }) => <td className="border border-border px-3 py-1.5">{children}</td>,
                  }}
                >
                  {fileContent}
                </ReactMarkdown>
              ) : (
                <pre className="text-xs font-mono whitespace-pre-wrap break-words leading-relaxed">{fileContent}</pre>
              )
            ) : isText(openFile.name) ? (
              <p className="text-sm text-muted-foreground">Could not load file.</p>
            ) : (
              <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
            )}
          </div>

          {editing && (
            <div className="border-t px-4 py-2 flex items-center justify-end gap-2 bg-muted/10 shrink-0">
              {saveError && <span className="text-xs text-destructive mr-auto">{saveError}</span>}
              <Button size="sm" variant="ghost" className="h-7" onClick={() => { setEditing(false); setSaveError(null); }}>Cancel</Button>
              <Button size="sm" className="h-7 gap-1" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-3 w-3 animate-spin" />}Save
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <Card className="flex-1 flex items-center justify-center text-muted-foreground text-sm border-dashed">
          Select a file to view
        </Card>
      )}

      <input ref={fileInputRef} type="file" multiple className="hidden"
        accept=".pdf,.txt,.md,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.svg"
        onChange={(e) => { if (e.target.files) doUpload(e.target.files, uploadDirRef.current); }} />

      <ConfirmDialog
        open={!!deletingPath}
        onOpenChange={(open) => { if (!open) setDeletingPath(null); }}
        title={deletingIsDir ? "Delete folder?" : "Delete file?"}
        description={deletingIsDir
          ? `"${deletingPath?.split("/").pop()}" and all its contents will be permanently deleted.`
          : `"${deletingPath?.split("/").pop()}" will be permanently removed.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
