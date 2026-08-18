/**
 * Unit cases for `createReasoningStripper()` — the control that keeps model chain-of-thought out
 * of visitor-facing responses (see src/lib/llm.ts for why that's a security concern, not cosmetics).
 *
 * The model-side behaviour it defends against is sampling-dependent, so it cannot be verified by
 * poking the live chatbot: a clean run proves nothing. These cases pin the filter itself instead,
 * with the chunk-boundary splits that a streaming filter actually gets wrong.
 *
 * Run: npm test
 */
import { createReasoningStripper } from "../src/lib/llm.ts";

const run = (chunks: string[]) => {
  const s = createReasoningStripper();
  return chunks.map((c) => s.push(c)).join("") + s.flush();
};

const cases: [string, string[], string][] = [
  ["clean text untouched", ["Hello ", "world"], "Hello world"],
  ["whole block in one chunk", ["<think>secret rules</think>Answer."], "Answer."],
  ["block then text, split", ["<think>lea", "king rules</thi", "nk>Real answer"], "Real answer"],
  ["open tag split across chunks", ["<thi", "nk>hidden</think>Visible"], "Visible"],
  ["close tag split across chunks", ["<think>hidden</thin", "k>Visible"], "Visible"],
  ["text before and after", ["Pre <think>mid</think> Post"], "Pre  Post"],
  ["two blocks", ["<think>a</think>X<think>b</think>Y"], "XY"],
  ["unterminated block dropped", ["Visible <think>never closed..."], "Visible "],
  ["<thinking> variant", ["<thinking>x</thinking>Done"], "Done"],
  ["one char at a time", "<think>zap</think>OK".split(""), "OK"],
  ["lone angle bracket kept", ["a < b and c > d"], "a < b and c > d"],
  ["partial tag never completed is literal text", ["tail <thi"], "tail <thi"],
];

let failed = 0;
for (const [name, chunks, want] of cases) {
  const got = run(chunks);
  if (got === want) {
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}\n        want ${JSON.stringify(want)}\n        got  ${JSON.stringify(got)}`);
  }
}
console.log(failed === 0 ? `\n  ${cases.length} passed` : `\n  ${failed} of ${cases.length} FAILED`);
process.exit(failed ? 1 : 0);
