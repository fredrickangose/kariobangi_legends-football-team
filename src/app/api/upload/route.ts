import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import {
  verifyFullAdminToken,
  verifyNewsEditorToken,
} from "@/lib/admin-auth";
import { MEDIA_UPLOAD_RULES, VIDEO_UPLOAD_RULES } from "@/lib/uploaded-media";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase upload configuration is missing.");
}

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

export async function POST(request: Request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Supabase upload configuration is missing. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file");
    const folder = String(formData.get("folder") || "gallery");
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("kariobangi_admin")?.value;

    if (folder === "news") {
      if (!verifyNewsEditorToken(adminToken)) {
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized. Sign in with a press or admin account to upload news images.",
          },
          { status: 401 }
        );
      }
    } else if (!verifyFullAdminToken(adminToken)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Admin sign-in is required for this upload.",
        },
        { status: 401 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "No file was received.",
        },
        { status: 400 }
      );
    }

    const isVideoUpload =
      folder === "highlights" || String(formData.get("mediaType") || "") === "video";

    if (isVideoUpload) {
      if (!file.type.startsWith("video/")) {
        return NextResponse.json(
          {
            success: false,
            error: "Only video files are allowed for highlights (MP4, MOV, or WEBM).",
          },
          { status: 400 }
        );
      }

      if (file.size > VIDEO_UPLOAD_RULES.maxFileSizeBytes) {
        return NextResponse.json(
          {
            success: false,
            error: `Video is too large. Maximum size is ${VIDEO_UPLOAD_RULES.maxFileSizeLabel}.`,
          },
          { status: 400 }
        );
      }
    } else {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          {
            success: false,
            error: "Only image files are allowed.",
          },
          { status: 400 }
        );
      }

      if (file.size > MEDIA_UPLOAD_RULES.maxFileSizeBytes) {
        return NextResponse.json(
          {
            success: false,
            error: `Image is too large. Maximum size is ${MEDIA_UPLOAD_RULES.maxFileSizeLabel}.`,
          },
          { status: 400 }
        );
      }
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || (isVideoUpload ? "mp4" : "jpg");

    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");

    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const filePath = `${safeFolder}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);

      return NextResponse.json(
        {
          success: false,
          error: uploadError.message,
        },
        { status: 500 }
      );
    }

    const { data } = supabase.storage
      .from("gallery")
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: data.publicUrl,
      path: filePath,
    });
  } catch (error) {
    console.error("Upload API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected upload error.",
      },
      { status: 500 }
    );
  }
}