import { NextRequest } from "next/server";
import { removeUser } from "../../../../lib/kv";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  try {
    const fid = parseInt(params.fid);
    
    if (isNaN(fid)) {
      return Response.json(
        { success: false, error: "Invalid FID" },
        { status: 400 }
      );
    }
    
    await removeUser(fid);
    
    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return Response.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
} 