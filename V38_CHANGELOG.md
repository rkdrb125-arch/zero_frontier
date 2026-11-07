# ZERO FRONTIER v38

- Actual combat pointer ownership: aim pointer type is explicitly tracked, keyboard-F and fire-button state remain independent when pointer capture ends, mouse aim release no longer incorrectly cancels keyboard fire, and cover returns when both inputs are released.
- Reset input ownership on pause and focus loss; mouse hover aim is disabled while paused/inactive.
- Pause state telemetry and event-driven diagnostics; v38 JSON includes event order, owner conflicts, reload regression, and event metadata.
- Reload progress continues to use the actual combat reload timing via the existing v33 observer; skill timers continue to use combatTime (which stops while paused).
- Low-cost diagnostics: only refreshes on events while panel is visible, instead of adding another polling interval.
- All weapon damage, reload durations, cooldowns, stages, bosses, save formats, and world reference documents preserved.
- Actual device/browser gameplay not executed in this build.
