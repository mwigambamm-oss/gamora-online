import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      expenses: data || [],
    });
  } catch (error: any) {
    console.error("Expenses GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title = String(body.title || "").trim();
    const amount = Number(body.amount);
    const category = String(
      body.category || "Other"
    );
    const expenseDate = String(
      body.expense_date ||
        new Date().toISOString().slice(0, 10)
    );
    const notes = String(body.notes || "");

    if (!title || !amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Expense title and valid amount are required.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
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
        error: error.message,
      },
      { status: 500 }
    );
  }
}
