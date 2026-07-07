import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PropertyCard } from "@/components/property-search/property-card";
import { mockPropertyProvider } from "@/lib/data-sources/mock-provider";
import { searchPropertiesByName } from "@/lib/search/search-service";

describe("PropertyCard", () => {
  it("renders source, confidence, and core property fields for a search result", async () => {
    const response = await searchPropertiesByName({
      query: "Søren Ågård",
      provider: mockPropertyProvider,
    });

    const html = renderToStaticMarkup(createElement(PropertyCard, { result: response.results[0]! }));

    expect(html).toContain("Havnegade 12");
    expect(html).toContain("Odense");
    expect(html).toContain("Demo Matrikel 12a");
    expect(html).toContain("Mock Danish Property Fixtures");
    expect(html).toContain("high");
    expect(html).toContain("/properties/mock-property-odense-001");
  });
});
