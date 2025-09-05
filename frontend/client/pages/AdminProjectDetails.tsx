import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import AdminBack from "@/components/ui/AdminBack";
import { getApiUrl } from "@/lib/config";
import { fetchWithAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ChevronLeft, Edit3, Trash2 } from "lucide-react";

type Project = {
  id: number;
  title: string;
  description?: string | null;
  media: { id: number; image?: string | null; order?: number }[];
  skills_list?: { id?: number; name?: string; icon?: string }[];
  links?: { id?: number; url: string; text?: string; order?: number }[];
};

export default function AdminProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = React.useState<Project | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const [links, setLinks] = React.useState<{ id?: number; url: string; text?: string; order?: number }[]>([]);

  React.useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(getApiUrl(`/api/projects/${id}/`), { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        setProject(data);
        setActiveIndex(0);

        // fetch links separately (some serializers may not include links in the main payload)
        try {
          const lr = await fetchWithAuth(getApiUrl(`/api/projects/${id}/links/`), { cache: "no-store" });
          if (lr.ok) {
            const ld = await lr.json();
            setLinks(Array.isArray(ld) ? ld : []);
          }
        } catch (e) {
          // ignore link fetch errors
        }

      } catch (e) {
        toast({ title: "Error", description: "Failed to load project." });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // keep activeIndex in range when media changes
  React.useEffect(() => {
    if (!project) return;
    const len = Array.isArray(project.media) ? project.media.length : 0;
    if (len === 0) setActiveIndex(0);
    else if (activeIndex >= len) setActiveIndex(0);
  }, [project, activeIndex]);

  const onEditNavigate = () => {
    if (!project) return;
    navigate("/admin/projects/new", { state: { initial: project, projectId: project.id } });
  };

  const onDelete = async () => {
    if (!project) return;
    try {
      const res = await fetchWithAuth(getApiUrl(`/api/projects/${project.id}/`), { method: "DELETE" });
      if (!res.ok) throw new Error(String(res.status));
      toast({ title: "Deleted", description: "Project deleted." });
      navigate("/admin/projects", { replace: true });
    } catch {
      toast({ title: "Error", description: "Failed to delete." });
    }
  };

  if (loading) return <div className="p-8 text-gray-text">Loading...</div>;

  if (!project) return (
    <div className="p-8">
      <div className="mb-4">No project selected.</div>
      <AdminBack variant="admin" />
    </div>
  );

  const media = Array.isArray(project.media) ? [...project.media].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : [];
  const mainImage = media[activeIndex]?.image || "/project-placeholder.svg";

  return (
    <div className="relative min-h-screen bg-white text-dark">
      <div className="container mx-auto max-w-full px-4 pt-0 pb-10">
        {/* Header: back arrow + three-dots menu (title below) */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <AdminBack variant="admin" />
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors" aria-label="Actions">
                    <MoreHorizontal className="w-5 h-5 text-dark" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end" onClick={(e) => e.stopPropagation()} className="bg-white border border-gray-border rounded-2xl shadow-lg p-2">
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onEditNavigate(); }} className="flex items-center gap-2"><Edit3 className="w-4 h-4 text-orange"/>Edit</DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onDelete(); }} className="flex items-center gap-2"><Trash2 className="w-4 h-4 text-red-600"/>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-4">
            <h1 className="font-lufga font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight">
              <span className="block text-dark">{project.title}</span>
              <span className="block h-1 mt-2 w-24 bg-orange rounded-full" aria-hidden="true" />
            </h1>
          </div>
        </div>

        {/* Main content: images section (80% / 20%) - only render if there are media items */}
        <div className="rounded-3xl bg-white border border-gray-border shadow-sm p-6">
          {media.length > 0 ? (
            <div className="grid lg:grid-cols-[4fr,1fr] gap-4 items-start">
              {/* Main image */}
              <div className="relative rounded-3xl overflow-hidden border border-gray-border bg-gray-bg">
                <motion.img
                  key={mainImage}
                  loading="lazy"
                  decoding="async"
                  src={mainImage}
                  alt={project.title}
                  className="w-full h-[24rem] lg:h-[36rem] object-contain"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  onError={(e) => { const img = e.currentTarget as HTMLImageElement; if (img.src.includes("project-placeholder.svg")) return; img.onerror = null; img.src = "/project-placeholder.svg"; }}
                />
              </div>

              {/* Vertical thumbnails (lg+) */}
              <div className="hidden lg:block max-h-[36rem] overflow-y-auto pr-1">
                <div className="flex flex-col gap-3">
                  {media.map((m, i) => (
                    <button
                      key={m.id}
                      onClick={() => setActiveIndex(i)}
                      className={"relative w-full h-20 rounded-xl overflow-hidden border bg-white transition-colors" + (i === activeIndex ? " border-orange" : " border-gray-border")}
                      aria-pressed={i === activeIndex}
                    >
                      <img
                        loading="lazy"
                        decoding="async"
                        src={m.image}
                        alt={`${project.title} ${i + 1}`}
                        className={"w-full h-full object-contain" + (i !== activeIndex ? " opacity-80" : " opacity-100")}
                        onError={(e) => { const img = e.currentTarget as HTMLImageElement; if (img.src.includes("project-placeholder.svg")) return; img.onerror = null; img.src = "/project-placeholder.svg"; }}
                      />
                      {i === activeIndex && <span className="absolute inset-0 ring-2 ring-orange rounded-xl pointer-events-none" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horizontal thumbnails (mobile/tablet) */}
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 lg:hidden col-span-full">
                {media.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveIndex(i)}
                    className={"relative w-24 h-16 rounded-xl overflow-hidden border" + (i === activeIndex ? " border-orange" : " border-gray-border")}
                    aria-pressed={i === activeIndex}
                  >
                    <img
                      loading="lazy"
                      decoding="async"
                      src={m.image}
                      alt={`${project.title} ${i + 1}`}
                      className={"w-full h-full object-contain bg-white" + (i !== activeIndex ? " opacity-80" : " opacity-100")}
                      onError={(e) => { const img = e.currentTarget as HTMLImageElement; if (img.src.includes("project-placeholder.svg")) return; img.onerror = null; img.src = "/project-placeholder.svg"; }}
                    />
                    {i === activeIndex && <span className="absolute inset-0 ring-2 ring-orange rounded-xl pointer-events-none" />}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Description full width below images */}
          <div className="mt-6 prose max-w-none">
            {project.description && project.description.includes("<") ? (
              <div dangerouslySetInnerHTML={{ __html: project.description }} />
            ) : (
              <div className="whitespace-pre-wrap break-words break-all text-gray-text" style={{ whiteSpace: "pre-wrap", wordBreak: 'break-word', overflowWrap: 'break-word' }}>{project.description}</div>
            )}
          </div>

          {/* Skills and links full width - only render blocks when data exists */}
          <div className="mt-6">
            {project.skills_list && project.skills_list.length > 0 ? (
              <div className="mb-4">
                <h3 className="font-lufga text-xl font-bold text-orange mb-2">Stack / Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {project.skills_list.map((s) => (
                    <div key={s.id} className="px-3 py-1 rounded-full bg-white border border-gray-border text-sm flex items-center gap-2">
                      {s.icon ? <img src={s.icon} alt={s.name} className="w-4 h-4" /> : null}
                      <span className="text-dark">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {links && links.length > 0 ? (
              <div>
                <h3 className="font-lufga text-xl font-bold text-orange mb-2">Liens</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  {links.map((l) => (
                    <a key={l.id || l.url} href={l.url} target="_blank" rel="noreferrer" className="text-orange underline">{l.text || l.url}</a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
         </div>
      </div>
    </div>
  );
}
