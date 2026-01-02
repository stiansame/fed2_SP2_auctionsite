// header.test.js
import { describe, it, expect, beforeEach } from "vitest";
import { renderHeader } from "../../../components/header.js";

describe("renderHeader (no mocks)", () => {
  beforeEach(() => {
    // Fresh DOM for every test
    document.body.innerHTML = "";
  });

  it("does not throw when #site-header is missing", () => {
    // Arrange
    // (no #site-header in DOM)

    // Act
    const act = () => renderHeader();

    // Assert
    expect(act).not.toThrow();
  });

  it("renders something inside #site-header", () => {
    // Arrange
    document.body.innerHTML = `<header id="site-header"></header>`;
    const header = document.getElementById("site-header");

    // Act
    renderHeader();

    // Assert
    expect(header.innerHTML).not.toBe("");
    expect(header.children.length).toBeGreaterThan(0);
  });

  it("renders Login and Register links in logged-out view", () => {
    // NOTE: This assumes that the default auth state for tests is 'logged out'.
    // Arrange
    document.body.innerHTML = `<header id="site-header"></header>`;
    const header = document.getElementById("site-header");

    // Act
    renderHeader();

    // Assert
    expect(header.innerHTML).toContain('href="#/login"');
    expect(header.innerHTML).toContain("Login");
    expect(header.innerHTML).toContain('href="#/register"');
    expect(header.innerHTML).toContain("Register");
  });

  it("does not show credits badge in logged-out view even if credit is passed", () => {
    // Arrange
    document.body.innerHTML = `<header id="site-header"></header>`;
    const header = document.getElementById("site-header");

    // Act
    renderHeader({ credit: 123 });

    // Assert
    const html = header.innerHTML;
    // In logged-out header we expect no 'Available credits' text
    expect(html.includes("Available credits")).toBe(false);
    expect(html.includes("123")).toBe(false);
  });

  it("overwrites any existing content inside #site-header", () => {
    // Arrange
    document.body.innerHTML = `
      <header id="site-header">
        <p>Old placeholder header</p>
      </header>
    `;
    const header = document.getElementById("site-header");

    // Act
    renderHeader();

    // Assert
    const html = header.innerHTML;
    expect(html).not.toContain("Old placeholder header");
    expect(header.children.length).toBeGreaterThan(0);
  });
});
