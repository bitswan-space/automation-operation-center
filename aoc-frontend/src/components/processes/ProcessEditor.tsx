import { baseKeymap, chainCommands, toggleMark } from "prosemirror-commands";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { splitListItem } from "prosemirror-schema-list";
import { inputRules, wrappingInputRule, textblockTypeInputRule, InputRule } from "prosemirror-inputrules";
import { EditorState, Transaction, Plugin } from "prosemirror-state";
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

// Input rules for markdown shortcuts
const markdownInputRules = inputRules({
  rules: [
    // Horizontal rule: "---" or "***" or "___" followed by space
    new InputRule(/^(---|\*\*\*|___)\s$/, (state, match, start, end) => {
      const { schema } = state;
      const horizontalRule = schema.nodes.horizontal_rule;
      if (horizontalRule) {
        return state.tr.replaceWith(start, end, horizontalRule.create());
      }
      return null;
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
    new InputRule(/^(\d+)\.\s$/, (state, match, start, end) => {
      const { schema } = state;
      const orderedList = schema.nodes.ordered_list;
      const listItem = schema.nodes.list_item;
      if (orderedList && listItem) {
        const tr = state.tr.delete(start, end);
        const list = orderedList.create({}, listItem.create());
        return tr.replaceSelectionWith(list);
      }
      return null;
    }),
    // Code block: "```" at start of line
    textblockTypeInputRule(/^```$/, markdownSchema.nodes.code_block),
  ],
});

// Helper function to create the plugins array for the editor
const createEditorPlugins = () => [
  reactKeys(),
  history(),
  trailingParagraphPlugin,
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
      plugins: createEditorPlugins(),
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
              plugins: createEditorPlugins(),
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
        <EditorMenu />
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
