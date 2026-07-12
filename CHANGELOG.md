# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- TypeScript type definitions (`types/orphe-insole.d.ts`) covering `OrpheInsole`, callbacks, parser output, and global script-tag usage. STEP_ANALYSIS-family callbacks are marked `@deprecated` (not called by current INSOLE firmware).

### Fixed

- Normalize `setup()` options so partial or empty options objects do not throw and interpolation defaults are preserved.
- Handle `serial_number` wraparound from `65535` to `0` without false `lostData()` callbacks, including after `clear()`.
