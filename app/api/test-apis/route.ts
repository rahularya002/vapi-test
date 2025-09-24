import { NextRequest, NextResponse } from "next/server";
import { callQueueApi, candidatesApi, configApi } from "@/lib/supabase";

interface TestResult {
  name: string;
  status: string;
  details: string;
}

export async function GET() {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      tests: [] as TestResult[]
    };

    // Test 1: Check if Supabase is configured
    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    results.tests.push({
      name: "Supabase Configuration",
      status: hasSupabase ? "✅ Configured" : "⚠️ Using Fallback Storage",
      details: hasSupabase ? "Supabase environment variables found" : "Using in-memory fallback storage"
    });

    // Test 2: Test candidates API
    try {
      const candidates = await candidatesApi.getAll();
      results.tests.push({
        name: "Candidates API",
        status: "✅ Working",
        details: `Found ${candidates.length} candidates`
      });
    } catch (error) {
      results.tests.push({
        name: "Candidates API",
        status: "❌ Error",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }

    // Test 3: Test call queue API
    try {
      const queue = await callQueueApi.getQueue();
      results.tests.push({
        name: "Call Queue API",
        status: "✅ Working",
        details: `Found ${queue.length} candidates in queue`
      });
    } catch (error) {
      results.tests.push({
        name: "Call Queue API",
        status: "❌ Error",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }

    // Test 4: Test config API
    try {
      const config = await configApi.get();
      results.tests.push({
        name: "Config API",
        status: "✅ Working",
        details: config ? "Configuration found" : "No configuration set"
      });
    } catch (error) {
      results.tests.push({
        name: "Config API",
        status: "❌ Error",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }

    // Test 5: Test adding a candidate
    try {
      const testCandidate = {
        name: "Test Candidate",
        phone: "1234567890",
        email: "test@example.com",
        position: "Test Position",
        status: "pending"
      };
      
      await callQueueApi.addToQueue([testCandidate]);
      results.tests.push({
        name: "Add Candidate",
        status: "✅ Working",
        details: "Successfully added test candidate"
      });
    } catch (error) {
      results.tests.push({
        name: "Add Candidate",
        status: "❌ Error",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }

    const allPassed = results.tests.every(test => test.status.includes("✅"));
    
    return NextResponse.json({
      success: allPassed,
      message: allPassed ? "All APIs working correctly" : "Some APIs have issues",
      results
    });

  } catch (error) {
    console.error("API test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      results: {
        timestamp: new Date().toISOString(),
        tests: []
      }
    }, { status: 500 });
  }
}
