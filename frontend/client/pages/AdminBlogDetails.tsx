import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { getApiUrl } from "@/lib/config";
import { fetchWithAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ChevronLeft, Edit3, Trash2 } from "lucide-react";
import AdminBack from "@/components/ui/AdminBack";

type BlogImage = { id: number; image?: string | null; caption?: string | null };
type BlogPost = { id: number; title: string; slug?: string; content?: string | null; images?: BlogImage[]; links?: { id?: number; url?: string; text?: string }[]; created_at?: string };

export default function AdminBlogDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = React.useState<BlogPost | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(getApiUrl(`/api/blog/posts/${id}/`), { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        setPost(data);
      } catch (e) {
        toast({ title: "Error", description: "Failed to load article." });
      } finally { setLoading(false); }
    })();
  }, [id]);

  const onEditNavigate = () => {
    if (!post) return;
    const identifier = post.slug || post.id;
    navigate("/admin/blog/new", { state: { initial: post, postId: identifier } });
  };

  const onDelete = async () => {
    if (!post) return;
    try {
      const identifier = post.slug || post.id;
      const res = await fetchWithAuth(getApiUrl(`/api/blog/posts/${identifier}/`), { method: "DELETE" });
      if (!res.ok) throw new Error(String(res.status));
      toast({ title: "Deleted", description: "Article deleted." });
      navigate("/admin/blog", { replace: true });
    } catch {
      toast({ title: "Error", description: "Failed to delete." });
    }
  };

  if (loading) return <div className="p-8 text-gray-text">Loading...</div>;
  if (!post) return (
    <div className="p-8">
      <div className="mb-4">No article selected.</div>
      <AdminBack variant="admin" />
    </div>
  );

  const media = Array.isArray(post.images) ? post.images : [];
  const mainImage = media[0]?.image || "/project-placeholder.svg";

  return (
    <div className="relative min-h-screen bg-white text-dark">
      <div className="container mx-auto max-w-full px-4 pt-0 pb-10">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <AdminBack variant="admin" />
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors" aria-label="Actions"><MoreHorizontal className="w-5 h-5 text-dark" /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end" onClick={(e) => e.stopPropagation()} className="bg-white border border-gray-border rounded-2xl shadow-lg p-2">
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onEditNavigate(); }} className="flex items-center gap-2"><Edit3 className="w-4 h-4 text-orange"/>Edit</DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onDelete(); }} className="flex items-center gap-2"><Trash2 className="w-4 h-4 text-red-600"/>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-2">
            <h1 className="font-lufga font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight">
              <span className="block text-dark">{post.title}</span>
              <span className="block h-1 mt-2 w-24 bg-orange rounded-full" aria-hidden="true" />
              {post.created_at ? <div className="font-lufga text-sm font-semibold text-dark mt-2">{new Date(post.created_at).toLocaleDateString()}</div> : null}
            </h1>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-gray-border shadow-sm p-6">
          {media.length > 0 ? (
            <div className="grid lg:grid-cols-[4fr,1fr] gap-4 items-start">
              <div className="relative rounded-3xl overflow-hidden border border-gray-border bg-gray-bg">
                <motion.img key={media[0].image} loading="lazy" decoding="async" src={media[0].image} alt={post.title} className="w-full h-[24rem] lg:h-[36rem] object-contain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: "easeOut" }} onError={(e) => { const img = e.currentTarget as HTMLImageElement; if (img.src.includes("project-placeholder.svg")) return; img.onerror = null; img.src = "/project-placeholder.svg"; }} />
              </div>

              <div className="hidden lg:block max-h-[36rem] overflow-y-auto pr-1">
                <div className="flex flex-col gap-3">
                  {media.map((m, i) => (
                    <button key={m.id} onClick={() => { /* no-op */ }} className={"relative w-full h-20 rounded-xl overflow-hidden border bg-white transition-colors"} aria-pressed={false}>
                      <img loading="lazy" decoding="async" src={m.image} alt={`${post.title} ${i + 1}`} className={"w-full h-full object-contain"} onError={(e) => { const img = e.currentTarget as HTMLImageElement; if (img.src.includes("project-placeholder.svg")) return; img.onerror = null; img.src = "/project-placeholder.svg"; }} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 lg:hidden col-span-full">
                {media.map((m, i) => (
                  <button key={m.id} onClick={() => { /* no-op */ }} className={"relative w-24 h-16 rounded-xl overflow-hidden border"} aria-pressed={false}>
                    <img loading="lazy" decoding="async" src={m.image} alt={`${post.title} ${i + 1}`} className={"w-full h-full object-contain bg-white"} onError={(e) => { const img = e.currentTarget as HTMLImageElement; if (img.src.includes("project-placeholder.svg")) return; img.onerror = null; img.src = "/project-placeholder.svg"; }} />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 prose max-w-none">
            {post.content && post.content.includes("<") ? (
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            ) : (
              <div className="whitespace-pre-wrap break-words break-all text-gray-text" style={{ whiteSpace: "pre-wrap", wordBreak: 'break-word', overflowWrap: 'break-word' }}>{post.content}</div>
            )}
          </div>

          {post.links && post.links.length > 0 ? (
            <div className="mt-6">
              <h3 className="font-lufga text-xl font-bold text-orange mb-2">Liens</h3>
              <div className="flex gap-3">
                {post.links.map((l) => (
                  <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="text-orange underline">{l.text || l.url}</a>
                ))}
              </div>
            </div>
          ) : null}

        </div>
      </div>
    </div>
  );
}
