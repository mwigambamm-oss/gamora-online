import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "officialgamoraonline@gmail.com";

async function getAuthorizedAdmin() {
  const cookieStore = await cookies();

  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(values) {
          try {
            values.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Cookies may be managed by the proxy.
          }
        },
      },
    }
  );

  const { data, error } = await authClient.auth.getUser();

  if (
    error ||
    !data.user ||
    data.user.email?.toLowerCase() !== ADMIN_EMAIL
  ) {
    return null;
  }

  return data.user;
}

function databaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Server database configuration is missing.");
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET() {
  try {
    const admin = await getAuthorizedAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Only the authorized Gamora administrator can view audit logs." },
        { status: 403 }
      );
    }

    const { data, error } = await databaseClient()
      .from("audit_logs")
      .select(
        "id,admin_user_id,admin_name,action,table_name,record_id,old_values,new_values,ip_address,user_agent,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Audit log read failed:", error);
      return NextResponse.json(
        { error: "Unable to load audit history. Check the audit_logs table in Supabase." },
        { status: 500 }
      );
    }

    return NextResponse.json({ logs: data ?? [] });
  } catch (error) {
    console.error("Audit log GET failed:", error);

    return NextResponse.json(
      { error: "Unable to load audit history." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAuthorizedAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Only the authorized Gamora administrator can record audit events." },
        { status: 403 }
      );
    }

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "A valid JSON body is required." },
        { status: 400 }
      );
    }

    const action =
      typeof body.action === "string" ? body.action.trim() : "";

    if (!action || action.length > 200) {
      return NextResponse.json(
        { error: "Action is required and must not exceed 200 characters." },
        { status: 400 }
      );
    }

    const optionalText = (
      value: unknown,
      maxLength: number
    ): string | null => {
      if (typeof value !== "string") return null;
      const result = value.trim();
      return result ? result.slice(0, maxLength) : null;
    };

    const requestHeaders = await headers();
    const forwardedFor = requestHeaders.get("x-forwarded-for");
    const ipAddress =
      forwardedFor?.split(",")[0]?.trim() ||
      requestHeaders.get("x-real-ip") ||
      null;

    const record = {
      admin_user_id: admin.id,
      admin_name:
        admin.user_metadata?.full_name ||
        admin.user_metadata?.name ||
        admin.email ||
        "Administrator",
      action,
      table_name: optionalText(body.table_name, 100),
      record_id: optionalText(
        typeof body.record_id === "string" ||
          typeof body.record_id === "number"
          ? String(body.record_id)
          : null,
        150
      ),
      old_values:
        body.old_values &&
        typeof body.old_values === "object" &&
        !Array.isArray(body.old_values)
          ? body.old_values
          : null,
      new_values:
        body.new_values &&
        typeof body.new_values === "object" &&
        !Array.isArray(body.new_values)
          ? body.new_values
          : null,
      ip_address: ipAddress?.slice(0, 100) ?? null,
      user_agent: requestHeaders.get("user-agent")?.slice(0, 500) ?? null,
    };

    const { data, error } = await databaseClient()
      .from("audit_logs")
      .insert(record)
      .select(
        "id,admin_user_id,admin_name,action,table_name,record_id,old_values,new_values,created_at"
      )
      .single();

    if (error) {
      console.error("Audit log insert failed:", error);

      return NextResponse.json(
        { error: "Unable to save the audit event. Check the audit_logs table in Supabase." },
        { status: 500 }
      );
    }

    return NextResponse.json({ log: data }, { status: 201 });
  } catch (error) {
    console.error("Audit log POST failed:", error);

    return NextResponse.json(
      { error: "Unable to record the audit event." },
      { status: 500 }
    );
  }
}
