const fs = require("fs");
const crypto = require("crypto");

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function runRegressionHarness() {
  const jsonPath = "d:\\English\\grading-regression-cases.json";
  if (!fs.existsSync(jsonPath)) {
    console.error(`FATAL: Fixture file not found at ${jsonPath}`);
    process.exit(1);
  }

  const casesData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  
  // Parse command-line args for specific test IDs (e.g. node run_tests.js 1,2,3)
  let targetIds = [1, 2, 3];
  if (process.argv[2]) {
    targetIds = process.argv[2].split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
  }

  const port = process.env.PORT || 3000;

  console.log(`==================================================`);
  console.log(`REGRESSION HARNESS (Target Tests: ${targetIds.join(", ")}) on port ${port}`);
  console.log(`==================================================`);

  const results = [];

  for (const tc of casesData) {
    if (!targetIds.includes(tc.test_id)) {
      continue;
    }

    const actualCount = countWords(tc.essay_text);
    if (actualCount !== tc.expected_word_count) {
      console.error(`\nFAIL: Test ${tc.test_id} word count mismatch!`);
      console.error(`Expected: ${tc.expected_word_count}, Actual: ${actualCount}`);
      console.error(`ABORTING GRADED CALL FOR TEST ${tc.test_id}`);
      process.exit(1);
    }

    const taskHash = sha256(tc.task);
    const essayHash = sha256(tc.essay_text);

    const payload = {
      task: tc.task,
      essay_text: tc.essay_text,
      ...(tc.min_words !== undefined ? { min_words: tc.min_words } : {}),
      ...(tc.max_words !== undefined ? { max_words: tc.max_words } : {})
    };

    console.log(`\n--------------------------------------------------`);
    console.log(`[TEST ${tc.test_id}] ${tc.name}`);
    console.log(`Task SHA-256 : ${taskHash}`);
    console.log(`Essay SHA-256: ${essayHash}`);
    console.log(`Word Count   : ${actualCount} (Verified OK)`);

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`HTTP ERROR ${response.status}:`, data);
        process.exit(1);
      }

      const rec = {
        test_id: tc.test_id,
        task_hash: taskHash,
        essay_hash: essayHash,
        word_count: actualCount,
        task_fulfillment: data.task_fulfillment.score,
        organization: data.organization.score,
        vocabulary: data.vocabulary.score,
        grammar: data.grammar.score,
        total: data.total,
        consistency: data.assessment_consistency,
        review_required: data.review_required,
        review_reasons: data.review_reasons,
        prompt_version: data.metadata ? data.metadata.prompt_version : undefined,
        model: data.metadata ? data.metadata.model : undefined
      };

      results.push(rec);

      console.log(`TF Score     : ${rec.task_fulfillment} / 2.5`);
      console.log(`ORG Score    : ${rec.organization} / 2.5`);
      console.log(`VOC Score    : ${rec.vocabulary} / 2.5`);
      console.log(`GRAM Score   : ${rec.grammar} / 2.5`);
      console.log(`TOTAL        : ${rec.total} / 10 (${data.level})`);
      console.log(`Consistency  : ${rec.consistency}`);
      console.log(`Review Req   : ${rec.review_required}`);
      console.log(`Prompt Ver   : ${rec.prompt_version}`);
      console.log(`Model        : ${rec.model}`);

    } catch (err) {
      console.error(`API Fetch Error on Test ${tc.test_id}:`, err);
      process.exit(1);
    }
  }

  console.log(`\n==================================================`);
  console.log(`RECORDED HARNESS JSON SUMMARY:`);
  console.log(`==================================================`);
  console.log(JSON.stringify(results, null, 2));
}

runRegressionHarness();
