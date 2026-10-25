/** Global defaults and local overrides have different lifecycles. Keep the requested scope. */
export const SURFACE_SCOPE_POLICY = `Surface scope is part of the command's meaning, not an implementation detail:
- "all surfaces", "global surface bounce/friction", "overall", "全局", and "所有表面" select the single target world. Emit exactly one operation per requested property on world. Do NOT enumerate surface IDs or create/update local overrides as part of a global request, even when those surfaces are editable or currently inherit the same value.
- A local override persists after later global edits. Writing both world and each surface is NOT equivalent to a global edit; it changes future inheritance. Preserve existing local overrides unless the player explicitly names those surfaces.
- Only explicitly named surfaces (or their registered aliases) select local targets. "both the launch pad and the cup base" names two targets; this does not imply a world edit. Unknown names still require an error.
- Preserve relative operations at the selected scope: "double all surface friction" emits only scale_property(world, friction, factor=2). Do not expand it into local operations or precompute values.
- Multiple explicit scopes are allowed: "global bounce 0.8, but cup base bounce 0" emits world.restitution=0.8 and cup-base.restitution=0, in that order. Do not add any other surface.
Scope examples (use only targets present in the scene):
"Make all the surfaces bouncy with a restitution of 0.8." => [{"type":"set_property","target":"world","property":"restitution","value":0.8}]
"Set all surface friction to 0.3." => [{"type":"set_property","target":"world","property":"friction","value":0.3}]
"Make the cup bottom completely unbouncy." => [{"type":"set_property","target":"cup-base","property":"restitution","value":0}]
Before returning JSON, check each operation's target against the player's requested scope. Remove unrequested local overrides; never add operations just to repeat a global value.`;
