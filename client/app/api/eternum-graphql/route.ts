import { NextRequest, NextResponse } from "next/server";
import { ETERNUM_MARKETPLACE_GRAPHQL } from "../../lib/constants";

/**
 * Proxy for Eternum Torii GraphQL to avoid CORS when fetching from the client.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, variables } = body;
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { errors: [{ message: "Missing or invalid query" }] },
        { status: 400 }
      );
    }
    const res = await fetch(ETERNUM_MARKETPLACE_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: variables ?? undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("[eternum-graphql]", e);
    return NextResponse.json(
      { errors: [{ message: e instanceof Error ? e.message : "Proxy error" }] },
      { status: 500 }
    );
  }
}
