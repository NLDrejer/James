import { getPropertySearchProvider } from "@/lib/data-sources/provider-registry";
import { normalizeDanishName } from "@/lib/search/normalize-danish-name";
import { checkSearchApiRateLimit } from "@/lib/search/rate-limit";
import { createSearchAuditEntry, searchAuditStore } from "@/lib/search/search-audit-log";
import { searchPropertiesByName } from "@/lib/search/search-service";
import { getSessionUsernameFromCookieHeader, isPropertySearchAuthRequired } from "@/lib/session";

const requesterIpFrom = (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "unknown";
};

const toHttpStatus = (status: string) => {
  if (status === "invalid" || status === "blocked") {
    return 400;
  }

  return 200;
};

const jsonResponse = (body: unknown, status: number, headers?: HeadersInit) =>
  Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      ...headers,
    },
  });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const normalizedQuery = normalizeDanishName(query);
  const requesterIp = requesterIpFrom(request);
  const userAgent = request.headers.get("user-agent");
  const requesterSessionId = getSessionUsernameFromCookieHeader(request.headers.get("cookie"));

  if (isPropertySearchAuthRequired() && !requesterSessionId) {
    return jsonResponse(
      {
        status: "unauthorized",
        message: "Authentication is required for property search.",
        results: [],
      },
      401,
    );
  }

  const rateLimit = checkSearchApiRateLimit({ key: requesterSessionId ?? requesterIp });

  if (!rateLimit.allowed) {
    searchAuditStore.record(
      createSearchAuditEntry({
        query,
        normalizedQuery,
        requesterSessionId,
        requesterIp,
        userAgent,
        status: "rate_limited",
        resultCount: 0,
        blockedReason: "rate_limit_exceeded",
      }),
    );

    return jsonResponse(
      {
        status: "rate_limited",
        normalizedQuery,
        results: [],
      },
      429,
      { "retry-after": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) },
    );
  }

  const searchResponse = await searchPropertiesByName({
    query,
    provider: getPropertySearchProvider("mock"),
  });

  searchAuditStore.record(
    createSearchAuditEntry({
      query,
      normalizedQuery: searchResponse.normalizedQuery,
      requesterSessionId,
      requesterIp,
      userAgent,
      status: searchResponse.status,
      resultCount: searchResponse.results.length,
      blockedReason: searchResponse.reason ?? null,
    }),
  );

  const safeResponse = {
    status: searchResponse.status,
    normalizedQuery: searchResponse.normalizedQuery,
    reason: searchResponse.reason,
    results: searchResponse.results,
  };

  return jsonResponse(safeResponse, toHttpStatus(searchResponse.status));
}
