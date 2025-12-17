import "@testing-library/jest-dom";

// Polyfill for structuredClone in test environment
global.structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj));
