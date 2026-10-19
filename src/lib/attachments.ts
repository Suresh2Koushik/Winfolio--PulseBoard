import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { toast } from "sonner";

/** Opens a win's attachment: an uploaded file in Storage, or an imported http(s) link. */
export async function openAttachment(value: string) {
  // Open the tab synchronously so pop-up blockers allow it, then point it at the file.
  // ('noopener' would make window.open return null, so detach the opener manually.)
  const tab = window.open("", "_blank");
  if (tab) tab.opener = null;
  try {
    let url: string;
    if (value.startsWith("activities/")) {
      url = await getDownloadURL(ref(storage, value));
    } else {
      // Imported rows may carry an external link; only allow http(s).
      const parsed = new URL(value);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("Unsupported link");
      url = parsed.toString();
    }
    if (tab) tab.location.href = url;
    else window.open(url, "_blank", "noopener,noreferrer");
  } catch (error) {
    tab?.close();
    toast.error("Failed to access attachment");
    console.error("Download error:", error);
  }
}
