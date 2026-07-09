import "@testing-library/jest-dom/vitest";

// jsdom에는 ResizeObserver가 없음 — Radix Popper(Tooltip/Popover/Select 등)가 의존
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
