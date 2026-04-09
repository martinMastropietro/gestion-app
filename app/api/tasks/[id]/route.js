import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { done } = await request.json();

  const { data, error } = await supabase
    .from("tasks")
    .update({ done })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating task:", error.message);
    return NextResponse.json({ error: "Could not update task" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_, { params }) {
  const { id } = await params;

  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    console.error("Error deleting task:", error.message);
    return NextResponse.json({ error: "Could not delete task" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
