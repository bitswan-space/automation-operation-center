import { baseKeymap, chainCommands, toggleMark } from "prosemirror-commands";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { splitListItem } from "prosemirror-schema-list";
import { inputRules, wrappingInputRule, textblockTypeInputRule, InputRule } from "prosemirror-inputrules";
import { EditorState, Transaction, Plugin } from "prosemirror-state";
import type { EditorView, NodeView } from "prosemirror-view";
import type { Node } from "prosemirror-model";
import {
  defaultMarkdownParser,
  defaultMarkdownSerializer,
  schema as markdownSchema,
} from "prosemirror-markdown";
import "prosemirror-view/style/prosemirror.css";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ProseMirror,
  ProseMirrorDoc,
  reactKeys,
} from "@handlewithcare/react-prosemirror";
import MQTTService from "@/services/MQTTService";
import EditorMenu from "./EditorMenu";
import ProcessAttachments from "./ProcessAttachments";

interface ProcessEditorProps {
  processId: string;
  workspaceId: string;
  automationServerId: string;
}

// Plugin to ensure there's always a paragraph at the end of the document
const trailingParagraphPlugin = new Plugin({
  appendTransaction(transactions, oldState, newState) {
    const lastChild = newState.doc.lastChild;
    
    // If the last child is not a paragraph, add one
    if (!lastChild || lastChild.type !== markdownSchema.nodes.paragraph) {
      const tr = newState.tr;
      const paragraph = markdownSchema.nodes.paragraph.create();
      tr.insert(newState.doc.content.size, paragraph);
      return tr;
    }
    
    return null;
  },
});

// Plugin to handle MQTT image fetching for attachments
const createAttachmentImagePlugin = (
  processId: string,
  workspaceId: string,
  automationServerId: string
) => {
  return new Plugin({
    props: {
      nodeViews: {
        image(node: Node, view: EditorView, getPos: () => number | undefined): NodeView {
          const dom = document.createElement("img");
          const src = node.attrs.src || "";
          
          // Check if this is an attachment image
          if (src.startsWith("Attachments/")) {
            const fileName = src.replace("Attachments/", "");
            
            // Fetch image from MQTT
            MQTTService.getInstance()
              .getProcessAttachment(processId, fileName, workspaceId, automationServerId)
              .then((blob) => {
                if (blob) {
                  const url = window.URL.createObjectURL(blob);
                  dom.src = url;
                  dom.alt = node.attrs.alt || fileName;
                  
                  // Clean up object URL when image is removed
                  dom.addEventListener("load", () => {
                    // Keep the URL alive while the image is displayed
                  });
                } else {
                  dom.alt = `Failed to load: ${fileName}`;
                  dom.style.border = "1px dashed red";
                }
              })
              .catch((error) => {
                console.error("Failed to load attachment image:", error);
                dom.alt = `Error loading: ${fileName}`;
                dom.style.border = "1px dashed red";
              });
          } else {
            // Regular image URL
            dom.src = src;
            dom.alt = node.attrs.alt || "";
          }
          
          return {
            dom,
            update(node: Node) {
              const newSrc = node.attrs.src || "";
              if (newSrc !== src) {
                // Source changed, update the image
                if (newSrc.startsWith("Attachments/")) {
                  const fileName = newSrc.replace("Attachments/", "");
                  MQTTService.getInstance()
                    .getProcessAttachment(processId, fileName, workspaceId, automationServerId)
                    .then((blob) => {
                      if (blob) {
                        const url = window.URL.createObjectURL(blob);
                        dom.src = url;
                        dom.alt = node.attrs.alt || fileName;
                      }
                    });
                } else {
                  dom.src = newSrc;
                  dom.alt = node.attrs.alt || "";
                }
              }
              return true;
            },
            destroy() {
              // Cleanup if needed
            },
          };
        },
      },
    },
  });
};

// Input rules for markdown shortcuts
const markdownInputRules = inputRules({
  rules: [
    // Horizontal rule: "---" or "***" or "___" followed by space
    new InputRule(/^(---|\*\*\*|___)\s$/, (state, match, start, end) => {
      return state.tr.replaceWith(start, end, state.schema.nodes.horizontal_rule.create());
    }),
    // Heading level 1: "# " at start of line
    textblockTypeInputRule(/^#\s$/, markdownSchema.nodes.heading, { level: 1 }),
    // Heading level 2: "## " at start of line
    textblockTypeInputRule(/^##\s$/, markdownSchema.nodes.heading, { level: 2 }),
    // Heading level 3: "### " at start of line
    textblockTypeInputRule(/^###\s$/, markdownSchema.nodes.heading, { level: 3 }),
    // Heading level 4: "#### " at start of line
    textblockTypeInputRule(/^####\s$/, markdownSchema.nodes.heading, { level: 4 }),
    // Blockquote: "> " at start of line
    wrappingInputRule(/^>\s$/, markdownSchema.nodes.blockquote),
    // Unordered list: "- " at start of line
    wrappingInputRule(/^-\s$/, markdownSchema.nodes.bullet_list),
    // Unordered list: "* " at start of line
    wrappingInputRule(/^\*\s$/, markdownSchema.nodes.bullet_list),
    // Ordered list: "1. " (or any number) at start of line
    wrappingInputRule(/^\d+\.\s$/, markdownSchema.nodes.ordered_list),
    // Code block: "```" at start of line
    textblockTypeInputRule(/^```$/, markdownSchema.nodes.code_block),
  ],
});

// Helper function to create the plugins array for the editor
const createEditorPlugins = (
  processId: string,
  workspaceId: string,
  automationServerId: string
) => [
  reactKeys(),
  history(),
  trailingParagraphPlugin,
  createAttachmentImagePlugin(processId, workspaceId, automationServerId),
  markdownInputRules,
  keymap({
    ...baseKeymap,
    Enter: chainCommands(
      splitListItem(markdownSchema.nodes.list_item),
      baseKeymap.Enter
    ),
    "Mod-i": toggleMark(markdownSchema.marks.em),
    "Mod-b": toggleMark(markdownSchema.marks.strong),
    "Mod-Shift-c": toggleMark(markdownSchema.marks.code),
    "Mod-z": undo,
    "Mod-Shift-z": redo,
    "Mod-y": redo,
  }),
];

export default function ProcessEditor({
  processId,
  workspaceId,
  automationServerId,
}: ProcessEditorProps) {
  const [state, setState] = useState(() =>
    EditorState.create({
      schema: markdownSchema,
      plugins: createEditorPlugins(processId, workspaceId, automationServerId),
    })
  );

  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>("");
  const isInitialLoadRef = useRef(true);

  // Load initial content from MQTT
  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      try {
        const content = await MQTTService.getInstance().getProcessContent(
          processId,
          workspaceId,
          automationServerId
        );

        if (isMounted && content) {
          try {
            const doc = defaultMarkdownParser.parse(content);
            const newState = EditorState.create({
              schema: markdownSchema,
              doc,
              plugins: createEditorPlugins(processId, workspaceId, automationServerId),
            });
            setState(newState);
            lastSavedContentRef.current = content;
          } catch (parseError) {
            console.error("Failed to parse markdown:", parseError);
          }
        }
      } catch (error) {
        console.error("Failed to load process content:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          isInitialLoadRef.current = false;
        }
      }
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, [processId, workspaceId, automationServerId]);

  // Debounced save function
  const debouncedSave = useCallback(
    (content: string) => {
      // Don't save during initial load
      if (isInitialLoadRef.current) {
        return;
      }

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Only save if content has changed
      if (content === lastSavedContentRef.current) {
        return;
      }

      // Set new timeout
      saveTimeoutRef.current = setTimeout(() => {
        try {
          MQTTService.getInstance().setProcessContent(
            processId,
            content,
            workspaceId,
            automationServerId
          );
          lastSavedContentRef.current = content;
        } catch (error) {
          console.error("Failed to save process content:", error);
        }
      }, 1000); // 1 second debounce
    },
    [processId, workspaceId, automationServerId]
  );

  const dispatchTransaction = useCallback(
    (tr: Transaction) => {
      setState((prev) => {
        const newState = prev.apply(tr);

        // Serialize to markdown and save with debounce
        if (tr.docChanged) {
          let markdown = defaultMarkdownSerializer.serialize(newState.doc);
          // Remove trailing empty paragraph (added by trailingParagraphPlugin)
          markdown = markdown.replace(/\n\n$/, '\n');
          debouncedSave(markdown);
        }

        return newState;
      });
    },
    [debouncedSave]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full border rounded-lg bg-card">
        <div className="h-[70vh] flex items-center justify-center">
          <div className="text-muted-foreground">Loading editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border rounded-lg bg-card flex flex-col h-[70vh]">
      <ProseMirror
        className="ProseMirror flex-1 flex flex-col min-h-0"
        state={state}
        dispatchTransaction={dispatchTransaction}
      >
        <EditorMenu processId={processId}/>
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <ProseMirrorDoc spellCheck={false} />
        </div>
      </ProseMirror>
      <ProcessAttachments
        processId={processId}
        workspaceId={workspaceId}
        automationServerId={automationServerId}
      />
    </div>
  );
}
