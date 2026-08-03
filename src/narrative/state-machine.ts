export type NarrativeState = "waiting-for-intent" | "waiting-for-player-input" | "narrating" | "turn-ready" | "error";
export type NarrativeEvent = { type: "intent-selected" } | { type: "player-submitted" } | { type: "narration-finished" } | { type: "narration-failed" } | { type: "next-turn" };

const transitions: Record<NarrativeState, Partial<Record<NarrativeEvent["type"], NarrativeState>>> = {
  "waiting-for-intent": { "intent-selected": "waiting-for-player-input" },
  "waiting-for-player-input": { "player-submitted": "narrating" },
  narrating: { "narration-finished": "turn-ready", "narration-failed": "error" },
  "turn-ready": { "next-turn": "waiting-for-intent" },
  error: { "next-turn": "waiting-for-intent" },
};

export class NarrativeStateMachine {
  state: NarrativeState = "waiting-for-intent";

  dispatch(event: NarrativeEvent): NarrativeState {
    const next = transitions[this.state][event.type];
    if (!next) throw new Error(`Invalid narrative transition: ${this.state} -> ${event.type}`);
    this.state = next;
    return this.state;
  }
}
