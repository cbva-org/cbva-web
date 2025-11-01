// lexical-editor.ts

import { createHeadlessEditor } from "@lexical/headless";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { JSDOM } from "jsdom";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $insertNodes,
  type EditorState,
  type LexicalEditor,
} from "lexical";
import { marked } from "marked";
import { EDITOR_CONFIG_DEFAULTS } from "@/components/base/rich-text-editor/config";
import { db } from "../connection";
import { blocks, type CreateBlock } from "../schema";
import type { LexicalState } from "../schema/shared";

export class LexicalEditorService {
  private editor: LexicalEditor;

  constructor() {
    this.editor = createHeadlessEditor({
      ...EDITOR_CONFIG_DEFAULTS,
      namespace: "MyEditor",
      onError: (error) => console.error("Lexical error:", error),
    });
  }

  // Inject HTML string into the editor
  async injectHTML(htmlString: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.editor.update(() => {
        try {
          // Parse HTML string
          const dom = new JSDOM(htmlString);
          const document = dom.window.document;

          // Clear existing content
          const root = $getRoot();
          root.clear();

          // Generate nodes from DOM and insert them
          const nodes = $generateNodesFromDOM(this.editor, document);
          $insertNodes(nodes);

          // Add an empty paragraph if no content was inserted
          if (nodes.length === 0) {
            const paragraph = $createParagraphNode();
            paragraph.append($createTextNode(""));
            root.append(paragraph);
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  // Get current editor state as JSON
  getEditorStateJSON(): LexicalState {
    const state = this.editor.getEditorState().read(() => {
      return this.editor.getEditorState().toJSON();
    });

    return state as LexicalState;
  }

  // Get current content as HTML
  getEditorHTML(): string {
    let html = "";

    this.editor.getEditorState().read(() => {
      html = $generateHtmlFromNodes(this.editor);
    });

    return html;
  }

  // Update editor with JSON state
  updateEditorFromJSON(stateJSON: string): void {
    const editorState = this.editor.parseEditorState(stateJSON);
    this.editor.setEditorState(editorState);
  }

  // Subscribe to changes
  onUpdate(callback: (editorState: EditorState) => void): () => void {
    return this.editor.registerUpdateListener(({ editorState }) => {
      callback(editorState);
    });
  }
}

const seeds = [
  {
    path: "ratings",
    key: "ratings",
    content: `<a href="/leaderboard" style="text-align: center">Leaderboard</a>

    Earn a rating by winning or placing in rated tournaments. Earning a rating shows you've reached a certain skill level.

    Players can play any division at or above their rating. For example, a AA rated player could play a AA, AAA or Open tournament but not an Unrated, B or A event. A new or Unrated player can join any level.

    An earned rating lasts the rest of that season and through the following season. If not earned again it drops one tier every January 1st. For example, earning a AA in 2024 lasts through all of 2025, dropping to A in 2026, B in 2027 and Unrated after. Points last 365 days and are cumulative.`,
  },
  {
    path: "ratings",
    key: "prize-pool",
    content: `<p style="text-align: center">
Standard Opens have a [prize pool](/prize-money) based on the number of teams, with a total pool of $20 per team. Below 16 teams, 100% goes to 1st place. 16-29 teams splits 70/30 with 1st/2nd. 30+ teams is a 50/30/20 split for 1st/2nd/3rd, where two 3rd place teams may split their share depending whether consolation is played out. AAA tournaments do not have a [prize pool](/prize-money).
</p>`,
  },
  {
    path: "ratings",
    key: "sanction-requirements",
    content:
      "Sanction requires a minimum number of teams and individual players with the appropriate rating. [Sanctioning requirements](/sanctioning).",
  },
  {
    path: "ratings",
    key: "open",
    content: `| Finish | 30+ |	20-29 |	12-19 |
| ------------- | ------------- | ------------- | ------------- |
| 1st |	AAA |	AAA |	AAA |
| 2nd |	AAA |	AAA |	AAA |
| 3rd |	AAA |	AA | AA |
| 5th |	AA |	A |	- |

<p style="text-align: center">Sanction additionally requires 8+ players with AAA rating</p>

<p style="text-align: center">
With 15+ AAA rated players points are increased 20%<br />
With 25+ AAA rated players points are increased 30%
</p>
      `,
  },
  {
    path: "ratings",
    key: "male-aa",
    content: `| Finish |	30+	| 20-29 |	12-19 |
| ------------- | ------------- | ------------- | ------------- |
|1st|AAA|	AAA|	AAA|
|2nd|AA|	AA	|AA|
|3rd|AA|	AA	|A|
|5th|A	|B|	- |

<p style="text-align: center">Sanction additionally requires 8+ players with AA rating</p>
    `,
  },
  {
    path: "ratings",
    key: "female-aa",
    content: `| Finish |	20+	|	12-19 |
| ------------- | ------------- | ------------- |
| 1st |	AAA |	AAA |
| 2nd |	AA |	AA |
| 3rd |	AA | A |
| 5th |	A |	- |

<p style="text-align: center">Sanction additionally requires 8+ players with AA rating</p>
    `,
  },
  {
    path: "ratings",
    key: "male-a",
    content: `| Finish |	12+ |
| ------------- | ------------- |
| 1st |	AA |
| 2nd |	A |
| 3rd |	A |
| 5th |	B |

<p style="text-align: center">Sanction additionally requires 8+ players with A rating</p>
    `,
  },
  {
    path: "ratings",
    key: "female-a",
    content: `| Finish |	12+ | 8-11 |
| ------------- | ------------- | --- |
| 1st |	AA | AA |
| 2nd |	A | A |
| 3rd |	A | A |
| 5th |	B | - |

<p style="text-align: center">Sanction additionally requires 4+ players with A rating</p>
    `,
  },
  {
    path: "ratings",
    key: "male-b",
    content: `| Finish |	30+	| 20-29 |	8-19 |
| ------------- | ------------- | ------------- | ------------- |
| 1st | A |	A |	A |
| 2nd | B | B	| B |
| 3rd | B | B	| - |
| 5th | B | - |	- |

<p style="text-align: center">Sanction additionally requires either 8+ players with B rating or 16+ teams</p>
    `,
  },
  {
    path: "ratings",
    key: "female-b",
    content: `| Finish |	20+	| 13-19 |	4-12 |
| ------------- | ------------- | ------------- | ------------- |
| 1st | A |	A |	A |
| 2nd | B | B	| B |
| 3rd | B | B	| - |
| 5th | B | - |	- |

<p style="text-align: center">Sanction additionally requires either 2+ players with B rating or 8+ teams</p>
    `,
  },
  {
    path: "ratings",
    key: "male-unrated",
    content: `| Finish |	20+	| 8-19 |
| ------------- | ------------- | ------------- |
| 1st | B |	B |
| 2nd | B | -	|
| 3rd | - | -	|
| 5th | - | - |
    `,
  },
  {
    path: "ratings",
    key: "female-unrated",
    content: `| Finish |	4+ |
| ------------- | ------------- |
| 1st |	B |
| 2nd | -	|
| 3rd | -	|
| 5th | - |
`,
  },
];

export async function seedRatingsPage() {
  const editor = new LexicalEditorService();

  const serializedSeeds: CreateBlock[] = [];

  for (const { path, key, content } of seeds) {
    await editor.injectHTML(await Promise.resolve(marked.parse(content)));
    const state = editor.getEditorStateJSON();

    serializedSeeds.push({
      page: path,
      key,
      content: state,
    });
  }

  await db.insert(blocks).values(serializedSeeds);
}
