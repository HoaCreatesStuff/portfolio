(() => {
  const copySource = document.querySelector("#summer-quest-principles-copy");
  if (!copySource) return;
  const copy = JSON.parse(copySource.textContent);
  const { principles, overview, ui } = copy.panel;

  const frame = document.querySelector(".principles-interactive iframe");
  const number = document.querySelector("#principle-panel-number");
  const title = document.querySelector("#principle-panel-title");
  const body = document.querySelector("#principle-panel-body");
  const tradeoff = document.querySelector("#principle-panel-tradeoff");
  const overviewInstruction = document.querySelector("#principle-panel-overview-instruction");
  const content = document.querySelector("#principle-panel-content");
  const panel = content?.closest(".principle-panel");
  const controls = document.querySelector(".principle-panel__controls");
  const tradeoffBlock = document.querySelector(".principle-panel__tradeoff");
  const showAll = document.querySelector("#principle-show-all");
  const panelHeightQuery = window.matchMedia("(min-width: 768px)");
  let selectedPrincipleId = principles[0].id;
  let previewPrincipleId = null;
  let viewMode = "all";
  let renderToken = 0;
  let measuredPanelWidth = 0;

  const buildMeasuredPanelState = (principle, width) => {
    const measure = document.createElement("div");
    const measureTitle = document.createElement("h3");
    const measureBody = document.createElement("p");
    const measureTradeoff = document.createElement("div");
    const measureTradeoffLabel = document.createElement("p");
    const measureTradeoffBody = document.createElement("p");

    measure.className = "principle-panel__content principle-panel__content--measure";
    measure.style.width = `${width}px`;
    measure.setAttribute("aria-hidden", "true");
    measureTitle.textContent = principle.title;
    measureBody.innerHTML = principle.body;
    measureTradeoff.className = "principle-panel__tradeoff";
    measureTradeoffLabel.className = "type-label";
    measureTradeoffLabel.textContent = ui.tradeoff;
    measureTradeoffBody.textContent = principle.tradeoff;
    measureTradeoff.append(measureTradeoffLabel, measureTradeoffBody);
    measure.append(measureTitle, measureBody, measureTradeoff);
    return measure;
  };

  const measurePanelContentHeight = (force = false) => {
    if (!content) return;
    if (!panelHeightQuery.matches) {
      content.style.removeProperty("--principle-panel-content-min-height");
      return;
    }

    const width = content.getBoundingClientRect().width;
    if (!width || (!force && width === measuredPanelWidth)) return;

    measuredPanelWidth = width;
    const measurements = principles.map((principle) => {
      const measure = buildMeasuredPanelState(principle, width);
      (panel || document.body).append(measure);
      const height = Math.ceil(measure.getBoundingClientRect().height);
      measure.remove();
      return height;
    });
    content.style.setProperty("--principle-panel-content-min-height", `${Math.max(...measurements)}px`);
  };

  const indexFor = (id) => principles.findIndex((principle) => principle.id === id);
  const labelFor = (index) => String.fromCharCode(65 + index);
  const postViewState = () => frame?.contentWindow?.postMessage(
    viewMode === "overview" || viewMode === "all"
      ? { type: "summer-quest-principle-mode", mode: viewMode, id: selectedPrincipleId }
      : { type: "summer-quest-principle-select", id: selectedPrincipleId },
    "*"
  );
  const postDiagramCopy = () => frame?.contentWindow?.postMessage(
    { type: "summer-quest-principles-copy", diagram: copy.diagram },
    "*"
  );
  const renderPanel = (id, showControls = viewMode === "selected") => {
    const index = indexFor(id);
    if (index === -1) return;
    const principle = principles[index];
    const token = ++renderToken;
    controls.hidden = !showControls;
    tradeoffBlock.hidden = false;
    overviewInstruction.hidden = true;
    showAll.hidden = false;
    showAll.textContent = ui.showAll;
    content.classList.add("is-updating");
    window.setTimeout(() => {
      if (token !== renderToken) return;
      number.textContent = `Principle ${labelFor(index)}`;
      title.textContent = principle.title;
      body.innerHTML = principle.body;
      tradeoff.textContent = principle.tradeoff;
      content.classList.remove("is-updating");
    }, 80);
  };
  const renderOverview = () => {
    const token = ++renderToken;
    controls.hidden = false;
    tradeoffBlock.hidden = true;
    overviewInstruction.hidden = false;
    showAll.hidden = false;
    showAll.textContent = viewMode === "all" ? ui.collapseAll : ui.showAll;
    content.classList.add("is-updating");
    window.setTimeout(() => {
      if (token !== renderToken) return;
      number.textContent = overview.label;
      title.textContent = overview.title;
      body.textContent = overview.body;
      content.classList.remove("is-updating");
    }, 80);
  };
  const renderFromState = () => {
    if (previewPrincipleId) renderPanel(previewPrincipleId, viewMode === "selected");
    else if (viewMode === "overview" || viewMode === "all") renderOverview();
    else renderPanel(selectedPrincipleId);
  };
  const selectPrinciple = (id, source) => {
    if (indexFor(id) === -1) return;
    viewMode = "selected";
    selectedPrincipleId = id;
    previewPrincipleId = null;
    renderFromState();
    postViewState();
  };
  const setOverviewMode = () => { viewMode = "overview"; previewPrincipleId = null; renderFromState(); postViewState(); };
  const setAllMode = () => { viewMode = "all"; previewPrincipleId = null; renderFromState(); postViewState(); };
  const collapseToDefault = () => selectPrinciple(principles[0].id, "collapse-all");

  document.querySelector("#principle-previous")?.addEventListener("click", () => {
    if (viewMode === "overview" || viewMode === "all") {
      selectPrinciple(principles[principles.length - 1].id, "previous");
      return;
    }
    const index = indexFor(selectedPrincipleId);
    if (index === 0) setAllMode();
    else selectPrinciple(principles[index - 1].id, "previous");
  });
  document.querySelector("#principle-next")?.addEventListener("click", () => {
    if (viewMode === "overview" || viewMode === "all") {
      selectPrinciple(principles[0].id, "next");
      return;
    }
    const index = indexFor(selectedPrincipleId);
    if (index === principles.length - 1) setAllMode();
    else selectPrinciple(principles[index + 1].id, "next");
  });
  showAll?.addEventListener("click", () => viewMode === "all" ? setOverviewMode() : setAllMode());
  frame?.addEventListener("load", () => {
    postViewState();
    postDiagramCopy();
  });
  window.addEventListener("message", (event) => {
    if (event.source !== frame?.contentWindow) return;
    if (event.data?.type === "summer-quest-principles-copy-request") {
      postDiagramCopy();
      return;
    }
    if (event.data?.type === "summer-quest-principle-request") selectPrinciple(event.data.id, "visual");
    if (event.data?.type === "summer-quest-principle-mode-request") event.data.mode === "all" ? setAllMode() : setOverviewMode();
    if (event.data?.type === "summer-quest-principle-state") {
      previewPrincipleId = event.data.preview ? event.data.id : null;
      renderFromState();
    }
  });
  const panelResizeObserver = typeof ResizeObserver === "undefined"
    ? null
    : new ResizeObserver(() => measurePanelContentHeight());
  panelResizeObserver?.observe(content);
  panelHeightQuery.addEventListener("change", () => measurePanelContentHeight(true));
  window.addEventListener("resize", () => measurePanelContentHeight());
  document.fonts?.ready.then(() => measurePanelContentHeight(true));
  measurePanelContentHeight(true);
  setAllMode();
})();
