import "@testing-library/jest-dom";

// JSDOM has no native dialog implementation. Real-browser tests verify focus trapping.
HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };

afterEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});
