export function createPdfThumbnailLifecycle() {
  const loadingTasks = new Set();
  const documents = new Set();
  const renderTasks = new Set();

  const destroyDocument = async (pdf) => {
    if (!pdf) return;
    documents.delete(pdf);
    try { await pdf.cleanup?.(); } catch { /* ignore cleanup failures */ }
    try { await pdf.destroy?.(); } catch { /* ignore destroy failures */ }
  };

  const cancelRender = (task) => {
    if (!task) return;
    try { task.cancel?.(); } catch { /* ignore cancellation failures */ }
    renderTasks.delete(task);
  };

  const cleanup = async () => {
    for (const task of loadingTasks) {
      try { task.destroy?.(); } catch { /* ignore cancellation failures */ }
    }
    loadingTasks.clear();
    for (const task of renderTasks) cancelRender(task);
    for (const pdf of [...documents]) await destroyDocument(pdf);
  };

  return {
    addLoadingTask: (task) => loadingTasks.add(task),
    removeLoadingTask: (task) => loadingTasks.delete(task),
    addDocument: (pdf) => documents.add(pdf),
    addRenderTask: (task) => renderTasks.add(task),
    removeRenderTask: (task) => renderTasks.delete(task),
    destroyDocument,
    cancelRender,
    cleanup,
  };
}

export function createThumbnailGenerationGuard() {
  let generation = 0;
  return {
    next: () => ++generation,
    isCurrent: (value, active = true) => active && value === generation,
  };
}
