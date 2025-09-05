import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { getApiUrl } from "@/lib/config";
import { cn } from "@/lib/utils";

type ProjectMedia = {
  id: number;
  image: string;
  order: number;
};

type Project = {
  id: number;
  title: string;
  description: string;
  media: ProjectMedia[];
  skills_list?: Array<string | { id: number; name: string; icon?: string }>;
  links?: { id?: number; url: string; text?: string; order?: number }[];
};

const BUILD_ID = typeof window !== "undefined" && (import.meta as any).hot
  ? String(Date.now())
  : ((import.meta as any).env?.VITE_BUILD_ID as string) || "1";

const addCacheBuster = (u: string) => {
  try {
    const url = new URL(u, typeof window !== "undefined" ? window.location.origin : "");
    url.searchParams.set("v", BUILD_ID);
    return url.toString();
  } catch {
    const sep = u.includes("?") ? "&" : "?";
    return `${u}${sep}v=${BUILD_ID}`;
  }
};

function parseSkills(skillsList?: unknown): string[] {
  let items: unknown[] = [];

  if (Array.isArray(skillsList)) {
    items = skillsList;
  } else if (typeof skillsList === "string") {
    const s = skillsList.trim();
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) items = parsed;
    } catch {
      items = s.split(",").map((x) => x.trim()).filter(Boolean);
    }
  }

  const names: string[] = [];
  for (const it of items) {
    if (typeof it === "string") {
      const v = it.trim();
      if (v) names.push(v);
    } else if (it && typeof it === "object") {
      const anyIt: any = it as any;
      const name = typeof anyIt.name === "string"
        ? anyIt.name
        : anyIt.skill_reference && typeof anyIt.skill_reference.name === "string"
          ? anyIt.skill_reference.name
          : "";
      if (name) names.push(name.trim());
    }
  }

  return Array.from(new Set(names.filter(Boolean)));
}

export default function ProjectDetail() {
  const params = useParams();
  const id = params.id as string | undefined;
  const location = useLocation() as { state?: { project?: Project } };
  const [project, setProject] = useState<Project | null>(location.state?.project ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [links, setLinks] = useState<{ id?: number; url: string; text?: string; order?: number }[]>([]);

  // initialize links if project provided via route state
  useEffect(() => {
    if (location.state?.project?.links) setLinks(location.state.project.links);
  }, [location.state]);

  const media = useMemo(() => {
    const m = project?.media || [];
    return [...m].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [project]);

  useEffect(() => {
    if (!id) return;
    // If project data was passed via route state, use it and skip fetch
    if (project && String(project.id) === String(id)) return;

    const url = getApiUrl(`/api/projects/${id}/`);
    setLoading(true);
    setError(null);
    fetch(url, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: Project) => {
        setProject(data);
        // fetch links separately (API exposes /links/ endpoint)
        fetch(getApiUrl(`/api/projects/${id}/links/`), { cache: "no-store" })
          .then((lr) => (lr.ok ? lr.json() : Promise.reject(lr.status)))
          .then((ld) => setLinks(Array.isArray(ld) ? ld : []))
          .catch(() => setLinks([]));
      })
      .catch(() => setError("Failed to load project."))
      .finally(() => setLoading(false));
  }, [id]);

  const skills = useMemo(() => parseSkills(project?.skills_list), [project]);

  const mainImage = media[activeIndex]?.image || "/project-placeholder.svg";

  // Other projects
  const [otherProjects, setOtherProjects] = useState<Project[]>([]);
  const [otherLoading, setOtherLoading] = useState(false);
  const suggestions = useMemo(() => {
    const items = otherProjects.filter((p) => String(p.id) !== String(id));
    return items.slice(0, 4);
  }, [otherProjects, id]);

  useEffect(() => {
    setOtherLoading(true);
    fetch(getApiUrl("/api/projects/"), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        const results = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
        setOtherProjects(results || []);
      })
      .catch(() => setOtherProjects([]))
      .finally(() => setOtherLoading(false));
  }, [id]);

  return (
    <section className="py-16 lg:py-24 bg-white min-h-screen">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-8">
          <Link to="/" className="text-gray-text font-lufga hover:text-orange">← Back</Link>
        </div>

        {loading && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="h-[24rem] lg:h-[30rem] bg-gray-bg border border-gray-border rounded-3xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-10 bg-gray-bg rounded-xl w-2/3" />
              <div className="h-24 bg-gray-bg rounded-xl" />
              <div className="h-10 bg-gray-bg rounded-xl w-1/2" />
            </div>
          </div>
        )}

        {!loading && error && (
          <p className="text-center text-gray-light font-lufga">{error}</p>
        )}

        {!loading && project && (
          <div className="space-y-8">
            {/* Top: 80% main image + 20% vertical thumbnails on large screens */}
            <div className="grid lg:grid-cols-[4fr,1fr] gap-4 items-start">
              {/* Main image */}
              <div className="relative rounded-3xl overflow-hidden border border-gray-border bg-gray-bg">
                <motion.img
                  key={mainImage}
                  loading="lazy"
                  decoding="async"
                  src={addCacheBuster(mainImage)}
                  alt={project.title}
                  className="w-full h-[24rem] lg:h-[36rem] object-contain"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (img.src.includes("project-placeholder.svg")) return;
                    img.onerror = null;
                    img.src = "/project-placeholder.svg";
                  }}
                />
              </div>

              {/* Vertical thumbnails (lg+) */}
              <div className="hidden lg:block max-h-[36rem] overflow-y-auto pr-1">
                <div className="flex flex-col gap-3">
                  {(media.length ? media : [{ id: -1, image: "/project-placeholder.svg", order: 0 }]).map((m, i) => (
                    <button
                      key={m.id}
                      onClick={() => setActiveIndex(i)}
                      className={cn(
                        "relative w-full h-20 rounded-xl overflow-hidden border bg-white",
                        i === activeIndex ? "border-orange" : "border-gray-border"
                      )}
                      aria-pressed={i === activeIndex}
                    >
                      <img
                        loading="lazy"
                        decoding="async"
                        src={addCacheBuster(m.image)}
                        alt={`${project.title} ${i + 1}`}
                        className={cn("w-full h-full object-contain", i !== activeIndex ? "opacity-80" : "opacity-100")}
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          if (img.src.includes("project-placeholder.svg")) return;
                          img.onerror = null;
                          img.src = "/project-placeholder.svg";
                        }}
                      />
                      {i === activeIndex && <span className="absolute inset-0 ring-2 ring-orange rounded-xl pointer-events-none" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horizontal thumbnails (mobile/tablet) */}
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 lg:hidden col-span-full">
                {(media.length ? media : [{ id: -1, image: "/project-placeholder.svg", order: 0 }]).map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveIndex(i)}
                    className={cn(
                      "relative w-24 h-16 rounded-xl overflow-hidden border",
                      i === activeIndex ? "border-orange" : "border-gray-border"
                    )}
                    aria-pressed={i === activeIndex}
                  >
                    <img
                      loading="lazy"
                      decoding="async"
                      src={addCacheBuster(m.image)}
                      alt={`${project.title} ${i + 1}`}
                      className={cn("w-full h-full object-contain bg-white", i !== activeIndex ? "opacity-80" : "opacity-100")}
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (img.src.includes("project-placeholder.svg")) return;
                        img.onerror = null;
                        img.src = "/project-placeholder.svg";
                      }}
                    />
                    {i === activeIndex && <span className="absolute inset-0 ring-2 ring-orange rounded-xl pointer-events-none" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Below: title + description */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-lufga font-bold text-gray-text">{project.title}</h1>
              <p className="text-gray-text font-lufga text-base lg:text-lg leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </div>

            {/* Actions and Stack: links left, stack right */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div className="flex flex-wrap gap-3">
                {links && links.length > 0 ? links.map((l) => (
                  <a key={l.id || l.url} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center px-6 py-3 rounded-full bg-gray-bg border border-gray-border text-gray-text font-lufga text-base lg:text-lg hover:bg-gray-bg/70">{l.text || l.url}</a>
                )) : null}
              </div>

              {skills.length > 0 && (
                <div className="sm:text-right sm:self-start">
                  <h2 className="text-lg font-lufga font-bold text-dark mb-2">Stack</h2>
                  <ul className="flex flex-wrap gap-2 justify-start sm:justify-end">
                    {skills.slice(0, 8).map((s, i) => (
                      <li key={`${s}-${i}`} className="px-3 py-1 rounded-full bg-gray-bg border border-gray-border text-gray-text text-xs font-lufga">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Other projects */}
            {suggestions.length > 0 && (
              <div className="pt-4">
                <h2 className="text-2xl sm:text-3xl font-lufga font-bold text-gray-text mb-4">Other Projects</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {suggestions.map((p: any) => (
                    <div key={p.id} className="rounded-2xl border border-gray-border bg-white p-3">
                      <div className="relative w-full h-40 rounded-xl overflow-hidden bg-gray-bg border border-gray-border">
                        <img
                          loading="lazy"
                          decoding="async"
                          src={addCacheBuster(p?.media?.[0]?.image || "/project-placeholder.svg")}
                          alt={p?.title || "Project"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            if (img.src.includes("project-placeholder.svg")) return;
                            img.onerror = null;
                            img.src = "/project-placeholder.svg";
                          }}
                        />
                      </div>
                      <h3 className="mt-3 text-lg font-lufga font-bold text-gray-text truncate" title={p?.title}>{p?.title || "Project"}</h3>
                      <Link
                        to={`/projects/${p.id}`}
                        state={{ project: p }}
                        className="inline-flex items-center mt-2 px-4 py-2 rounded-full bg-white border border-gray-border text-gray-text font-lufga text-sm hover:bg-gray-bg"
                      >
                        View details
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
