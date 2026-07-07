import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PropertyDetailView } from "@/components/property-search/property-detail-view";
import { mockPropertyProvider } from "@/lib/data-sources/mock-provider";

describe("PropertyDetailView", () => {
  it("renders the fixture property with identifiers, source, and inferred confidence context", async () => {
    const propertyWithLinks = await mockPropertyProvider.getProperty("mock-property-odense-001");
    const html = renderToStaticMarkup(createElement(PropertyDetailView, { propertyWithLinks: propertyWithLinks! }));

    expect(html).toContain("Havnegade 12");
    expect(html).toContain("Odense");
    expect(html).toContain("Demo Matrikel 12a");
    expect(html).toContain("MOCK-DK-ODENSE-001");
    expect(html).toContain("Mock Danish Property Fixtures");
    expect(html).toContain("Inferred link");
    expect(html).toContain("high");
  });
});
