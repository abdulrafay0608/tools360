import test from "node:test";
import assert from "node:assert/strict";
import {
  createPdfThumbnailLifecycle,
  createThumbnailGenerationGuard,
} from "../src/hooks/pdfThumbnailLifecycle.js";

test("destroys loading tasks only when lifecycle cleanup runs", async () => {
  const lifecycle = createPdfThumbnailLifecycle();
  const loadingTask = { destroyCalls: 0, destroy() { this.destroyCalls += 1; } };

  lifecycle.addLoadingTask(loadingTask);
  assert.equal(loadingTask.destroyCalls, 0);
  await lifecycle.cleanup();
  assert.equal(loadingTask.destroyCalls, 1);
  await lifecycle.cleanup();
  assert.equal(loadingTask.destroyCalls, 1);
});

test("cancels obsolete renders and destroys documents during cleanup", async () => {
  const lifecycle = createPdfThumbnailLifecycle();
  const renderTask = { cancelCalls: 0, cancel() { this.cancelCalls += 1; } };
  const documentProxy = {
    cleanupCalls: 0,
    destroyCalls: 0,
    async cleanup() { this.cleanupCalls += 1; },
    async destroy() { this.destroyCalls += 1; },
  };

  lifecycle.addRenderTask(renderTask);
  lifecycle.addDocument(documentProxy);
  assert.equal(renderTask.cancelCalls, 0);
  assert.equal(documentProxy.destroyCalls, 0);
  await lifecycle.cleanup();
  assert.equal(renderTask.cancelCalls, 1);
  assert.equal(documentProxy.cleanupCalls, 1);
  assert.equal(documentProxy.destroyCalls, 1);
});

test("released resources are not destroyed again", async () => {
  const lifecycle = createPdfThumbnailLifecycle();
  const renderTask = { cancelCalls: 0, cancel() { this.cancelCalls += 1; } };
  const documentProxy = { cleanupCalls: 0, destroyCalls: 0, cleanup() { this.cleanupCalls += 1; }, destroy() { this.destroyCalls += 1; } };

  lifecycle.addRenderTask(renderTask);
  lifecycle.addDocument(documentProxy);
  lifecycle.removeRenderTask(renderTask);
  await lifecycle.destroyDocument(documentProxy);
  await lifecycle.cleanup();
  assert.equal(renderTask.cancelCalls, 0);
  assert.equal(documentProxy.cleanupCalls, 1);
  assert.equal(documentProxy.destroyCalls, 1);
});

test("generation guard rejects stale updates after replacement or unmount", () => {
  const guard = createThumbnailGenerationGuard();
  const first = guard.next();
  assert.equal(guard.isCurrent(first), true);
  const second = guard.next();
  assert.equal(guard.isCurrent(first), false);
  assert.equal(guard.isCurrent(second), true);
  assert.equal(guard.isCurrent(second, false), false);
});
