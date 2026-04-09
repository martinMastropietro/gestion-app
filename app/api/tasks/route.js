import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tasks:", error.message);
    return NextResponse.json({ error: "Could not fetch tasks" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request) {
  const { title } = await request.json();

  if (!title || title.trim() === "") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({ title: title.trim() })
    .select()
    .single();

  if (error) {
    console.error("Error creating task:", error.message);
    return NextResponse.json({ error: "Could not create task" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
