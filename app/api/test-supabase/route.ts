import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: "Supabase not configured",
        message: "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables",
        missing: {
          supabaseUrl: !process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseKey: !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      }, { status: 500 });
    }

    // Test Supabase connection
    const { data, error } = await supabase
      .from('candidates')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        message: "Supabase connection failed. Please check your environment variables and database setup.",
        details: {
          code: error.code,
          hint: error.hint,
          details: error.details
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection successful!",
      data: {
        connection: "OK",
        timestamp: new Date().toISOString(),
        environment: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing",
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing"
        }
      }
    });

  } catch (error) {
    console.error("Supabase test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Failed to connect to Supabase"
    }, { status: 500 });
  }
}
