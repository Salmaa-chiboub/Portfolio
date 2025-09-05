import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getApiUrl } from "@/lib/config";
import { stripHtml } from "@/lib/utils";

type BlogImage = { id: number; image: string; caption?: string | null };
export type BlogPost = {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: string;
  images: BlogImage[];
  links?: { id: number; url: string; text: string }[];
};

const BUILD_ID = typeof window !== "undefined" && (import.meta as any).hot ? String(Date.now()) : ((import.meta as any).env?.VITE_BUILD_ID as string) || "1";
const addCacheBuster = (u: string) => {
  try {
    const url = new URL(u, window.location.origin);
    url.searchParams.set("v", BUILD_ID);
    return url.toString();
  } catch {
    const sep = u.includes("?") ? "&" : "?";
    return `${u}${sep}v=${BUILD_ID}`;
  }
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric" }).format(d);
};

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [others, setOthers] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) return;
    const listUrl = getApiUrl("/api/blog/posts/");
    setLoading(true);
    fetch(listUrl, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: BlogPost[]) => {
        const sorted = Array.isArray(data)
          ? [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          : [];
        const current = sorted.find((p) => p.slug === slug) || null;
        setBlog(current);
        setOthers(sorted.filter((p) => p.slug !== slug).slice(0, 3));
      })
      .catch(() => {
        setBlog(null);
        setOthers([]);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const heroImg = useMemo(() => (blog?.images && blog.images[0]?.image) || "/project-placeholder.svg", [blog]);

  if (loading) return null;
  if (!blog) return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto max-w-3xl px-4">
        <button onClick={() => navigate(-1)} className="text-orange font-lufga mb-6">Back</button>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-lufga font-bold text-gray-text">Blog not found</h1>
      </div>
    </section>
  );

  return (
    <div className="bg-white">
      <section className="py-12 lg:py-16 bg-white">
        <div className="container mx-auto max-w-3xl px-4">
          <button onClick={() => navigate(-1)} className="text-orange font-lufga mb-6">Back</button>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-lufga font-bold text-gray-text mb-6">{blog.title}</h1>
          <div className="flex items-center space-x-6 mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#FD853A] rounded-full" />
              <span className="text-[#344054] font-inter text-lg">Salma Chiboub</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#FD853A] rounded-full" />
              <span className="text-[#344054] font-inter text-lg">{formatDate(blog.created_at)}</span>
            </div>
          </div>

          <div className="blog-image-frame overflow-hidden mb-8">
            <div className="relative w-full h-[340px] sm:h-[420px] lg:h-[520px] blog-image-frame overflow-hidden">
              <img
                src={addCacheBuster(heroImg)}
                alt={blog.title}
                className="absolute inset-0 w-full h-full object-cover rounded-none"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          <article className="prose max-w-none font-lufga text-gray-text text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: blog.content }} />
        </div>
      </section>

      {others.length > 0 && (
        <section className="py-12 lg:py-16 bg-white">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-lufga font-bold text-gray-text">Other blog posts</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-10">
              {others.map((post) => {
                const img = (post.images && post.images[0]?.image) || "/project-placeholder.svg";
                return (
                  <article key={post.id} className="flex flex-col space-y-6">
                    <button
                      onClick={() => navigate(`/blog/${post.slug}`)}
                      className="group cursor-pointer focus:outline-none focus:ring-4 focus:ring-orange/30 blog-image-frame overflow-hidden transition-all duration-300"
                      aria-label={`Read blog post: ${post.title}`}
                    >
                      <div className="relative group-hover:shadow-2xl transition-shadow duration-300 blog-image-frame overflow-hidden">
                        <div className="relative w-full h-[260px] shadow-[0_4px_55px_0_rgba(0,0,0,0.05)] group-hover:shadow-[0_8px_70px_0_rgba(0,0,0,0.15)] transition-shadow duration-300 blog-image-frame overflow-hidden">
                          <img
                            loading="lazy"
                            decoding="async"
                            src={addCacheBuster(img)}
                            alt={post.title}
                            className="absolute inset-0 w-full h-full object-cover rounded-none"
                          />
                        </div>
                      </div>
                    </button>
                    <h3 className="text-[28px] font-lufga text-[#344054] leading-tight">{post.title}</h3>
                    <p className="text-gray-text font-lufga text-base leading-relaxed whitespace-pre-wrap">{stripHtml(post.content).length > 140 ? `${stripHtml(post.content).slice(0, 140).trim()}…` : stripHtml(post.content)}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
