// SKRAPERS — Stage 15 (navigation/gameplay IA redesign)
// Leads — organic follow-up threads opened while playing Home, not a
// pre-listed mission log. Exactly two triggers open a new lead (see
// ui/feed.js): (a) correctly flagging a real Skraper account from the
// feed, and (b) discovering — via the Connections panel — that two
// HIGH-signal accounts are linked. Both triggers are independent, not a
// sequential chain, and pursuing a lead further is entirely the player's
// choice; nothing here forces a follow-up. Follows game/reputation.js's
// plain-object-state pattern.

(function () {

const state = {
  leads: [], // { id, trigger, accountIds, discoveredAt, pursued, dismissed }
};
let nextId = 1;

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

// Dedupe key so the same flag or the same connection pair never opens a
// second lead — re-flagging the same account, or revisiting the same
// Connections panel, shouldn't spam the notification feed.
function keyFor(trigger, accountIds) {
  return `${trigger}:${[...accountIds].slice().sort().join(",")}`;
}

function addLead(trigger, accountIds, extra) {
  const key = keyFor(trigger, accountIds);
  if (state.leads.some((l) => l.key === key)) return null;
  const lead = Object.assign(
    {
      id: `lead-${nextId++}`,
      key,
      trigger, // "flag" | "connection"
      accountIds: [...accountIds],
      discoveredAt: Date.now(),
      pursued: false,
      dismissed: false,
    },
    extra || {}
  );
  state.leads.unshift(lead);
  return lead;
}

function markPursued(id) {
  const lead = state.leads.find((l) => l.id === id);
  if (lead) lead.pursued = true;
}

function markDismissed(id) {
  const lead = state.leads.find((l) => l.id === id);
  if (lead) lead.dismissed = true;
}

function openLeadsCount() {
  return state.leads.filter((l) => !l.pursued && !l.dismissed).length;
}

function dump() {
  return { leads: state.leads, nextId };
}

function load(saved) {
  if (saved && Array.isArray(saved.leads)) {
    state.leads = saved.leads;
    nextId = typeof saved.nextId === "number" ? saved.nextId : state.leads.length + 1;
  } else {
    state.leads = [];
    nextId = 1;
  }
}

function reset() {
  state.leads = [];
  nextId = 1;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { state, addLead, markPursued, markDismissed, openLeadsCount, dump, load, reset };
} else {
  window.SKRAPERS_LEADS = { state, addLead, markPursued, markDismissed, openLeadsCount, dump, load, reset };
}

})();
