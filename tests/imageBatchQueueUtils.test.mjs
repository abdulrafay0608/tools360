import test from "node:test";
import assert from "node:assert/strict";
import {
  addBatchItems,
  clearBatchItems,
  isBatchActive,
  markBatchItemsCancelled,
  removeBatchItem,
  removeBatchItemAt,
  selectEligibleFiles,
  updateBatchItemStatus,
} from "../src/hooks/imageBatchQueueUtils.js";

const acceptedByName = (file) => /\.(jpg|png)$/i.test(file.name);

test("queue selection applies file-type, file-size, and remaining-count limits", () => {
  const files = [
    { name: "one.jpg", size: 2 },
    { name: "large.jpg", size: 11 },
    { name: "bad.txt", size: 1 },
    { name: "two.png", size: 3 },
    { name: "three.jpg", size: 4 },
  ];
  const selected = selectEligibleFiles(files, 1, 3, 10, acceptedByName);
  assert.deepEqual(selected.validFiles.map((file) => file.name), ["one.jpg", "two.png"]);
  assert.deepEqual(selected.unsupported.map((file) => file.name), ["bad.txt"]);
  assert.deepEqual(selected.oversized.map((file) => file.name), ["large.jpg"]);
  assert.equal(selected.skippedByLimit, 1);
  assert.deepEqual(
    selectEligibleFiles([{ name: "large.txt", size: 11 }], 0, 3, 10, acceptedByName).oversized,
    [{ name: "large.txt", size: 11 }]
  );
});

test("queue add, remove, and clear operations preserve order and identity", () => {
  const first = { id: "a" };
  const second = { id: "b" };
  const items = addBatchItems([first], [second]);
  assert.deepEqual(items, [first, second]);
  assert.deepEqual(removeBatchItem(items, "a"), [second]);
  assert.deepEqual(removeBatchItemAt(items, 1), [first]);
  assert.deepEqual(clearBatchItems(), []);
});

test("queue status transitions update only the matching item", () => {
  const items = [{ id: "a", status: "pending" }, { id: "b", status: "done" }];
  assert.deepEqual(updateBatchItemStatus(items, "a", "processing"), [
    { id: "a", status: "processing" },
    { id: "b", status: "done" },
  ]);
});

test("cancelling a batch changes active statuses while preserving completed items", () => {
  const items = [
    { id: "a", status: "processing" },
    { id: "b", status: "pending" },
    { id: "c", status: "done" },
  ];
  assert.deepEqual(
    markBatchItemsCancelled(items, ["pending", "processing"], "cancelled"),
    [
      { id: "a", status: "cancelled" },
      { id: "b", status: "cancelled" },
      { id: "c", status: "done" },
    ]
  );
  assert.equal(isBatchActive(4, 4), true);
  assert.equal(isBatchActive(5, 4), false);
});

test("object URL tracker creates, revokes once, and revokes remaining URLs", async () => {
  const { createObjectUrlTracker } = await import("../src/hooks/trackedObjectUrlUtils.js");
  const revoked = [];
  let nextId = 0;
  const tracker = createObjectUrlTracker({
    createObjectURL: () => `blob:test-${++nextId}`,
    revokeObjectURL: (url) => revoked.push(url),
  });
  const first = tracker.create({});
  const second = tracker.create({});
  tracker.revoke(first);
  tracker.revoke(first);
  tracker.revokeAll();
  assert.deepEqual(revoked, [first, second]);
});
