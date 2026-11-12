
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getAdminDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase server environment variables are missing.");
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function isAuthorizedAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) return false;

  const cookieStore = await cookies();

  const authClient = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Cookie updates may not be available in this request context.
        }
      },
    },
  });

  const { data, error } = await authClient.auth.getUser();

  if (error || !data.user) return false;

  return (
    data.user.email?.toLowerCase() ===
    "officialgamoraonline@gmail.com"
  );
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: "Unauthorized. Admin access is required.",
    },
    { status: 403 }
  );
}

export async function GET() {
  try {
    if (!(await isAuthorizedAdmin())) {
      return unauthorizedResponse();
    }

    const db = getAdminDatabase();

    const { data, error } = await db
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      expenses: data || [],
    });
  } catch (error) {
    console.error("Expenses GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load expenses.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAuthorizedAdmin())) {
      return unauthorizedResponse();
    }

    const body = await request.json();

    const title = String(body.title || "").trim();
    const amount = Number(body.amount);
    const category =
      String(body.category || "Other").trim() || "Other";
    const expenseDate = String(
      body.expense_date || new Date().toISOString().slice(0, 10)
    );
    const notes = String(body.notes || "").trim();

    if (!title || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Expense title and valid amount are required.",
        },
        { status: 400 }
      );
    }

    const db = getAdminDatabase();

    const { data, error } = await db
      .from("expenses")
      .insert({
        title,
        amount,
        category,
        expense_date: expenseDate,
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      expense: data,
    });
    } catch (error: any) {
    console.error("Expenses POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown database error",
        code: error?.code || null,
        details: error?.details || null,
        hint: error?.hint || null,
      },
      { status: 500 }
    );
  }

export async function PUT(request: Request) {
  try {
    if (!(await isAuthorizedAdmin())) {
      return unauthorizedResponse();
    }

    const body = await request.json();

    const id = Number(body.id);
    const title = String(body.title || "").trim();
    const amount = Number(body.amount);
    const category =
      String(body.category || "Other").trim() || "Other";
    const expenseDate = String(body.expense_date || "");
    const notes = String(body.notes || "").trim();

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !title ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !expenseDate
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid expense details are required.",
        },
        { status: 400 }
      );
    }

    const db = getAdminDatabase();

    const { data, error } = await db
      .from("expenses")
      .update({
        title,
        amount,
        category,
        expense_date: expenseDate,
        notes,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      expense: data,
    });
  } catch (error) {
    console.error("Expenses PUT error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update expense.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await isAuthorizedAdmin())) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid expense ID is required.",
        },
        { status: 400 }
      );
    }

    const db = getAdminDatabase();

    const { error } = await db
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Expenses DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete expense.",
      },
      { status: 500 }
    );
  }
}
