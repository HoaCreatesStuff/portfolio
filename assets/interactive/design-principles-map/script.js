/* D3 force-directed node map. The parent page supplies the content at runtime. */
function bootPrinciplesMap(DESIGN_PRINCIPLES) {
const CENTER = { x: 600, y: 400 };
const VIEWPORT = { left: 0, top: 0, right: 1200, bottom: 800 };
const CENTER_PRINCIPLE_GAP = 20;
const BRANCH_COLORS = {
  shared: { strong: "#DDB9C5", tint: "color-mix(in srgb, #DDB9C5 50%, var(--color-paper))", line: "#DDB9C5" },
  invitation: { strong: "#B4C7D9", tint: "color-mix(in srgb, #B4C7D9 50%, var(--color-paper))", line: "#B4C7D9" },
  momentum: { strong: "#EBD9A4", tint: "color-mix(in srgb, #EBD9A4 50%, var(--color-paper))", line: "#EBD9A4" },
  adventure: { strong: "#C5B8D6", tint: "color-mix(in srgb, #C5B8D6 50%, var(--color-paper))", line: "#C5B8D6" },
  memory: { strong: "#F2B07F", tint: "color-mix(in srgb, #F2B07F 35%, var(--color-paper))", line: "#F2B07F" }
};
const svg = d3.select("#principles-diagram");
const linkLayer = d3.select("#connectors");
const nodeLayer = d3.select("#nodes");
const measurementLayer = svg.append("g").attr("aria-hidden", "true").style("visibility", "hidden").style("pointer-events", "none");
const debugLayer = svg.append("g").attr("id", "node-debug-geometry").attr("aria-hidden", "true");
const toggleAllButton = document.querySelector("#toggle-all");
const diagnosticsEnabled = new URLSearchParams(window.location.search).has("node-debug");
const diagnosticNodeIds = new Set(["center", "shared", "momentum-2"]);
let diagnosticSequence = 0;
const cssTokenPixels = (token) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return value.endsWith("rem") ? parseFloat(value) * parseFloat(getComputedStyle(document.documentElement).fontSize) : parseFloat(value);
};
const rootPadding = cssTokenPixels("--space-8");
const nodePadding = cssTokenPixels("--space-8");
const principlePrefixGap = cssTokenPixels("--space-8");
const utilitySafety = cssTokenPixels("--space-8");

const expandedBranches = new Set();
let previewId = null;
let selectedPrincipleId = "shared";
let viewMode = "all";
let hoveredChild = null;
let nodeSelection = nodeLayer.selectAll(".map-node");
let linkSelection = linkLayer.selectAll(".link");
let previewTimer = null;
let collapseTimer = null;
let lastPointer = null;
let previewPointerWithinBranch = false;
let utilityObstacle = null;
let measurementVersion = 0;
let hasMeasuredTray = false;
let mapPhase = "booting";
let pendingViewState = null;
let fontRefreshQueued = false;

function isDiagnosticNode(node) { return diagnosticsEnabled && diagnosticNodeIds.has(node.id); }
function diagnosticLog(event, detail) {
  if (!diagnosticsEnabled) return;
  const prefix = event === "ROOT" ? "[principles-map diagnostic][ROOT]" : "[principles-map diagnostic]";
  console.log(prefix, { sequence: ++diagnosticSequence, event, phase: mapPhase, ...detail });
}

const centerNode = {
  id: "center", type: "center", label: DESIGN_PRINCIPLES.center.label,
  x: CENTER.x, y: CENTER.y
};
const principleNodes = DESIGN_PRINCIPLES.principles.map((principle, index) => ({
  ...principle, type: "principle", branchId: principle.id, code: String.fromCharCode(65 + index), index,
  x: CENTER.x + Math.cos((-Math.PI / 2) + index * (Math.PI * 2 / 5)) * 188,
  y: CENTER.y + Math.sin((-Math.PI / 2) + index * (Math.PI * 2 / 5)) * 188
}));
const childNodes = DESIGN_PRINCIPLES.principles.flatMap((principle) => principle.children.map((child, index) => ({
  ...child, id: `${principle.id}-${index}`, parentId: principle.id, branchId: principle.id, type: "child", childIndex: index
})));
const nodeById = new Map([centerNode, ...principleNodes, ...childNodes].map((node) => [node.id, node]));
if (viewMode === "selected") expandedBranches.add(selectedPrincipleId);
if (viewMode === "all") principleNodes.forEach((node) => expandedBranches.add(node.id));

function reportPrincipleState(id = previewId || selectedPrincipleId) {
  if (window.parent !== window) window.parent.postMessage({ type: "summer-quest-principle-state", id, preview: Boolean(previewId), viewMode }, "*");
}

function activeBranchIds() {
  // The overview is intentionally quiet: show only the core and five
  // principles until a branch is temporarily previewed or selected.
  if (viewMode === "overview") return previewId ? new Set([previewId]) : new Set();
  if (viewMode === "all") return new Set(principleNodes.map((node) => node.id));
  // Selected mode shows one child cluster only: a hover temporarily replaces the
  // locked branch, then the locked branch returns when preview clears.
  return new Set([previewId || selectedPrincipleId]);
}

function deriveGraph() {
  const visibleBranches = activeBranchIds();
  const children = childNodes.filter((node) => visibleBranches.has(node.parentId));
  children.forEach((node) => { node.previewOnly = viewMode === "selected" && previewId === node.parentId && !expandedBranches.has(node.parentId); });
  const graphNodes = [centerNode, ...principleNodes, ...children];
  const graphLinks = principleNodes.map((node) => ({ source: "center", target: node.id, type: "primary", branch: node.id }));
  children.forEach((node) => graphLinks.push({
    source: node.parentId, target: node.id, type: "child", branch: node.parentId,
    preview: node.previewOnly
  }));
  return { nodes: graphNodes, links: graphLinks };
}

/* Child targets form an outward-only fan. Candidate axes are scored for open space, then the force
   system makes small collision-aware adjustments without allowing a branch to fold through center. */
function targetArc(parent, branchChildren, occupiedNodes) {
  const outwardLength = Math.hypot(parent.x - CENTER.x, parent.y - CENTER.y) || 1;
  const outward = { x: (parent.x - CENTER.x) / outwardLength, y: (parent.y - CENTER.y) / outwardLength };
  const baseAngle = Math.atan2(outward.y, outward.x);
  const orbit = 130;
  const spread = branchChildren.length > 3 ? 0.8 : 0.66;
  const candidates = [0, -0.38, 0.38, -0.7, 0.7, -1.05, 1.05];
  let best = null;

  candidates.forEach((rotation) => {
    const targets = branchChildren.map((child, index) => {
      const fanOffset = branchChildren.length === 1 ? 0 : -spread / 2 + (spread * index) / (branchChildren.length - 1);
      const angle = baseAngle + rotation + fanOffset;
      return { child, x: parent.x + Math.cos(angle) * orbit, y: parent.y + Math.sin(angle) * orbit, angle };
    });
    const score = targets.reduce((total, target) => {
      const edgeDistance = Math.min(target.x - target.child.radius - VIEWPORT.left, VIEWPORT.right - target.x - target.child.radius, target.y - target.child.radius - VIEWPORT.top, VIEWPORT.bottom - target.y - target.child.radius);
      let penalty = edgeDistance < 16 ? (16 - edgeDistance) * 18 : 0;
      if (utilityObstacle) {
        const nearX = Math.max(utilityObstacle.left, Math.min(target.x, utilityObstacle.right));
        const nearY = Math.max(utilityObstacle.top, Math.min(target.y, utilityObstacle.bottom));
        const utilityClearance = Math.hypot(target.x - nearX, target.y - nearY) - target.child.radius;
        penalty += utilityClearance < 16 ? (16 - utilityClearance) * 60 : 0;
      }
      occupiedNodes.forEach((node) => {
        if (node.id === parent.id || node.parentId === parent.id) return;
        const distance = Math.hypot(target.x - node.x, target.y - node.y);
        const clearance = distance - target.child.radius - node.radius;
        penalty += clearance < 34 ? (34 - clearance) * 4 : 0;
      });
      const directionX = (target.x - parent.x) / orbit;
      const directionY = (target.y - parent.y) / orbit;
      if (directionX * outward.x + directionY * outward.y < 0.1) penalty += 10000;
      return total - penalty;
    }, 0);
    if (!best || score > best.score) best = { score, targets };
  });
  return { outward, orbit, targets: best.targets };
}

function positionChildrenOutward(graphNodes) {
  const visibleChildren = graphNodes.filter((node) => node.type === "child");
  const previousIds = new Set(simulation.nodes().map((node) => node.id));
  DESIGN_PRINCIPLES.principles.forEach((principle) => {
    const parent = nodeById.get(principle.id);
    const branchChildren = visibleChildren.filter((child) => child.parentId === principle.id);
    if (!branchChildren.length) return;
    const { outward, orbit, targets } = targetArc(parent, branchChildren, graphNodes.filter((node) => node.parentId !== principle.id));
    targets.forEach((target) => {
      const child = target.child;
      child.targetX = target.x;
      child.targetY = target.y;
      child.outwardX = outward.x;
      child.outwardY = outward.y;
      child.orbit = orbit;
      if (!previousIds.has(child.id)) { child.x = target.x; child.y = target.y; child.vx = 0; child.vy = 0; }
    });
  });
}

function lineHeightFor(node) { return node.type === "center" ? 20 : 17; }
function labelOffsetFor(node) { return node.type === "principle" ? 8 : 0; }
function renderLines(selection, lines, lineHeight, offsetY = 0) {
  const offset = ((lines.length - 1) * lineHeight) / 2;
  selection.selectAll("tspan").remove();
  lines.forEach((text, index) => selection.append("tspan").attr("x", 0).attr("y", -offset + offsetY + index * lineHeight).text(text));
}
function linePartitions(words, start = 0, current = [], partitions = []) {
  if (start === words.length) { partitions.push(current); return partitions; }
  for (let end = start + 1; end <= words.length; end += 1) {
    linePartitions(words, end, [...current, words.slice(start, end).join(" ")], partitions);
  }
  return partitions;
}
function measureNode(node) {
  if (!isDiagnosticNode(node) && node.measurementVersion === measurementVersion) return;
  const cachedRadiusBefore = node.radius;
  const padding = node.type === "center" ? rootPadding : nodePadding;
  const lineHeight = lineHeightFor(node);
  const offsetY = labelOffsetFor(node);
  const probe = measurementLayer.append("g").attr("class", `map-node ${node.type}`);
  const label = probe.append("text").attr("class", "node-label").attr("text-anchor", "middle").attr("dominant-baseline", "middle");
  const prefix = node.type === "principle" ? probe.append("text").attr("class", "node-prefix").attr("text-anchor", "middle").attr("y", 0).text(node.code) : null;
  let best = null;
  linePartitions(node.label.split(" ")).forEach((lines) => {
    renderLines(label, lines, lineHeight, offsetY);
    let prefixY = null;
    if (prefix) {
      const labelBounds = label.node().getBBox();
      prefix.attr("y", 0);
      const prefixBounds = prefix.node().getBBox();
      prefixY = labelBounds.y - principlePrefixGap - (prefixBounds.y + prefixBounds.height);
      prefix.attr("y", prefixY);
    }
    const bounds = probe.node().getBBox();
    const halfWidth = bounds.width / 2 + padding;
    const halfHeight = bounds.height / 2 + padding;
    const radius = Math.ceil(Math.hypot(halfWidth, halfHeight));
    if (!best || radius < best.radius || (radius === best.radius && lines.length < best.lines.length)) best = { lines, radius, halfWidth, halfHeight, prefixY };
  });
  renderLines(label, best.lines, lineHeight, offsetY);
  if (prefix) prefix.attr("y", best.prefixY);
  const textBounds = label.node().getBBox();
  const groupBounds = probe.node().getBBox();
  const textRect = label.node().getBoundingClientRect();
  const computed = getComputedStyle(label.node());
  probe.remove();
  node.labelLines = best.lines;
  node.labelLineHeight = lineHeight;
  node.labelOffsetY = offsetY;
  node.prefixY = best.prefixY;
  node.radius = best.radius;
  node.measurementVersion = measurementVersion;
  node.debugTextBounds = textBounds;
  node.debugGroupBounds = groupBounds;
  if (isDiagnosticNode(node)) {
    const tray = document.querySelector(".diagram-wrap");
    diagnosticLog(node.type === "center" ? "ROOT" : "measure", {
      stage: "measurement", nodeId: node.id, semanticLevel: node.type === "center" ? 1 : node.type === "principle" ? 2 : 3,
      label: node.label, trayWidth: tray.clientWidth, trayHeight: tray.clientHeight,
      viewBox: svg.attr("viewBox"), svgWidth: svg.node().clientWidth, svgHeight: svg.node().clientHeight,
      fontFamily: computed.fontFamily, fontSize: computed.fontSize, lineHeight: computed.lineHeight,
      lines: best.lines, textBBox: { width: textBounds.width, height: textBounds.height },
      groupBBox: { width: groupBounds.width, height: groupBounds.height },
      clientRect: { width: textRect.width, height: textRect.height },
      cssToSvgRatio: { width: textRect.width / textBounds.width, height: textRect.height / textBounds.height },
      paddingToken: node.type === "center" ? "--space-16" : "--space-8 × 2",
      resolvedPadding: padding, rootMinimumRadius: node.type === "center" ? null : undefined,
      paddedHalfWidth: best.halfWidth, paddedHalfHeight: best.halfHeight,
      calculatedRadius: best.radius, cachedRadiusBefore, storedRadiusAfter: node.radius
    });
  }
}
function measureNodeRadii(nodes) {
  if (VIEWPORT.right <= 1 || VIEWPORT.bottom <= 1 || svg.attr("viewBox") === "0 0 1 1") {
    throw new Error("Attempted node measurement before the SVG tray was initialized.");
  }
  nodes.forEach(measureNode);
}

function clusterForce(alpha) {
  const nodes = simulation.nodes();
  nodes.filter((node) => node.type === "child").forEach((child) => {
    const parent = nodeById.get(child.parentId);
    if (!parent) return;
    const offsetX = child.x - parent.x;
    const offsetY = child.y - parent.y;
    const outwardDistance = offsetX * child.outwardX + offsetY * child.outwardY;
    child.vx += (child.targetX - child.x) * 0.17 * alpha;
    child.vy += (child.targetY - child.y) * 0.17 * alpha;
    if (outwardDistance < child.orbit * 0.58) {
      const correction = (child.orbit * 0.58 - outwardDistance) * 0.045 * alpha;
      child.vx += child.outwardX * correction;
      child.vy += child.outwardY * correction;
    }
  });
}

function coreAttraction(alpha) {
  // The core is deliberately movable: this is a gentle pull toward the tray's
  // available-space centroid, not a fixed x/y position.
  let targetX = CENTER.x;
  let targetY = CENTER.y;
  if (utilityObstacle) {
    const trayArea = (VIEWPORT.right - VIEWPORT.left) * (VIEWPORT.bottom - VIEWPORT.top);
    const obstacleArea = Math.max(0, utilityObstacle.right - utilityObstacle.left) * Math.max(0, utilityObstacle.bottom - utilityObstacle.top);
    const remainingArea = Math.max(1, trayArea - obstacleArea);
    targetX = (CENTER.x * trayArea - ((utilityObstacle.left + utilityObstacle.right) / 2) * obstacleArea) / remainingArea;
    targetY = (CENTER.y * trayArea - ((utilityObstacle.top + utilityObstacle.bottom) / 2) * obstacleArea) / remainingArea;
  }
  centerNode.vx += (targetX - centerNode.x) * 0.045 * alpha;
  centerNode.vy += (targetY - centerNode.y) * 0.045 * alpha;
}

function containForce() {
  // This is an edge-to-edge clearance, not merely a center-point collision rule.
  // It keeps a principle's hit area from being swallowed by the core node.
  simulation.nodes().filter((node) => node.type === "principle").forEach((node) => {
    const dx = node.x - CENTER.x;
    const dy = node.y - CENTER.y;
    const distance = Math.hypot(dx, dy) || 1;
    const minimumDistance = centerNode.radius + node.radius + CENTER_PRINCIPLE_GAP;
    if (distance < minimumDistance) {
      const correction = minimumDistance - distance;
      const scale = minimumDistance / distance;
      node.x = CENTER.x + dx * scale;
      node.y = CENTER.y + dy * scale;
      node.vx += (dx / distance) * correction * 0.35;
      node.vy += (dy / distance) * correction * 0.35;
    }
  });
  simulation.nodes().forEach((node) => {
    if (utilityObstacle) {
      const left = utilityObstacle.left - node.radius;
      const right = utilityObstacle.right + node.radius;
      const top = utilityObstacle.top - node.radius;
      const bottom = utilityObstacle.bottom + node.radius;
      if (node.x > left && node.x < right && node.y > top && node.y < bottom) {
        const exits = [
          { distance: node.x - left, axis: "x", value: left },
          { distance: right - node.x, axis: "x", value: right },
          { distance: node.y - top, axis: "y", value: top },
          { distance: bottom - node.y, axis: "y", value: bottom }
        ];
        const exit = exits.reduce((nearest, candidate) => candidate.distance < nearest.distance ? candidate : nearest);
        node[exit.axis] = exit.value;
      }
    }
    const padding = node.radius + 20;
    node.x = Math.max(VIEWPORT.left + padding, Math.min(VIEWPORT.right - padding, node.x));
    node.y = Math.max(VIEWPORT.top + padding, Math.min(VIEWPORT.bottom - padding, node.y));
  });
}

const simulation = d3.forceSimulation()
  .force("link", d3.forceLink().id((node) => node.id).distance((link) => link.type === "primary" ? 165 : 130).strength((link) => link.type === "primary" ? 0.54 : 0.98))
  .force("charge", d3.forceManyBody().strength((node) => node.type === "center" ? -420 : node.type === "principle" ? -250 : -105))
  .force("collide", d3.forceCollide().radius((node) => node.radius + 3).strength(0.95).iterations(2))
  .force("cluster", clusterForce)
  .force("core-attraction", coreAttraction)
  .force("contain", containForce)
  .alphaDecay(0.075)
  .velocityDecay(0.54)
  .on("tick", ticked);

function isPreviewed(node) { return previewId === node.parentId || previewId === node.id; }
function isExpanded(node) { return expandedBranches.has(node.parentId || node.id); }
function isSelected(node) { return viewMode === "selected" && node.type === "principle" && node.id === selectedPrincipleId; }
function activeBranchId() { return previewId || (viewMode === "selected" ? selectedPrincipleId : null); }
function isEmphasizedBranch(branch) { const active = activeBranchId(); return !active || branch === active; }
function isDeemphasized(node) { return Boolean(node.branchId && !isEmphasizedBranch(node.branchId)); }
function getNodeOpacity() { return 1; }
function getLinkOpacity(link) { return link.type === "child" ? 0.84 : 0.88; }
function getLinkStroke(link) {
  if (link.type !== "child") return null;
  const colors = BRANCH_COLORS[link.branch];
  return colors.line;
}
function renderLabels() {
  nodeSelection.select("text").each(function(node) {
    const label = d3.select(this);
    renderLines(label, node.labelLines, node.labelLineHeight, node.labelOffsetY);
  });
}

function renderDebugGeometry(graphNodes) {
  if (!diagnosticsEnabled) return;
  const debugNodes = graphNodes.filter(isDiagnosticNode);
  debugLayer.selectAll("g.node-debug").data(debugNodes, (node) => node.id).join(
    (enter) => {
      const group = enter.append("g").attr("class", "node-debug");
      group.append("circle").attr("class", "node-debug__circle");
      group.append("rect").attr("class", "node-debug__text");
      group.append("rect").attr("class", "node-debug__padded");
      return group;
    },
    (update) => update,
    (exit) => exit.remove()
  ).attr("transform", (node) => `translate(${node.x},${node.y})`).each(function(node) {
    const group = d3.select(this);
    const padding = node.type === "center" ? rootPadding : nodePadding;
    const bounds = node.debugGroupBounds;
    group.select(".node-debug__circle").attr("r", node.radius);
    group.select(".node-debug__text").attr("x", bounds.x).attr("y", bounds.y).attr("width", bounds.width).attr("height", bounds.height);
    group.select(".node-debug__padded").attr("x", bounds.x - padding).attr("y", bounds.y - padding).attr("width", bounds.width + padding * 2).attr("height", bounds.height + padding * 2);
    if (node.type === "center") {
      const liveText = nodeSelection.filter((candidate) => candidate.id === node.id).select(".node-label").node();
      const liveCircle = nodeSelection.filter((candidate) => candidate.id === node.id).select(".node-circle");
      const liveBBox = liveText.getBBox();
      const liveRect = liveText.getBoundingClientRect();
      diagnosticLog("ROOT", {
        stage: "rendered", nodeId: node.id, semanticLevel: 1, viewBox: svg.attr("viewBox"),
        trayWidth: document.querySelector(".diagram-wrap").clientWidth, trayHeight: document.querySelector(".diagram-wrap").clientHeight,
        textBBox: { width: liveBBox.width, height: liveBBox.height },
        clientRect: { width: liveRect.width, height: liveRect.height },
        cssToSvgRatio: { width: liveRect.width / liveBBox.width, height: liveRect.height / liveBBox.height },
        rootPaddingToken: "--space-16", resolvedRootPadding: rootPadding,
        calculatedRadius: node.radius, renderedCircleRadius: Number(liveCircle.attr("r")),
        rootMinimumRadius: null
      });
    }
  });
}

function renderGraph({ allowBeforeReady = false, reason = "external" } = {}) {
  diagnosticLog("render", { reason, selectedPrincipleId, previewId, viewMode, allowBeforeReady, willMeasure: mapPhase === "ready" || allowBeforeReady });
  if (mapPhase !== "ready" && !allowBeforeReady) {
    diagnosticLog("blocked-render", { reason });
    return;
  }
  const graph = deriveGraph();
  measureNodeRadii(graph.nodes);
  positionChildrenOutward(graph.nodes);
  simulation.nodes(graph.nodes);
  simulation.force("link").links(graph.links);

  const linkJoin = linkLayer.selectAll("path.link").data(graph.links, (link) => `${link.source.id || link.source}-${link.target.id || link.target}`);
  linkJoin.interrupt();
  linkSelection = linkJoin
    .join(
      (enter) => enter.append("path").attr("class", "link").style("opacity", 0),
      (update) => update.interrupt(),
      (exit) => exit.interrupt().transition().duration((link) => link.preview ? 90 : 105).ease(d3.easeCubicOut).style("opacity", 0).remove()
  )
    .attr("class", (link) => `link ${link.type}-link branch-${link.branch}${link.preview ? " is-preview" : ""}${expandedBranches.has(link.branch) ? " is-expanded" : ""}${!isEmphasizedBranch(link.branch) ? " is-deemphasized" : ""}`);
  linkSelection.interrupt().transition().duration((link) => link.preview ? 120 : 150).ease(d3.easeCubicOut).style("opacity", getLinkOpacity);
  linkSelection.style("stroke", getLinkStroke);

  const nodeJoin = nodeLayer.selectAll("g.map-node").data(graph.nodes, (node) => node.id);
  nodeJoin.interrupt();
  nodeJoin.exit().interrupt().transition().duration((node) => node.previewOnly ? 100 : 170).ease(d3.easeCubicOut).style("opacity", 0).attr("transform", (node) => `translate(${node.x},${node.y}) scale(.2)`).remove();
  const enteringNodes = nodeJoin.enter().append("g").attr("class", "map-node").style("opacity", 0).attr("transform", (node) => `translate(${node.x || CENTER.x},${node.y || CENTER.y})`);
  enteringNodes.filter((node) => node.type === "principle").append("circle").attr("class", "node-hit-area");
  enteringNodes.append("circle").attr("class", "node-circle");
  enteringNodes.append("text").attr("class", "node-label").attr("text-anchor", "middle").attr("dominant-baseline", "middle");
  enteringNodes.filter((node) => node.type === "principle").append("text").attr("class", "node-prefix").attr("text-anchor", "middle");
  nodeSelection = enteringNodes.merge(nodeJoin);

  nodeSelection
    .attr("class", (node) => `map-node ${node.type}${isPreviewed(node) ? " is-preview" : ""}${isExpanded(node) ? " is-expanded" : ""}${isSelected(node) ? " is-selected" : ""}${isDeemphasized(node) ? " is-deemphasized" : ""}${hoveredChild?.id === node.id ? " is-hovered" : ""}`)
    .attr("role", (node) => node.type === "principle" ? "button" : "img")
    .attr("tabindex", (node) => node.type === "principle" ? 0 : null)
    .attr("aria-pressed", (node) => node.type === "principle" ? String(expandedBranches.has(node.id)) : null)
    .attr("aria-current", (node) => isSelected(node) ? "true" : null)
    .attr("aria-label", (node) => node.type === "center" ? node.label : node.type === "principle" ? `${node.label}. Press to unpack product decisions.` : `${node.label}. ${node.detail}`)
    .on("mouseenter", (event, node) => { if (node.type === "principle") handleEnter(node, event); })
    .on("mouseleave", (event, node) => { if (node.type === "principle") handleLeave(node, event); })
    .on("focus", (event, node) => { if (node.type === "principle") handleEnter(node, event); })
    .on("blur", (_, node) => { if (node.type === "principle") handleLeave(node); })
    .on("click", (_, node) => { if (node.type === "principle") toggleBranch(node.id); })
    .on("keydown", (event, node) => {
      if ((event.key === "Enter" || event.key === " ") && node.type === "principle") { event.preventDefault(); toggleBranch(node.id); }
      if (event.key === "Escape") resetMap();
    })
    .call(d3.drag().on("start", dragStarted).on("drag", dragged).on("end", dragEnded));

  nodeSelection
    .style("--branch-strong", (node) => node.branchId ? BRANCH_COLORS[node.branchId].strong : null)
    .style("--branch-tint", (node) => node.branchId ? BRANCH_COLORS[node.branchId].tint : null);

  nodeSelection.select(".node-circle").attr("r", (node) => node.radius);
  nodeSelection.select(".node-hit-area").attr("r", (node) => node.radius + 16);
  nodeSelection.filter((node) => node.type === "principle").select(".node-prefix").text((node) => node.code).attr("y", (node) => node.prefixY);
  renderLabels();
  renderDebugGeometry(graph.nodes);
  enteringNodes.select(".node-circle").attr("r", 0).interrupt().transition().duration((node) => node.previewOnly ? 120 : 210).ease(d3.easeCubicOut).attr("r", (node) => node.radius);
  nodeSelection.interrupt().transition().duration((node) => node.previewOnly ? 120 : 160).ease(d3.easeCubicOut).style("opacity", getNodeOpacity);
  updateControl();
  restartSimulation();
}

function restartSimulation() { simulation.alpha(0.72).restart(); }
function ticked() {
  // Force integration happens after custom forces; clamp once more before paint so
  // an in-flight velocity can never visually collapse the core/principle gap.
  containForce();
  linkSelection.attr("d", (link) => `M ${link.source.x} ${link.source.y} L ${link.target.x} ${link.target.y}`);
  nodeSelection.attr("transform", (node) => `translate(${node.x},${node.y})`);
}

function clearHoverTimers() { clearTimeout(previewTimer); clearTimeout(collapseTimer); }
function queuePreview(branch) {
  clearTimeout(collapseTimer);
  clearTimeout(previewTimer);
  previewPointerWithinBranch = true;
  if (previewId && previewId !== branch) { previewId = null; renderGraph(); }
  previewTimer = setTimeout(() => {
    if (viewMode === "overview" || !expandedBranches.has(branch)) { previewId = branch; renderGraph(); reportPrincipleState(branch); }
  }, 60);
}
function queueCollapse(branch) {
  clearTimeout(collapseTimer);
  collapseTimer = setTimeout(() => {
    if (previewId !== branch || (viewMode === "selected" && expandedBranches.has(branch))) return;
    // Keep preview state independent from a node's animated geometry. This only
    // becomes false after a real pointer move (or leaving the SVG) exits the branch.
    if (previewPointerWithinBranch) return;
    previewId = null; hoveredChild = null; previewPointerWithinBranch = false; renderGraph(); reportPrincipleState();
  }, 120);
}
function pointToSegmentDistance(point, start, end) {
  const x = end.x - start.x;
  const y = end.y - start.y;
  const lengthSquared = x * x + y * y || 1;
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * x + (point.y - start.y) * y) / lengthSquared));
  return Math.hypot(point.x - (start.x + t * x), point.y - (start.y + t * y));
}
function pointWithinPreview(point, branch) {
  const parent = nodeById.get(branch);
  const branchChildren = childNodes.filter((node) => node.parentId === branch);
  if (Math.hypot(point.x - parent.x, point.y - parent.y) <= parent.radius + 16) return true;
  return branchChildren.some((child) => {
    const childPoint = { x: child.x ?? child.targetX, y: child.y ?? child.targetY };
    return Math.hypot(point.x - childPoint.x, point.y - childPoint.y) <= child.radius + 10 || pointToSegmentDistance(point, parent, childPoint) <= 18;
  });
}

function updateLastPointer(event) {
  if (event && "clientX" in event) {
    const [x, y] = d3.pointer(event, svg.node());
    lastPointer = { x, y };
  }
}
function handleEnter(node, event) {
  updateLastPointer(event);
  if (node.type === "center") return;
  if (node.type === "child") { hoveredChild = node; updateNodeClasses(); return; }
  const branch = node.parentId || node.id;
  previewPointerWithinBranch = true;
  clearTimeout(collapseTimer);
  if ((viewMode === "overview" || !expandedBranches.has(branch)) && previewId !== branch) queuePreview(branch);
  else { updateNodeClasses(); updateControl(); }
}
function handleLeave(node, event) {
  updateLastPointer(event);
  if (node.type === "child") { hoveredChild = null; updateNodeClasses(); return; }
  const branch = node.parentId || node.id;
  if ((viewMode === "overview" || !expandedBranches.has(branch)) && previewId !== branch) clearTimeout(previewTimer);
  if ((viewMode === "overview" || !expandedBranches.has(branch)) && previewId === branch) queueCollapse(branch);
  else { updateNodeClasses(); updateControl(); }
}

function updateNodeClasses() {
  nodeSelection.attr("class", (node) => `map-node ${node.type}${isPreviewed(node) ? " is-preview" : ""}${isExpanded(node) ? " is-expanded" : ""}${isSelected(node) ? " is-selected" : ""}${isDeemphasized(node) ? " is-deemphasized" : ""}${hoveredChild?.id === node.id ? " is-hovered" : ""}`);
  linkSelection.attr("class", (link) => `link ${link.type}-link branch-${link.branch}${link.preview ? " is-preview" : ""}${expandedBranches.has(link.branch) ? " is-expanded" : ""}${!isEmphasizedBranch(link.branch) ? " is-deemphasized" : ""}`);
}
function applyViewState(mode, id = selectedPrincipleId) {
  if (mapPhase !== "ready") {
    pendingViewState = { mode, id };
    return;
  }
  clearHoverTimers(); viewMode = mode; selectedPrincipleId = id; expandedBranches.clear();
  if (viewMode === "selected") expandedBranches.add(selectedPrincipleId);
  if (viewMode === "all") principleNodes.forEach((node) => expandedBranches.add(node.id));
  previewId = null; hoveredChild = null; previewPointerWithinBranch = false;
  if (viewMode === "selected") {
    // Selection is single-branch: remove every previously unpacked child branch
    // before its replacement enters the simulation.
    nodeLayer.selectAll("g.child").filter((node) => node.parentId !== selectedPrincipleId).interrupt().transition().duration(120).ease(d3.easeCubicOut).style("opacity", 0).remove();
    linkLayer.selectAll("path.child-link").filter((link) => link.branch !== selectedPrincipleId).interrupt().transition().duration(100).ease(d3.easeCubicOut).style("opacity", 0).remove();
  }
  renderGraph({ reason: "view-state" }); reportPrincipleState();
}
function selectPrinciple(id) { applyViewState("selected", id); }
function toggleBranch(id) {
  if (window.parent !== window) {
    window.parent.postMessage({ type: "summer-quest-principle-request", id }, "*");
    return;
  }
  selectPrinciple(id);
}
function setBranchExpanded(id) { selectPrinciple(id); }
function unpackAll() { applyViewState("all", selectedPrincipleId); }
function collapseAll() { applyViewState("overview", selectedPrincipleId); }
function resetMap() { collapseAll(); }

function updateControl() {
  if (!toggleAllButton) return;
  const allExpanded = viewMode === "all";
  toggleAllButton.classList.toggle("is-active", allExpanded);
  toggleAllButton.setAttribute("aria-pressed", String(allExpanded));
  toggleAllButton.textContent = allExpanded ? "Collapse all" : "Show all";
}

function dragStarted(event, node) { if (!event.active) simulation.alphaTarget(0.18).restart(); node.fx = node.x; node.fy = node.y; }
function dragged(event, node) {
  const padding = node.radius + 12;
  node.fx = Math.max(VIEWPORT.left + padding, Math.min(VIEWPORT.right - padding, event.x));
  node.fy = Math.max(VIEWPORT.top + padding, Math.min(VIEWPORT.bottom - padding, event.y));
}
function dragEnded(event, node) { if (!event.active) simulation.alphaTarget(0); node.fx = null; node.fy = null; }

toggleAllButton?.addEventListener("click", () => {
  if (window.parent !== window) window.parent.postMessage({ type: "summer-quest-principle-mode-request", mode: viewMode === "all" ? "overview" : "all" }, "*");
  else viewMode === "all" ? collapseAll() : unpackAll();
});
window.addEventListener("message", (event) => {
  if (event.source !== window.parent) return;
  if (event.data?.type === "summer-quest-principle-select" && nodeById.has(event.data.id)) selectPrinciple(event.data.id);
  if (event.data?.type === "summer-quest-principle-mode") applyViewState(event.data.mode, event.data.id || selectedPrincipleId);
});
svg.on("pointermove", (event) => {
  updateLastPointer(event);
  if (!previewId || (viewMode === "selected" && expandedBranches.has(previewId))) return;
  previewPointerWithinBranch = Boolean(lastPointer && pointWithinPreview(lastPointer, previewId));
  if (previewPointerWithinBranch) clearTimeout(collapseTimer);
  else queueCollapse(previewId);
}).on("pointerleave", () => {
  previewPointerWithinBranch = false;
  if (previewId && (viewMode === "overview" || !expandedBranches.has(previewId))) queueCollapse(previewId);
});
function resizeMapToContainer() {
  const tray = document.querySelector(".diagram-wrap");
  const width = tray.clientWidth;
  const height = tray.clientHeight;
  if (!width || !height) return false;
  diagnosticLog("resize-before", { viewBox: svg.attr("viewBox"), width: VIEWPORT.right, height: VIEWPORT.bottom });
  const previousCenter = { ...CENTER };
  CENTER.x = width / 2;
  CENTER.y = height / 2;
  VIEWPORT.left = 0;
  VIEWPORT.top = 0;
  VIEWPORT.right = width;
  VIEWPORT.bottom = height;
  // One SVG unit equals one CSS pixel. The balls and text therefore retain
  // their semantic size while the simulation rolls them into the new tray.
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  diagnosticLog("resize-after", { viewBox: svg.attr("viewBox"), width, height, measurementsInvalidated: false, reason: "SVG units remain CSS-pixel units" });
  utilityObstacle = null;
  if (!hasMeasuredTray) {
    const shiftX = CENTER.x - previousCenter.x;
    const shiftY = CENTER.y - previousCenter.y;
    [centerNode, ...principleNodes, ...childNodes].forEach((node) => {
      node.x = (node.x ?? CENTER.x) + shiftX;
      node.y = (node.y ?? CENTER.y) + shiftY;
    });
    hasMeasuredTray = true;
  }
  if (mapPhase === "ready") simulation.alpha(0.46).restart();
  return true;
}

const trayResizeObserver = new ResizeObserver(() => {
  const hasTraySize = resizeMapToContainer();
  if (hasTraySize && mapPhase === "booting") initializeMap();
});
trayResizeObserver.observe(document.querySelector(".diagram-wrap"));

async function initializeMap() {
  if (mapPhase !== "booting") return;
  mapPhase = "initializing";
  if (!resizeMapToContainer()) { mapPhase = "booting"; return; }
  if (document.fonts) {
    await Promise.all([
      document.fonts.load("500 20px Figtree"),
      document.fonts.load("600 17px Figtree"),
      document.fonts.load("500 16px Figtree")
    ]);
    await document.fonts.ready;
  }
  if (!resizeMapToContainer()) { mapPhase = "booting"; return; }
  measurementVersion += 1;
  renderGraph({ allowBeforeReady: true, reason: "initialize" });
  mapPhase = "ready";
  if (pendingViewState) {
    const { mode, id } = pendingViewState;
    pendingViewState = null;
    if (mode !== viewMode || id !== selectedPrincipleId) applyViewState(mode, id);
  }
}

document.fonts?.addEventListener("loadingdone", () => {
  if (mapPhase !== "ready" || fontRefreshQueued) return;
  fontRefreshQueued = true;
  requestAnimationFrame(() => {
    fontRefreshQueued = false;
    measurementVersion += 1;
    renderGraph({ reason: "font-loadingdone" });
  });
});

initializeMap();
}

let mapBooted = false;
window.addEventListener("message", (event) => {
  if (event.source !== window.parent || event.data?.type !== "summer-quest-principles-copy") return;
  if (mapBooted || !event.data.diagram) return;
  mapBooted = true;
  bootPrinciplesMap(event.data.diagram);
});

window.parent.postMessage({ type: "summer-quest-principles-copy-request" }, "*");
