import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri: string;
}

// Create JWT for Google Service Account
async function createJWT(sa: ServiceAccountKey): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/drive",
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const unsignedToken = `${encode(header)}.${encode(claims)}`;

  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const keyBytes = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${unsignedToken}.${sig}`;
}

async function getAccessToken(sa: ServiceAccountKey): Promise<string> {
  const jwt = await createJWT(sa);
  const resp = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

const DRIVE_CONFIG_ERROR_PREFIX = "DRIVE_CONFIGURATION_ERROR:";

function mapDriveErrorMessage(rawError: string): string {
  if (rawError.includes("storageQuotaExceeded")) {
    return `${DRIVE_CONFIG_ERROR_PREFIX} Service Account cannot upload to personal Google Drive storage. Configure GOOGLE_DRIVE_ROOT_FOLDER_ID as a folder inside a Shared Drive and add the Service Account as Content Manager/Manager.`;
  }

  return rawError;
}

interface DriveFolderMetadata {
  id: string;
  name: string;
  mimeType: string;
  driveId?: string;
  trashed?: boolean;
}

async function getFolderMetadata(accessToken: string, folderId: string): Promise<DriveFolderMetadata> {
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType,driveId,trashed&supportsAllDrives=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await resp.json();
  if (!resp.ok) throw new Error(mapDriveErrorMessage(`Root folder lookup error: ${JSON.stringify(data)}`));
  return data;
}

function validateRootFolder(metadata: DriveFolderMetadata) {
  if (metadata.trashed) {
    throw new Error(`${DRIVE_CONFIG_ERROR_PREFIX} Configured Google Drive root folder is in trash.`);
  }

  if (metadata.mimeType !== "application/vnd.google-apps.folder") {
    throw new Error(`${DRIVE_CONFIG_ERROR_PREFIX} GOOGLE_DRIVE_ROOT_FOLDER_ID must be a folder ID.`);
  }

  if (!metadata.driveId) {
    throw new Error(
      `${DRIVE_CONFIG_ERROR_PREFIX} Root folder is not inside a Shared Drive. Service Accounts require Shared Drive for uploads.`
    );
  }
}

// Google Drive API helpers - all with supportsAllDrives for shared drive support
async function createFolder(
  accessToken: string,
  name: string,
  parentId: string
): Promise<string> {
  const resp = await fetch(
    "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      }),
    }
  );
  const data = await resp.json();
  if (!resp.ok) throw new Error(mapDriveErrorMessage(`Create folder error: ${JSON.stringify(data)}`));
  return data.id;
}

async function findFolder(
  accessToken: string,
  name: string,
  parentId: string,
  driveId?: string
): Promise<string | null> {
  const q = `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const driveParams = driveId
    ? `&corpora=drive&driveId=${encodeURIComponent(driveId)}&includeItemsFromAllDrives=true`
    : "&corpora=allDrives&includeItemsFromAllDrives=true";

  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&supportsAllDrives=true${driveParams}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await resp.json();
  if (!resp.ok) throw new Error(mapDriveErrorMessage(`Find folder error: ${JSON.stringify(data)}`));
  return data.files?.[0]?.id || null;
}

async function setPublicPermission(accessToken: string, fileId: string) {
  await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "reader", type: "anyone" }),
    }
  );
}

async function uploadFileResumable(
  accessToken: string,
  fileBytes: Uint8Array,
  fileName: string,
  parentId: string,
  mimeType: string
): Promise<{ id: string; size: string }> {
  const initResp = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,size&supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": mimeType,
        "X-Upload-Content-Length": String(fileBytes.length),
      },
      body: JSON.stringify({ name: fileName, parents: [parentId] }),
    }
  );

  if (!initResp.ok) {
    const err = await initResp.text();
    throw new Error(mapDriveErrorMessage(`Resumable init error: ${err}`));
  }

  const uploadUri = initResp.headers.get("Location");
  if (!uploadUri) throw new Error("No upload URI returned");

  const uploadResp = await fetch(uploadUri, {
    method: "PUT",
    headers: {
      "Content-Length": String(fileBytes.length),
      "Content-Type": mimeType,
    },
    body: fileBytes,
  });

  const data = await uploadResp.json();
  if (!uploadResp.ok) throw new Error(mapDriveErrorMessage(`Resumable upload error: ${JSON.stringify(data)}`));
  return { id: data.id, size: data.size || String(fileBytes.length) };
}

async function uploadFileMultipart(
  accessToken: string,
  fileBytes: Uint8Array,
  fileName: string,
  parentId: string,
  mimeType: string
): Promise<{ id: string; size: string }> {
  const metadata = JSON.stringify({ name: fileName, parents: [parentId] });
  const boundary = "-------314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metaPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${metadata}`;
  const filePart = `${delimiter}Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`;

  const base64File = btoa(String.fromCharCode(...fileBytes));
  const body = `${metaPart}${filePart}${base64File}${closeDelimiter}`;

  const resp = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,size&supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary.replace(/^-+/, "")}`,
      },
      body,
    }
  );
  const data = await resp.json();
  if (!resp.ok) throw new Error(mapDriveErrorMessage(`Upload error: ${JSON.stringify(data)}`));
  return { id: data.id, size: data.size || "0" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const saJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!saJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not configured");

    const rootFolderId = Deno.env.get("GOOGLE_DRIVE_ROOT_FOLDER_ID");
    if (!rootFolderId) throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    const { data: isTeam } = await supabase.rpc("is_team_member", { _user_id: userId });
    if (!isTeam) {
      return new Response(JSON.stringify({ error: "Forbidden: team members only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sa: ServiceAccountKey = JSON.parse(saJson);
    const accessToken = await getAccessToken(sa);

    const rootMetadata = await getFolderMetadata(accessToken, rootFolderId);
    validateRootFolder(rootMetadata);
    const sharedDriveId = rootMetadata.driveId as string;

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ACTION: create-client-folder
    if (action === "create-client-folder") {
      const { client_user_id, folder_name } = await req.json();

      const { data: existing } = await supabase
        .from("drive_folders")
        .select("drive_folder_id")
        .eq("user_id", client_user_id)
        .eq("folder_type", "client")
        .maybeSingle();

      if (existing?.drive_folder_id) {
        return new Response(JSON.stringify({ folder_id: existing.drive_folder_id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const driveFolderId = await createFolder(accessToken, folder_name, rootFolderId);

      await supabase.from("drive_folders").insert({
        user_id: client_user_id,
        folder_name,
        drive_folder_id: driveFolderId,
        parent_folder_id: rootFolderId,
        folder_type: "client",
      });

      return new Response(JSON.stringify({ folder_id: driveFolderId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: upload
    if (action === "upload") {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const clientUserId = formData.get("client_user_id") as string;
      const videoTitle = formData.get("title") as string;
      const taskId = formData.get("task_id") as string | null;

      if (!file || !clientUserId || !videoTitle) {
        return new Response(JSON.stringify({ error: "Missing file, client_user_id, or title" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: logEntry } = await supabase
        .from("upload_logs")
        .insert({ user_id: clientUserId, file_name: file.name, status: "uploading" })
        .select("id")
        .single();

      try {
        let clientFolderId: string;
        const { data: clientFolder } = await supabase
          .from("drive_folders")
          .select("drive_folder_id")
          .eq("user_id", clientUserId)
          .eq("folder_type", "client")
          .maybeSingle();

        if (clientFolder?.drive_folder_id) {
          clientFolderId = clientFolder.drive_folder_id;
        } else {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, youtube_channel")
            .eq("id", clientUserId)
            .single();

          const folderName = (profile?.youtube_channel || profile?.name || clientUserId)
            .replace(/[^a-zA-Z0-9_\-\s]/g, "")
            .replace(/\s+/g, "_");

          clientFolderId = await createFolder(accessToken, folderName, rootFolderId);

          await supabase.from("drive_folders").insert({
            user_id: clientUserId,
            folder_name: folderName,
            drive_folder_id: clientFolderId,
            parent_folder_id: rootFolderId,
            folder_type: "client",
          });
        }

        const monthKey = new Date().toISOString().slice(0, 7);
        let monthFolderId = await findFolder(accessToken, monthKey, clientFolderId);

        if (!monthFolderId) {
          monthFolderId = await createFolder(accessToken, monthKey, clientFolderId);

          await supabase.from("drive_folders").insert({
            user_id: clientUserId,
            folder_name: monthKey,
            drive_folder_id: monthFolderId,
            parent_folder_id: clientFolderId,
            folder_type: "month",
          });
        }

        const fileBytes = new Uint8Array(await file.arrayBuffer());
        const mimeType = file.type || "video/mp4";

        let result;
        if (fileBytes.length > 5 * 1024 * 1024) {
          result = await uploadFileResumable(accessToken, fileBytes, file.name, monthFolderId, mimeType);
        } else {
          result = await uploadFileMultipart(accessToken, fileBytes, file.name, monthFolderId, mimeType);
        }

        await setPublicPermission(accessToken, result.id);

        const driveLink = `https://drive.google.com/file/d/${result.id}/view`;
        const downloadLink = `https://drive.google.com/uc?export=download&id=${result.id}`;

        const { data: video, error: videoError } = await supabase
          .from("videos")
          .insert({
            user_id: clientUserId,
            title: videoTitle,
            drive_link: driveLink,
            drive_file_id: result.id,
            file_name: file.name,
            file_size: parseInt(result.size),
            folder_id: monthFolderId,
            status: "new",
          })
          .select("id")
          .single();

        if (videoError) throw videoError;

        if (taskId) {
          await supabase
            .from("tasks")
            .update({
              status: "completed",
              video_id: video.id,
              completed_by: userId,
              completed_at: new Date().toISOString(),
            })
            .eq("id", taskId);

          await supabase.from("production_logs").insert({
            task_id: taskId,
            user_id: clientUserId,
            editor_id: userId,
            video_id: video.id,
            action: "delivered",
          });
        }

        if (logEntry?.id) {
          await supabase
            .from("upload_logs")
            .update({ status: "completed" })
            .eq("id", logEntry.id);
        }

        return new Response(
          JSON.stringify({
            video_id: video.id,
            drive_file_id: result.id,
            drive_link: driveLink,
            download_link: downloadLink,
            file_size: result.size,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (uploadError: unknown) {
        if (logEntry?.id) {
          const errMsg = uploadError instanceof Error ? uploadError.message : "Unknown error";
          await supabase
            .from("upload_logs")
            .update({ status: "failed", error_message: errMsg })
            .eq("id", logEntry.id);
        }
        throw uploadError;
      }
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Google Drive function error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
