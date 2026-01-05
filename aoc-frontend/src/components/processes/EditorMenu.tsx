import { setBlockType, toggleMark, wrapIn } from "prosemirror-commands";
import { wrapInList } from "prosemirror-schema-list";
import { redo, undo } from "prosemirror-history";
import type { MarkType, NodeType } from "prosemirror-model";
import type { EditorState } from "prosemirror-state";
import {
  Bold,
  Italic,
  Code,
  Code2,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
} from "lucide-react";
import { useEditorEventCallback, useEditorState } from "@handlewithcare/react-prosemirror";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState, forwardRef } from "react";

// Check if a mark is active at the current selection
function isMarkActive(mark: MarkType, state: EditorState): boolean {
  const { from, $from, to, empty } = state.selection;
  return empty
    ? !!mark.isInSet(state.storedMarks || $from.marks())
    : state.doc.rangeHasMark(from, to, mark);
}

// Check if undo is available
function canUndo(state: EditorState): boolean {
  return undo(state);
}

// Check if redo is available
function canRedo(state: EditorState): boolean {
  return redo(state);
}

// Check if a block type is active
function isBlockActive(nodeType: NodeType, attrs?: Record<string, any>): (state: EditorState) => boolean {
  return (state: EditorState) => {
    const { $from } = state.selection;
    return $from.parent.hasMarkup(nodeType, attrs);
  };
}

// Check if current block is wrapped in a specific node type
function isWrapped(nodeType: NodeType): (state: EditorState) => boolean {
  return (state: EditorState) => {
    const { $from } = state.selection;
    let depth = $from.depth;
    while (depth > 0) {
      const node = $from.node(depth);
      if (node.type === nodeType) {
        return true;
      }
      depth--;
    }
    return false;
  };
}

interface MenuButtonProps {
  isActive?: boolean;
  isDisabled?: boolean;
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

const MenuButton = forwardRef<HTMLButtonElement, MenuButtonProps>(
  (
    {
      isActive = false,
      isDisabled = false,
      title,
      onClick,
      children,
      className,
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        type="button"
        variant="ghost"
        size="sm"
        title={title}
        disabled={isDisabled}
        onClick={onClick}
        className={cn(
          "h-8 w-8 p-0",
          isActive && "bg-secondary text-secondary-foreground font-semibold",
          className
        )}
      >
        {children}
        <span className="sr-only">{title}</span>
      </Button>
    );
  }
);
MenuButton.displayName = "MenuButton";

export default function EditorMenu() {
  const state = useEditorState();

  const toggleBold = useEditorEventCallback((view) => {
    const toggleBoldMark = toggleMark(view.state.schema.marks["strong"]);
    toggleBoldMark(view.state, view.dispatch, view);
    view.focus();
  });

  const toggleItalic = useEditorEventCallback((view) => {
    const toggleItalicMark = toggleMark(view.state.schema.marks["em"]);
    toggleItalicMark(view.state, view.dispatch, view);
    view.focus();
  });

  const toggleCode = useEditorEventCallback((view) => {
    const toggleCodeMark = toggleMark(view.state.schema.marks["code"]);
    toggleCodeMark(view.state, view.dispatch, view);
    view.focus();
  });

  const handleUndo = useEditorEventCallback((view) => {
    undo(view.state, view.dispatch, view);
    view.focus();
  });

  const handleRedo = useEditorEventCallback((view) => {
    redo(view.state, view.dispatch, view);
    view.focus();
  });

  const setHeading1 = useEditorEventCallback((view) => {
    const setHeading = setBlockType(view.state.schema.nodes.heading, { level: 1 });
    setHeading(view.state, view.dispatch, view);
    view.focus();
  });

  const setHeading2 = useEditorEventCallback((view) => {
    const setHeading = setBlockType(view.state.schema.nodes.heading, { level: 2 });
    setHeading(view.state, view.dispatch, view);
    view.focus();
  });

  const setHeading3 = useEditorEventCallback((view) => {
    const setHeading = setBlockType(view.state.schema.nodes.heading, { level: 3 });
    setHeading(view.state, view.dispatch, view);
    view.focus();
  });

  const setHeading4 = useEditorEventCallback((view) => {
    const setHeading = setBlockType(view.state.schema.nodes.heading, { level: 4 });
    setHeading(view.state, view.dispatch, view);
    view.focus();
  });

  const setParagraph = useEditorEventCallback((view) => {
    const setPara = setBlockType(view.state.schema.nodes.paragraph);
    setPara(view.state, view.dispatch, view);
    view.focus();
  });

  const toggleBulletList = useEditorEventCallback((view) => {
    const wrapList = wrapInList(view.state.schema.nodes.bullet_list);
    wrapList(view.state, view.dispatch, view);
    view.focus();
  });

  const toggleOrderedList = useEditorEventCallback((view) => {
    const wrapList = wrapInList(view.state.schema.nodes.ordered_list);
    wrapList(view.state, view.dispatch, view);
    view.focus();
  });

  const toggleBlockquote = useEditorEventCallback((view) => {
    const wrapQuote = wrapIn(view.state.schema.nodes.blockquote);
    wrapQuote(view.state, view.dispatch, view);
    view.focus();
  });

  const setCodeBlock = useEditorEventCallback((view) => {
    const setCode = setBlockType(view.state.schema.nodes.code_block);
    setCode(view.state, view.dispatch, view);
    view.focus();
  });

  // Link popover state
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const handleLinkPopoverOpenChange = (open: boolean) => {
    // Prevent opening popover if no text is selected
    if (open && state && state.selection.empty) {
      return;
    }
    if (open && state) {
      // Get current link URL from selection when opening
      const { $from, empty } = state.selection;
      const linkMark = state.schema.marks.link;
      let currentUrl = "";
      if (linkMark) {
        // For empty selection, check stored marks or marks at cursor
        if (empty) {
          const mark = linkMark.isInSet(state.storedMarks || $from.marks());
          if (mark) {
            // Check both href and url attributes (different schemas use different names)
            currentUrl = mark.attrs.href || mark.attrs.url || "";
          }
        } else {
          // For range selection, iterate through nodes to find the link mark
          const { from, to } = state.selection;
          const { doc } = state;
          let foundMark = null;
          
          doc.nodesBetween(from, to, (node, pos) => {
            if (node.isText && node.marks.length > 0) {
              const link = node.marks.find((mark) => mark.type === linkMark);
              if (link) {
                foundMark = link;
                return false; // Stop iteration once found
              }
            }
            return true;
          });
          
          if (foundMark) {
            // Check both href and url attributes (different schemas use different names)
            currentUrl = foundMark.attrs.href || foundMark.attrs.url || "";
          } else {
            // Fallback: check marks at selection boundaries
            const markAtFrom = linkMark.isInSet($from.marks());
            if (markAtFrom) {
              currentUrl = markAtFrom.attrs.href || markAtFrom.attrs.url || "";
            } else {
              const markAtTo = linkMark.isInSet(state.selection.$to.marks());
              if (markAtTo) {
                currentUrl = markAtTo.attrs.href || markAtTo.attrs.url || "";
              }
            }
          }
        }
      }
      setLinkUrl(currentUrl);
    }
    setLinkPopoverOpen(open);
  };

  const handleLinkSubmit = useEditorEventCallback((view) => {
    const { from, to } = view.state.selection;
    const linkMark = view.state.schema.marks.link;
    
    if (!linkMark) return;

    if (linkUrl.trim()) {
      // Add or update link
      const tr = view.state.tr.addMark(from, to, linkMark.create({ href: linkUrl.trim() }));
      view.dispatch(tr);
    } else {
      // Remove link if URL is empty
      const tr = view.state.tr.removeMark(from, to, linkMark);
      view.dispatch(tr);
    }
    
    setLinkPopoverOpen(false);
    view.focus();
  });

  const handleLinkRemove = useEditorEventCallback((view) => {
    const { from, to } = view.state.selection;
    const linkMark = view.state.schema.marks.link;
    
    if (linkMark) {
      const tr = view.state.tr.removeMark(from, to, linkMark);
      view.dispatch(tr);
    }
    
    setLinkPopoverOpen(false);
    setLinkUrl("");
    view.focus();
  });

  // Image popover state
  const [imagePopoverOpen, setImagePopoverOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const handleImagePopoverOpenChange = (open: boolean) => {
    if (open && state) {
      // Check if we're selecting an image node
      const { $from } = state.selection;
      const imageNode = state.schema.nodes.image;
      let currentUrl = "";
      
      // Check if the node before or after cursor is an image
      const nodeBefore = $from.nodeBefore;
      const nodeAfter = $from.nodeAfter;
      
      if (nodeBefore && nodeBefore.type === imageNode) {
        currentUrl = nodeBefore.attrs.src || "";
      } else if (nodeAfter && nodeAfter.type === imageNode) {
        currentUrl = nodeAfter.attrs.src || "";
      } else {
        // Check parent nodes at different depths
        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);
          if (node.type === imageNode) {
            currentUrl = node.attrs.src || "";
            break;
          }
        }
      }
      
      setImageUrl(currentUrl);
    } else {
      setImageUrl("");
    }
    setImagePopoverOpen(open);
  };

  const handleImageSubmit = useEditorEventCallback((view) => {
    const { $from } = view.state.selection;
    const imageNode = view.state.schema.nodes.image;
    
    if (!imageNode || !imageUrl.trim()) {
      setImagePopoverOpen(false);
      return;
    }

    // Create image node
    const image = imageNode.create({ src: imageUrl.trim() });
    
    // Check if we're replacing an existing image
    const nodeBefore = $from.nodeBefore;
    const nodeAfter = $from.nodeAfter;
    
    if (nodeBefore && nodeBefore.type === imageNode) {
      // Replace the image before cursor
      const pos = $from.pos - $from.parentOffset;
      const tr = view.state.tr.replaceWith(pos - nodeBefore.nodeSize, pos, image);
      view.dispatch(tr);
    } else if (nodeAfter && nodeAfter.type === imageNode) {
      // Replace the image after cursor
      const pos = $from.pos - $from.parentOffset + nodeAfter.nodeSize;
      const tr = view.state.tr.replaceWith($from.pos - $from.parentOffset, pos, image);
      view.dispatch(tr);
    } else {
      // Insert new image as a new block after the current block
      const pos = $from.after($from.depth);
      const tr = view.state.tr.insert(pos, image);
      view.dispatch(tr);
    }
    
    setImagePopoverOpen(false);
    setImageUrl("");
    view.focus();
  });

  if (!state) {
    return null;
  }

  const schema = state.schema;
  const isHeading1 = isBlockActive(schema.nodes.heading, { level: 1 })(state);
  const isHeading2 = isBlockActive(schema.nodes.heading, { level: 2 })(state);
  const isHeading3 = isBlockActive(schema.nodes.heading, { level: 3 })(state);
  const isHeading4 = isBlockActive(schema.nodes.heading, { level: 4 })(state);
  const isParagraph = isBlockActive(schema.nodes.paragraph)(state);
  const isCodeBlock = isBlockActive(schema.nodes.code_block)(state);
  const isBulletList = isWrapped(schema.nodes.bullet_list)(state);
  const isOrderedList = isWrapped(schema.nodes.ordered_list)(state);
  const isBlockquote = isWrapped(schema.nodes.blockquote)(state);
  const isLink = schema.marks.link && isMarkActive(schema.marks.link, state);
  
  // Check if text is selected (selection is not empty)
  const hasTextSelection = !state.selection.empty;
  
  // Check if cursor is at an image node
  const isImage = schema.nodes.image && (() => {
    const { $from } = state.selection;
    const nodeBefore = $from.nodeBefore;
    const nodeAfter = $from.nodeAfter;
    
    // Check adjacent nodes
    if ((nodeBefore && nodeBefore.type === schema.nodes.image) ||
        (nodeAfter && nodeAfter.type === schema.nodes.image)) {
      return true;
    }
    
    // Check parent nodes at different depths
    for (let depth = $from.depth; depth > 0; depth--) {
      if ($from.node(depth).type === schema.nodes.image) {
        return true;
      }
    }
    
    return false;
  })();

  return (
    <div className="flex items-center gap-1 border-b p-2 bg-muted/50 flex-wrap">
      {/* Text Formatting */}
      <MenuButton
        title="Bold (Ctrl+B)"
        isActive={isMarkActive(state.schema.marks["strong"], state)}
        onClick={toggleBold}
      >
        <Bold className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        title="Italic (Ctrl+I)"
        isActive={isMarkActive(state.schema.marks["em"], state)}
        onClick={toggleItalic}
      >
        <Italic className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        title="Code (Ctrl+Shift+C)"
        isActive={isMarkActive(state.schema.marks["code"], state)}
        onClick={toggleCode}
      >
        <Code className="h-4 w-4" />
      </MenuButton>
      <Popover open={linkPopoverOpen} onOpenChange={handleLinkPopoverOpenChange}>
        <PopoverTrigger asChild>
          <MenuButton
            title="Link"
            isActive={isLink}
            isDisabled={!hasTextSelection}
          >
            <Link className="h-4 w-4" />
          </MenuButton>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="link-url" className="text-sm font-medium">
                URL
              </label>
              <p className="text-xs text-muted-foreground">Edit link for selected text</p>
              <Input
                id="link-url"
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleLinkSubmit();
                  }
                  if (e.key === "Escape") {
                    setLinkPopoverOpen(false);
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              {isLink && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLinkRemove}
                >
                  Remove
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={handleLinkSubmit}
              >
                {isLink ? "Update" : "Add"} Link
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Popover open={imagePopoverOpen} onOpenChange={handleImagePopoverOpenChange}>
        <PopoverTrigger asChild>
          <MenuButton
            title="Image"
            isActive={isImage}
          >
            <Image className="h-4 w-4" />
          </MenuButton>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="image-url" className="text-sm font-medium">
                Image URL
              </label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleImageSubmit();
                  }
                  if (e.key === "Escape") {
                    setImagePopoverOpen(false);
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleImageSubmit}
                disabled={!imageUrl.trim()}
              >
                {isImage ? "Update" : "Insert"} Image
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <div className="mx-2 h-6 w-px bg-border" />
      {/* Headings */}
      <MenuButton
        title="Heading 1"
        isActive={isHeading1}
        onClick={setHeading1}
      >
        <Heading1 className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        title="Heading 2"
        isActive={isHeading2}
        onClick={setHeading2}
      >
        <Heading2 className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        title="Heading 3"
        isActive={isHeading3}
        onClick={setHeading3}
      >
        <Heading3 className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        title="Heading 4"
        isActive={isHeading4}
        onClick={setHeading4}
      >
        <Heading4 className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        title="Paragraph"
        isActive={isParagraph}
        onClick={setParagraph}
      >
        <span className="text-xs font-medium">P</span>
      </MenuButton>
      <MenuButton
        title="Code Block"
        isActive={isCodeBlock}
        onClick={setCodeBlock}
      >
        <Code2 className="h-4 w-4" />
      </MenuButton>
      <div className="mx-2 h-6 w-px bg-border" />
      {/* Lists */}
      <MenuButton
        title="Bullet List"
        isActive={isBulletList}
        onClick={toggleBulletList}
      >
        <List className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        title="Ordered List"
        isActive={isOrderedList}
        onClick={toggleOrderedList}
      >
        <ListOrdered className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        title="Blockquote"
        isActive={isBlockquote}
        onClick={toggleBlockquote}
      >
        <Quote className="h-4 w-4" />
      </MenuButton>
      <div className="mx-2 h-6 w-px bg-border" />
      {/* History */}
      <MenuButton
        title="Undo (Ctrl+Z)"
        isDisabled={!canUndo(state)}
        onClick={handleUndo}
      >
        <Undo className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        title="Redo (Ctrl+Shift+Z)"
        isDisabled={!canRedo(state)}
        onClick={handleRedo}
      >
        <Redo className="h-4 w-4" />
      </MenuButton>
    </div>
  );
}

