import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getApiUrl } from "@/lib/config";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Quote,
  Send,
  ArrowUpRight,
  Menu,
  X,
  Sun,
  Moon,
  Github,
  Linkedin,
  Instagram,
} from "lucide-react";

type SkillReference = {
  id: number;
  name: string;
  icon: string;
};

type Skill = {
  id: number;
  reference: SkillReference;
};

type HeroItem = {
  id: number;
  headline: string;
  subheadline: string;
  image: string | null;
  instagram: string;
  linkedin: string;
  github: string;
  order: number;
  is_active: boolean;
};

type AboutItem = {
  id: number;
  title: string;
  description: string;
  cv: string;
  hiring_email: string | null;
  updated_at: string;
};

export default function Index() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [hero, setHero] = useState<HeroItem | null>(null);
  const [about, setAbout] = useState<AboutItem | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsPage, setSkillsPage] = useState(0);
  const [perPage, setPerPage] = useState(12);
  const [skillsGridMinH, setSkillsGridMinH] = useState(0);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const wheelAccumX = useRef(0);
  const wheelCooldownRef = useRef(false);
  const wheelTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const url = getApiUrl("/api/core/hero/");
    if (!url) return;
    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: HeroItem[]) => {
        const active = Array.isArray(data)
          ? data.find((h) => h.is_active) || data[0] || null
          : null;
        setHero(active);
      })
      .catch(() => {
        // Silently ignore fetch errors in UI; keep static fallback
      });
  }, []);

  useEffect(() => {
    const url = getApiUrl("/api/core/about/");
    if (!url) return;
    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: AboutItem) => setAbout(data || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const url = getApiUrl("/api/skills/");
    if (!url) return;
    setSkillsLoading(true);
    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: Skill[]) => {
        if (Array.isArray(data)) {
          setSkills(data);
        } else {
          setSkills([]);
        }
      })
      .catch(() => {
        setSkills([]);
      })
      .finally(() => setSkillsLoading(false));
  }, []);

  useEffect(() => {
    const total = Math.ceil(skills.length / perPage);
    if (skillsPage >= total && total > 0) {
      setSkillsPage(total - 1);
    }
    if (total === 0 && skillsPage !== 0) {
      setSkillsPage(0);
    }
  }, [skills, perPage, skillsPage]);

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      let cols = 2; // xs
      if (w >= 1280) cols = 6; // xl
      else if (w >= 1024) cols = 5; // lg
      else if (w >= 768) cols = 4; // md
      else if (w >= 640) cols = 3; // sm
      const rows = w < 768 ? 3 : 2; // more items on mobile/tablet

      // Compute a consistent minimum height for the grid based on breakpoint styles
      let itemH = 64; // h-16 -> 4rem
      if (w >= 1024) itemH = 112; // lg:h-28 -> 7rem
      else if (w >= 768) itemH = 96; // md:h-24 -> 6rem
      else if (w >= 640) itemH = 80; // sm:h-20 -> 5rem

      let gap = 8; // gap-2 -> 0.5rem
      if (w >= 1280) gap = 24; // xl:gap-6 -> 1.5rem
      else if (w >= 1024) gap = 20; // lg:gap-5 -> 1.25rem
      else if (w >= 768) gap = 16; // md:gap-4 -> 1rem
      else if (w >= 640) gap = 12; // sm:gap-3 -> 0.75rem

      const minH = rows * itemH + (rows - 1) * gap;
      setSkillsGridMinH(minH);

      setPerPage(cols * rows);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  };

  const aboutTitle = (about?.title && about.title.trim().length > 0)
    ? about.title.trim()
    : "About Me";
  const aboutWords = aboutTitle.split(" ");
  const aboutLast = aboutWords.pop() || "";
  const aboutFirst = aboutWords.join(" ");

  const hireEmail = (about?.hiring_email && about.hiring_email.trim())
    ? about.hiring_email.trim()
    : "salma.chiboub@gmail.com";

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);
    setContactSuccess(null);

    const name = contactName.trim();
    const email = contactEmail.trim();
    const subject = contactSubject.trim();
    const message = contactMessage.trim();

    if (!name || !email || !subject || !message) {
      setContactError("Please fill in all fields.");
      return;
    }
    const emailOk = /.+@.+\..+/.test(email);
    if (!emailOk) {
      setContactError("Please enter a valid email.");
      return;
    }

    const url = getApiUrl("/api/core/contact/");
    if (!url) {
      setContactError("API URL not configured.");
      return;
    }
    setContactLoading(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setContactSuccess("Message sent successfully.");
      setContactName("");
      setContactEmail("");
      setContactSubject("");
      setContactMessage("");
    } catch (err) {
      setContactError("Failed to send message. Please try again.");
    } finally {
      setContactLoading(false);
    }
  };

  const totalSkillPages = Math.ceil(skills.length / perPage);
  const skillsStart = skillsPage * perPage;
  const paginatedSkills = skills.slice(skillsStart, skillsStart + perPage);

  const pageDirRef = useRef(1);
  const skillsWheelRef = useRef<HTMLDivElement | null>(null);
  const goPrevSkillsPage = () => {
    pageDirRef.current = -1;
    setSkillsPage(Math.max(0, skillsPage - 1));
  };
  const goNextSkillsPage = () => {
    pageDirRef.current = 1;
    setSkillsPage(Math.min(Math.max(totalSkillPages - 1, 0), skillsPage + 1));
  };

  const skillsPageVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0.2 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0.2 }),
  };

  const handleSkillsTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    touchDeltaX.current = 0;
  };
  const handleSkillsTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current !== null) {
      touchDeltaX.current = (e.touches[0]?.clientX ?? 0) - touchStartX.current;
    }
  };
  const handleSkillsTouchEnd = () => {
    const threshold = 50;
    if (Math.abs(touchDeltaX.current) > threshold) {
      if (touchDeltaX.current < 0) {
        pageDirRef.current = 1;
        goNextSkillsPage();
      } else {
        pageDirRef.current = -1;
        goPrevSkillsPage();
      }
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  useEffect(() => {
    const el = skillsWheelRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      const dx = e.deltaX;
      const dy = e.deltaY;
      if (Math.abs(dx) <= Math.abs(dy)) return;
      if (wheelCooldownRef.current) return;

      wheelAccumX.current += dx;
      const threshold = 60;
      if (Math.abs(wheelAccumX.current) > threshold) {
        e.preventDefault();
        if (wheelAccumX.current < 0) {
          pageDirRef.current = -1;
          goPrevSkillsPage();
        } else {
          pageDirRef.current = 1;
          goNextSkillsPage();
        }
        wheelAccumX.current = 0;
        wheelCooldownRef.current = true;
        if (wheelTimeoutRef.current) window.clearTimeout(wheelTimeoutRef.current);
        wheelTimeoutRef.current = window.setTimeout(() => {
          wheelCooldownRef.current = false;
        }, 500);
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => {
      el.removeEventListener("wheel", handler);
      if (wheelTimeoutRef.current) window.clearTimeout(wheelTimeoutRef.current);
    };
  }, [skillsPage, totalSkillPages]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation - Fixed and Responsive */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "py-1" : "py-3"
        }`}
      >
        <div className="container mx-auto px-4">
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-between bg-dark rounded-full border border-white/10 backdrop-blur-lg px-2 py-1">
            <div className="flex items-center space-x-2">
              <div className="flex items-center px-6 py-3 bg-orange rounded-full">
                <span className="text-white font-lufga font-bold text-base tracking-tight">
                  Home
                </span>
              </div>
              <a
                href="#about"
                className="text-white font-lufga text-base px-4 py-3 hover:text-orange transition-colors rounded-full"
              >
                About
              </a>
              <a
                href="#services"
                className="text-white font-lufga text-base px-4 py-3 hover:text-orange transition-colors rounded-full"
              >
                Service
              </a>
            </div>

            <div className="flex items-center justify-center px-4 py-3">
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-3 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full transition-colors group"
                aria-label="Toggle theme"
              >
                <div className="w-9 h-9 bg-orange rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-white" />
                  ) : (
                    <Moon className="w-5 h-5 text-white" />
                  )}
                </div>
                <span className="text-white font-lufga font-bold text-base tracking-wider">
                  {isDarkMode ? "Light" : "Dark"}
                </span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href="#resume"
                className="text-white font-lufga text-base px-4 py-3 hover:text-orange transition-colors rounded-full"
              >
                Resume
              </a>
              <a
                href="#project"
                className="text-white font-lufga text-base px-4 py-3 hover:text-orange transition-colors rounded-full"
              >
                Project
              </a>
              <a
                href="#contact"
                className="text-white font-lufga text-base px-4 py-3 hover:text-orange transition-colors rounded-full"
              >
                Contact
              </a>
            </div>
          </div>

          {/* Tablet Navigation */}
          <div className="hidden md:flex lg:hidden items-center justify-between bg-dark rounded-full border border-white/10 backdrop-blur-lg px-3 py-2">
            <div className="flex items-center space-x-1">
              <div className="flex items-center px-6 py-3 bg-orange rounded-full">
                <span className="text-white font-lufga font-bold text-sm">
                  Home
                </span>
              </div>
              <a
                href="#about"
                className="text-white font-lufga text-sm px-3 py-2 hover:text-orange transition-colors"
              >
                About
              </a>
              <a
                href="#services"
                className="text-white font-lufga text-sm px-3 py-2 hover:text-orange transition-colors"
              >
                Service
              </a>
            </div>

            <button
              onClick={toggleTheme}
              className="flex items-center space-x-2 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-full transition-colors group"
              aria-label="Toggle theme"
            >
              <div className="w-7 h-7 bg-orange rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-white" />
                ) : (
                  <Moon className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="text-white font-lufga font-bold text-sm">
                {isDarkMode ? "Light" : "Dark"}
              </span>
            </button>

            <div className="flex items-center space-x-1">
              <a
                href="#resume"
                className="text-white font-lufga text-sm px-3 py-2 hover:text-orange transition-colors"
              >
                Resume
              </a>
              <a
                href="#contact"
                className="text-white font-lufga text-sm px-3 py-2 hover:text-orange transition-colors"
              >
                Contact
              </a>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <div className="flex items-center justify-between bg-dark rounded-full border border-white/10 backdrop-blur-lg px-3 py-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-2 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-full transition-colors group"
                aria-label="Toggle theme"
              >
                <div className="w-7 h-7 bg-orange rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                  {isDarkMode ? (
                    <Sun className="w-4 h-4 text-white" />
                  ) : (
                    <Moon className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-white font-lufga font-bold text-sm">
                  {isDarkMode ? "Light" : "Dark"}
                </span>
              </button>

              {/* Home button */}
              <div className="flex items-center px-3 py-1 bg-orange rounded-full">
                <span className="text-white font-lufga font-bold text-sm">
                  Home
                </span>
              </div>

              {/* Menu button */}
              <button
                onClick={toggleMobileMenu}
                className="text-white p-2 hover:text-orange transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
              <div className="absolute top-full left-4 right-4 mt-2 bg-dark rounded-2xl border border-white/10 backdrop-blur-lg overflow-hidden">
                <div className="flex flex-col">
                  <a
                    href="#about"
                    className="text-white font-lufga text-sm px-5 py-3 hover:bg-orange/10 hover:text-orange transition-colors border-b border-white/5"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    About
                  </a>
                  <a
                    href="#services"
                    className="text-white font-lufga text-sm px-5 py-3 hover:bg-orange/10 hover:text-orange transition-colors border-b border-white/5"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Service
                  </a>
                  <a
                    href="#resume"
                    className="text-white font-lufga text-sm px-5 py-3 hover:bg-orange/10 hover:text-orange transition-colors border-b border-white/5"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Resume
                  </a>
                  <a
                    href="#project"
                    className="text-white font-lufga text-sm px-5 py-3 hover:bg-orange/10 hover:text-orange transition-colors border-b border-white/5"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Project
                  </a>
                  <a
                    href="#contact"
                    className="text-white font-lufga text-base px-6 py-4 hover:bg-orange/10 hover:text-orange transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Contact
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section with proper spacing */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden pt-28 lg:pt-32">
        <div className="container mx-auto max-w-7xl relative">
          {/* Hero Content */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
            {/* Left side - Text content */}
            <div className="flex-1 space-y-8 lg:space-y-12 text-center lg:text-left max-w-2xl">
              {/* Hello Badge */}
              <div className="relative inline-block">
                <div className="inline-flex items-center px-4 lg:px-6 py-2 lg:py-3 bg-white/10 border border-dark rounded-full">
                  <span className="text-dark font-lufga text-lg lg:text-xl">
                    Hello!
                  </span>
                </div>
                {/* Decorative arrow - hidden on mobile */}
                <svg
                  className="hidden lg:block absolute -top-4 -right-8 w-6 h-6 lg:w-8 lg:h-8 text-orange-light"
                  viewBox="0 0 33 33"
                  fill="none"
                >
                  <path
                    d="M2.74512 20C2.74512 17 5.74512 11 2.74512 2M10.2451 23.5C14.5785 19.3333 23.4451 9.2 24.2451 2M13.2451 30.5C15.9118 30.5 23.0451 29.1 30.2451 23.5"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Main heading - Responsive text sizes */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-urbanist font-bold leading-none tracking-tight">
                <span className="text-dark">I'm </span>
                <span className="text-orange">Salma Chiboub</span>
              </h1>

              {/* Headline */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-lufga font-bold text-dark leading-tight">
                {hero?.headline || "Product Designer & UX Specialist"}
              </h2>

              {/* Subheadline */}
              <p className="text-gray-text font-lufga text-lg lg:text-xl leading-relaxed max-w-lg mx-auto lg:mx-0">
                {hero?.subheadline ||
                  "Creating exceptional digital experiences through innovative design solutions that drive business growth and user satisfaction."}
              </p>

              {/* Decorative arrow bottom - hidden on mobile */}
              <div className="hidden lg:block relative">
                <svg
                  className="w-12 h-12 lg:w-16 lg:h-16 text-orange-light"
                  viewBox="0 0 74 85"
                  fill="none"
                >
                  <path
                    d="M71.3106 36.2314C69.6282 43.8914 58.6036 57.529 61.2166 82.1913M54.1233 23.0889C40.7223 31.2977 12.4002 52.1992 6.31996 70.1346M50.3888 3.53325C43.5799 2.03784 24.5811 1.61227 3.05674 11.8733"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Right side - Image with background */}
            <div className="flex-1 flex justify-center lg:justify-end relative">
              <div className="relative -translate-y-6 sm:-translate-y-8">
                {/* Orange semicircle background */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md lg:max-w-lg xl:max-w-xl h-64 sm:h-80 lg:h-96 bg-orange-light rounded-t-full"></div>

                {/* Main image */}
                <div className="relative z-10">
                  <img
                    src={(hero?.image && hero.image.trim() !== "") ? hero.image : "/caracter.png"}
                    alt="Salma Chiboub - Product Designer"
                    className="w-full max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg h-auto object-cover"
                  />
                </div>

                {/* Social icons - show only if at least one link exists */}
                {(() => {
                  const github = hero?.github?.trim() || "";
                  const linkedin = hero?.linkedin?.trim() || "";
                  const instagram = hero?.instagram?.trim() || "";
                  const hasAny = !!(github || linkedin || instagram);
                  if (!hasAny) return null;
                  return (
                    <div className="absolute bottom-8 sm:bottom-12 lg:bottom-16 right-4 sm:right-8 lg:right-12 z-20">
                      <div className="flex items-center bg-white/10 backdrop-blur-lg border-2 border-white rounded-full p-1 lg:p-2">
                        {github && (
                          <a
                            href={github}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="GitHub"
                            className="w-10 h-10 lg:w-12 lg:h-12 bg-orange rounded-full flex items-center justify-center mx-1 hover:bg-orange/90 transition-colors"
                          >
                            <Github className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                          </a>
                        )}
                        {linkedin && (
                          <a
                            href={linkedin}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="LinkedIn"
                            className="w-10 h-10 lg:w-12 lg:h-12 bg-white/10 border border-white/30 rounded-full flex items-center justify-center mx-1 hover:bg-white/20 transition-colors"
                          >
                            <Linkedin className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                          </a>
                        )}
                        {instagram && (
                          <a
                            href={instagram}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Instagram"
                            className="w-10 h-10 lg:w-12 lg:h-12 bg-white/10 border border-white/30 rounded-full flex items-center justify-center mx-1 hover:bg-white/20 transition-colors"
                          >
                            <Instagram className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="pt-2.5 pb-16 lg:pt-2.5 lg:pb-24 bg-white">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
            {/* Left 35% - Motifs + Download */}
            <div className="lg:col-span-1 flex items-center justify-center">
              <div className="relative w-full max-w-sm flex flex-col items-center justify-center min-h-[220px]">
                {(about?.cv || (about?.hiring_email && about.hiring_email.trim() !== "")) && (
                  <>
                    <div className="mt-6 flex items-center gap-3">
                      {about?.cv && (
                        <a
                          href={about.cv}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center px-8 py-4 bg-orange rounded-full text-white font-lufga text-lg font-medium hover:bg-orange/90 transition-colors shadow-lg"
                        >
                          Download CV
                        </a>
                      )}
                      {about?.hiring_email && about.hiring_email.trim() !== "" && (
                        <a
                          href={`mailto:${about.hiring_email}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const email = about?.hiring_email?.trim();
                            if (!email) {
                              e.preventDefault();
                              return;
                            }
                            window.location.href = `mailto:${email}`;
                          }}
                          className="inline-flex items-center px-8 py-4 bg-white border border-gray-text rounded-full text-gray-text font-lufga text-lg font-medium hover:bg-gray-text hover:text-white transition-colors shadow"
                        >
                          Hire Me
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right 65% - About content */}
            <div className="lg:col-span-2 space-y-8 lg:space-y-10 text-center lg:text-left">
              <div className="space-y-4">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-lufga font-bold">
                  {aboutFirst && <span className="text-dark">{aboutFirst} </span>}
                  <span className="text-orange">{aboutLast}</span>
                </h2>
                <div className="w-20 h-1 bg-orange mx-auto lg:mx-0 rounded-full"></div>
              </div>

              <div className="space-y-6">
                <p className="text-gray-text font-lufga text-lg lg:text-xl leading-relaxed">
                  {about?.description ||
                    "I'm Salma Chiboub, a passionate Product Designer with over 8 years of experience creating digital experiences that make a difference. I specialize in transforming complex problems into simple, elegant solutions that users love."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      {(skillsLoading || skills.length > 0) && (
      <section
        id="services"
        className="py-16 lg:py-24 bg-dark rounded-t-[50px] relative overflow-hidden"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-0 w-96 h-96 bg-orange-light rounded-full blur-3xl transform translate-x-1/2"></div>
          <div className="absolute top-10 left-1/3 w-48 h-48 bg-orange-light rounded-full blur-2xl transform -rotate-45"></div>
          <div className="absolute top-0 left-0 w-72 h-96 bg-orange-light rounded-full blur-2xl transform -translate-x-1/2 rotate-45"></div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 relative z-10">
          {/* Section header - Responsive */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 lg:mb-24 space-y-6 lg:space-y-0">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-lufga font-medium">
              <span className="text-white">Tech </span>
              <span className="text-orange">Stack</span>
            </h2>
          </div>

          {/* Skills grid - Responsive with animation */}
          <div className="px-2 sm:px-4 md:px-6 lg:px-10 xl:px-14">
            <div className="grid grid-cols-[auto,1fr,auto] items-center gap-2 sm:gap-3 md:gap-4">
              <div className="flex justify-start">
                {totalSkillPages > 1 && (
                  <button
                    onClick={goPrevSkillsPage}
                    aria-label="Previous skills page"
                    className="w-10 h-10 lg:w-12 lg:h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 disabled:opacity-40 disabled:pointer-events-none"
                    disabled={skillsPage === 0}
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                )}
              </div>
              <div style={{ minHeight: skillsGridMinH }} ref={skillsWheelRef} className="relative mb-6">
            <AnimatePresence initial={false} mode="wait" custom={pageDirRef.current}>
              <motion.div
                key={skillsPage}
                custom={pageDirRef.current}
                variants={skillsPageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.8 }}
                className="absolute inset-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6"
                style={{ willChange: "transform" }}
                onTouchStart={handleSkillsTouchStart}
                onTouchMove={handleSkillsTouchMove}
                onTouchEnd={handleSkillsTouchEnd}
              >
              {skillsLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="animate-pulse bg-white/10 rounded-3xl h-40 border border-white/10"
                  ></div>
                ))}


              {!skillsLoading &&
                paginatedSkills.map((item) => (
                  <div key={item.id} className="relative group">
                    <div className="relative bg-gray-400/20 backdrop-blur-lg border border-white/20 rounded-3xl p-1 sm:p-1.5 md:p-2 h-16 sm:h-20 md:h-24 lg:h-28 flex flex-col items-center justify-center text-center">
                      <img
                        src={item.reference.icon}
                        alt={item.reference.name}
                        className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 object-contain mb-1 sm:mb-2"
                      />
                      <h3 className="text-white font-lufga text-xs sm:text-sm md:text-base font-medium truncate w-full">
                        {item.reference.name}
                      </h3>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>

              </div>
              <div className="flex justify-end">
                {totalSkillPages > 1 && (
                  <button
                    onClick={goNextSkillsPage}
                    aria-label="Next skills page"
                    className="w-10 h-10 lg:w-12 lg:h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 disabled:opacity-40 disabled:pointer-events-none"
                    disabled={skillsPage >= totalSkillPages - 1}
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Pagination dots */}
          {totalSkillPages > 1 && (
            <div className="flex justify-center space-x-3">
              {Array.from({ length: totalSkillPages }).map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to skills page ${i + 1}`}
                  onClick={() => {
                      pageDirRef.current = i > skillsPage ? 1 : -1;
                      setSkillsPage(i);
                    }}
                  className={`w-3 h-3 rounded-full transition-colors ${i === skillsPage ? "bg-orange" : "bg-white"}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
      )}

      {/* Work Experience Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Section title */}
          <div className="text-center mb-16 lg:mb-20">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-lufga font-medium">
              <span className="text-gray-text">My </span>
              <span className="text-orange">Work Experience</span>
            </h2>
          </div>

          {/* Experience timeline - Responsive */}
          <div className="flex flex-col lg:flex-row justify-between items-start max-w-6xl mx-auto gap-8 lg:gap-0">
            {/* Left side - Company details */}
            <div className="space-y-16 lg:space-y-24 flex-1">
              <div>
                <h3 className="text-2xl lg:text-4xl font-lufga font-bold text-gray-text mb-3">
                  Cognizant, Mumbai
                </h3>
                <p className="text-xl lg:text-2xl font-lufga text-gray-light">
                  Sep 2016- July 2020
                </p>
              </div>
              <div>
                <h3 className="text-2xl lg:text-4xl font-lufga font-bold text-gray-text mb-3">
                  Sugee Pvt limited, Mumbai
                </h3>
                <p className="text-xl lg:text-2xl font-lufga text-gray-light">
                  Sep 2020- July 2023
                </p>
              </div>
              <div>
                <h3 className="text-2xl lg:text-4xl font-lufga font-bold text-gray-text mb-3">
                  Cinetstox, Mumbai
                </h3>
                <p className="text-xl lg:text-2xl font-lufga text-gray-light">
                  Sep 2023
                </p>
              </div>
            </div>

            {/* Timeline - Hidden on mobile, visible on larger screens */}
            <div className="hidden lg:flex flex-col items-center space-y-20 mx-16">
              <div className="w-3 h-96 bg-gray-text relative">
                <div className="absolute -left-6 top-0 w-12 h-12 border-2 border-dashed border-dark-light rounded-full bg-white flex items-center justify-center">
                  <div className="w-9 h-9 bg-orange rounded-full"></div>
                </div>
                <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 w-12 h-12 border-2 border-dashed border-dark-light rounded-full bg-white flex items-center justify-center">
                  <div className="w-9 h-9 bg-dark-light rounded-full"></div>
                </div>
                <div className="absolute -left-6 bottom-0 w-12 h-12 border-2 border-dashed border-dark-light rounded-full bg-white flex items-center justify-center">
                  <div className="w-9 h-9 bg-orange rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Right side - Role details */}
            <div className="space-y-8 lg:space-y-12 flex-1">
              <div>
                <h3 className="text-2xl lg:text-4xl font-lufga font-bold text-gray-text mb-3">
                  Experience Designer
                </h3>
                <p className="text-lg lg:text-xl font-lufga text-gray-light leading-relaxed max-w-md">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis
                  lacus nunc, posuere in justo vulputate, bibendum sodales
                </p>
              </div>
              <div>
                <h3 className="text-2xl lg:text-4xl font-lufga font-bold text-gray-text mb-3">
                  UI/UX Designer
                </h3>
                <p className="text-lg lg:text-xl font-lufga text-gray-light leading-relaxed max-w-md">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis
                  lacus nunc, posuere in justo vulputate, bibendum sodales
                </p>
              </div>
              <div>
                <h3 className="text-2xl lg:text-4xl font-lufga font-bold text-gray-text">
                  Lead UX Designer
                </h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Hire Me Section */}
      <section className="py-16 lg:py-24 bg-gray-bg rounded-[50px]">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Left side - Image */}
            <div className="flex-1 order-2 lg:order-1">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/73c843c911c056a8d340e226d62e054705856d24?width=1905"
                alt="Why hire me"
                className="w-full max-w-lg h-auto rounded-3xl mx-auto"
              />
            </div>

            {/* Right side - Content */}
            <div className="flex-1 space-y-8 lg:space-y-12 order-1 lg:order-2 text-center lg:text-left">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-lufga font-bold leading-none">
                <span className="text-gray-text">Why </span>
                <span className="text-orange">Hire me</span>
                <span className="text-gray-text">?</span>
              </h2>

              <p className="text-lg lg:text-xl font-lufga text-gray-light leading-relaxed max-w-md mx-auto lg:mx-0">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis
                lacus nunc, posuere in justo vulputate, bibendum sodales
              </p>

              {/* Stats */}
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start space-y-8 sm:space-y-0 sm:space-x-16">
                <div className="text-center lg:text-left">
                  <div className="text-3xl lg:text-4xl font-lufga font-medium text-dark-light">
                    450+
                  </div>
                  <div className="text-lg lg:text-xl font-lufga text-gray-lighter">
                    Project Completed
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl lg:text-4xl font-lufga font-medium text-dark-light">
                    450+
                  </div>
                  <div className="text-lg lg:text-xl font-lufga text-gray-lighter">
                    Project Completed
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex justify-center lg:justify-start">
                <a
                  href={`mailto:${hireEmail}`}
                  className="inline-flex items-center px-10 lg:px-14 py-6 lg:py-8 bg-transparent border border-dark rounded-3xl hover:bg-dark hover:text-white transition-colors"
                >
                  <span className="text-dark font-lufga text-2xl lg:text-3xl font-bold">
                    Hire me
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Section header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 space-y-6 lg:space-y-0">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-lufga font-bold leading-tight max-w-2xl">
              <span className="text-gray-text">Lets have a look at my </span>
              <span className="text-orange">Portfolio</span>
            </h2>
            <button className="flex items-center px-8 lg:px-10 py-4 lg:py-5 bg-orange rounded-full">
              <span className="text-white font-lufga text-lg lg:text-xl font-bold">
                See All
              </span>
            </button>
          </div>

          {/* Portfolio grid */}
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="aspect-[16/9] bg-gradient-to-br from-orange/20 to-orange/60 rounded-2xl"></div>
              <div className="aspect-[16/9] bg-gradient-to-br from-orange/20 to-orange/60 rounded-2xl"></div>
            </div>

            {/* Pagination dots */}
            <div className="flex justify-center space-x-3">
              <div className="w-15 h-4 bg-orange rounded-full"></div>
              <div className="w-4 h-4 bg-gray-border rounded-full"></div>
              <div className="w-4 h-4 bg-gray-border rounded-full"></div>
              <div className="w-4 h-4 bg-gray-border rounded-full"></div>
            </div>

            {/* Tags */}
            <div className="flex justify-center space-x-2 lg:space-x-4 flex-wrap gap-2">
              {[
                "Landing Page",
                "Product Design",
                "Animation",
                "Glassmorphism",
                "Cards",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-4 lg:px-8 py-3 lg:py-4 bg-gray-bg rounded-3xl text-lg lg:text-xl font-inter text-gray-text"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Project details */}
            <div className="text-center space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-lufga font-bold text-gray-text">
                  Lirante - Food Delivery Solution
                </h3>
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-orange rounded-full flex items-center justify-center -rotate-90">
                  <ArrowUpRight className="w-6 h-6 lg:w-8 lg:h-8 text-white rotate-90" />
                </div>
              </div>
              <p className="text-lg lg:text-xl font-lufga text-gray-text leading-relaxed max-w-3xl mx-auto">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                congue interdum ligula a dignissim. Lorem ipsum dolor sit amet,
                consectetur adipiscing elit. Sed lobortis orci elementum egestas
                lobortis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 lg:py-24 bg-dark rounded-[50px] relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-0 w-96 h-96 bg-orange-light rounded-full blur-3xl transform translate-x-1/2"></div>
          <div className="absolute bottom-20 left-0 w-96 h-96 bg-orange-light rounded-full blur-3xl transform -translate-x-1/2"></div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 relative z-10">
          {/* Section header */}
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-lufga font-medium">
              <span className="text-white">Testimonials That Speak to </span>
              <span className="text-orange">My Results</span>
            </h2>
            <p className="text-lg lg:text-xl font-lufga text-white/90 leading-relaxed max-w-3xl mx-auto">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
              congue interdum ligula a dignissim. Lorem ipsum dolor sit amet,
              consectetur adipiscing elit. Sed lobortis orci elementum egestas
              lobortis.
            </p>

            {/* Decorative elements */}
            <div className="flex justify-center space-x-8 mt-8">
              <svg
                className="w-6 h-6 lg:w-7 lg:h-7 text-white"
                viewBox="0 0 32 33"
                fill="none"
              >
                <path
                  d="M2 20.0811C2 17.0811 5 11.0811 2 2.08105M9.5 23.5811C13.8333 19.4144 22.7 9.28105 23.5 2.08105M12.5 30.5811C15.1667 30.5811 22.3 29.1811 29.5 23.5811"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <svg
                className="w-5 h-5 lg:w-6 lg:h-6 text-white"
                viewBox="0 0 26 26"
                fill="none"
              >
                <path
                  d="M11.9808 2.12271L10.4215 4.20376L7.04297 3.42336C5.22377 2.96814 3.01473 2.64297 2.10512 2.64297C-0.298833 2.64297 0.090997 5.17924 2.81981 7.84558L5.09382 10.0567L2.42998 12.788C0.740714 14.4789 -0.16889 15.9746 0.0260252 16.69C0.220941 17.7956 0.805686 17.9256 5.80851 17.7305L11.2661 17.5354L12.5006 19.6165C17.1136 27.4854 21.2068 27.5504 19.1277 19.6815L18.2181 16.2998L19.9074 15.9096C24.9102 14.8041 25.5599 14.5439 25.5599 13.6335C25.5599 13.1132 23.6757 11.7475 21.4017 10.642C16.5938 8.23577 16.139 7.71551 16.139 4.46389C16.139 -0.413553 14.6447 -1.25898 11.9808 2.12271ZM7.69269 7.19525C7.69269 7.52041 7.56275 7.84558 7.4328 7.84558C7.23789 7.84558 6.91303 7.52041 6.71812 7.19525C6.5232 6.80506 6.65314 6.54493 6.978 6.54493C7.36783 6.54493 7.69269 6.80506 7.69269 7.19525ZM12.7605 9.27629C13.2153 9.73152 13.5401 11.0972 13.5401 12.3328V14.674L11.4611 12.593C9.70682 10.8371 9.57687 10.3818 10.2916 9.53642C11.2661 8.3008 11.7209 8.23577 12.7605 9.27629ZM8.21247 14.2188C8.34241 14.674 7.75766 14.9992 6.71812 14.9992C5.15879 14.9992 5.02885 14.8691 5.74354 14.0237C6.65314 12.9181 7.75766 12.9831 8.21247 14.2188Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>

          {/* Testimonials - Responsive */}
          <div className="flex flex-col lg:flex-row justify-center space-y-6 lg:space-y-0 lg:space-x-6 overflow-hidden">
            {[1, 2, 3].map((_, index) => (
              <div
                key={index}
                className={`bg-white/10 backdrop-blur-lg rounded-3xl p-4 lg:p-6 w-full max-w-2xl space-y-4 ${index > 0 ? "hidden lg:block" : ""}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gray-400 rounded-full overflow-hidden">
                    <img
                      src="https://api.builder.io/api/v1/image/assets/TEMP/73c843c911c056a8d340e226d62e054705856d24?width=100"
                      alt="Jayesh Patil"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-white font-urbanist text-xl lg:text-2xl font-bold">
                      Jayesh Patil
                    </h4>
                    <p className="text-white font-urbanist text-base lg:text-lg">
                      CEO, Lirante
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-6 h-6 lg:w-8 lg:h-8 fill-orange text-orange"
                      />
                    ))}
                  </div>
                  <span className="text-white font-lufga text-xl lg:text-2xl font-medium">
                    5.0
                  </span>
                </div>

                <p className="text-white font-lufga text-lg lg:text-xl leading-relaxed">
                  consectetur adipiscing elit. Sed congue interdum ligula a
                  dignissim. Lorem ipsum dolor sit amet, consectetur adipiscing
                  elit. Sed lobortis orci elementum egestas lobortis.Sed
                  lobortis orci elementum egestas lobortis.Sed lobortis orci
                  elementum egestas lobortis.
                </p>

                <Quote className="w-24 h-24 lg:w-32 lg:h-32 text-gray-lighter/30 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto max-w-4xl px-4 text-center space-y-12">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-lufga font-bold leading-tight">
            <span className="text-gray-text">
              Have an Awesome Project Idea?{" "}
            </span>
            <span className="text-orange">Let's Discuss</span>
          </h2>

          {/* Email form - Responsive */}
          <div className="flex items-center justify-center max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center w-full border border-gray-border rounded-full p-2 lg:p-4 backdrop-blur-lg space-y-4 sm:space-y-0">
              <div className="flex items-center flex-1 space-x-4 px-4">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-orange-lighter rounded-full flex items-center justify-center">
                  <Send className="w-6 h-6 lg:w-8 lg:h-8 text-orange" />
                </div>
                <span className="text-gray-text font-urbanist text-lg lg:text-xl">
                  Enter Email Address
                </span>
              </div>
              <button className="flex items-center px-8 lg:px-10 py-4 lg:py-5 bg-orange rounded-full">
                <span className="text-white font-urbanist text-lg lg:text-xl font-medium">
                  Send
                </span>
              </button>
            </div>
          </div>

          {/* Stats - Responsive */}
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-8 lg:space-x-16">
            <div className="flex items-center justify-center space-x-3">
              <Star className="w-5 h-5 lg:w-6 lg:h-6 text-gray-text" />
              <span className="text-gray-text font-lufga text-sm lg:text-base">
                4.9/5 Average Ratings
              </span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-5 h-5 lg:w-6 lg:h-6 bg-gray-text rounded"></div>
              <span className="text-gray-text font-lufga text-sm lg:text-base">
                25+ Winning Awards
              </span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-5 h-5 lg:w-6 lg:h-6 bg-gray-text rounded"></div>
              <span className="text-gray-text font-lufga text-sm lg:text-base">
                Certified Product Designer
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Marquee */}
      <div className="bg-orange rounded-t-3xl h-32 lg:h-36 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-12 lg:h-16 bg-white transform -rotate-2 flex items-center justify-center">
          <div className="flex items-center space-x-6 lg:space-x-8 text-black font-lufga text-3xl lg:text-5xl animate-pulse">
            <span>UX Design</span>
            <Star className="w-6 h-6 lg:w-8 lg:h-8 fill-orange text-orange" />
            <span>App Design</span>
            <Star className="w-6 h-6 lg:w-8 lg:h-8 fill-orange text-orange" />
            <span>Dashboard</span>
            <Star className="w-6 h-6 lg:w-8 lg:h-8 fill-orange text-orange" />
            <span>Wireframe</span>
            <Star className="w-6 h-6 lg:w-8 lg:h-8 fill-orange text-orange" />
            <span>User Research</span>
          </div>
        </div>
      </div>

      {/* Blog Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Section header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 space-y-6 lg:space-y-0">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-lufga font-bold text-gray-text">
              From my blog post
            </h2>
            <button className="flex items-center px-8 lg:px-10 py-4 lg:py-5 bg-orange rounded-full">
              <span className="text-white font-lufga text-lg lg:text-xl font-bold">
                See All
              </span>
            </button>
          </div>

          {/* Blog posts - Responsive grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[
              {
                category: "UI/UX Design",
                author: "Salma Chiboub",
                date: "10 Nov, 2023",
                title: "Design Unraveled: Behind the Scenes of UI/UX Magic",
                image:
                  "https://api.builder.io/api/v1/image/assets/TEMP/713973bb10f462b27d845512dfe86444aed090ba?width=832",
              },
              {
                category: "App Design",
                author: "Salma Chiboub",
                date: "09 Oct, 2023",
                title: "Sugee: Loan Management System for Rural Sector.",
                image:
                  "https://api.builder.io/api/v1/image/assets/TEMP/e70658da6b94c97e4da4ce7b0cd18d04f7b7e231?width=832",
              },
              {
                category: "App Design",
                author: "Salma Chiboub",
                date: "13 Aug, 2023",
                title: "Cinetrade: Innovative way to invest in Digital Media",
                image:
                  "https://api.builder.io/api/v1/image/assets/TEMP/713973bb10f462b27d845512dfe86444aed090ba?width=832",
              },
            ].map((post, index) => (
              <article key={index} className="space-y-6">
                <div className="relative group">
                  <div className="aspect-[4/3] bg-gray-200 rounded-2xl overflow-hidden shadow-lg">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <div className="w-20 h-20 lg:w-28 lg:h-28 bg-dark-light rounded-full flex items-center justify-center -rotate-90 group-hover:rotate-0 transition-transform duration-300">
                      <ArrowUpRight className="w-12 h-12 lg:w-16 lg:h-16 text-white rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="inline-block px-6 lg:px-8 py-3 lg:py-4 bg-gray-bg rounded-3xl text-lg lg:text-xl font-inter text-gray-text">
                    {post.category}
                  </span>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-8">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange rounded-full"></div>
                      <span className="text-gray-text font-inter text-lg lg:text-xl">
                        {post.author}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange rounded-full"></div>
                      <span className="text-gray-text font-inter text-lg lg:text-xl">
                        {post.date}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-2xl lg:text-3xl font-lufga text-gray-text leading-tight">
                    {post.title}
                  </h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-lighter rounded-t-3xl" id="contact">
        <div className="container mx-auto max-w-7xl px-4 py-16 lg:py-24">
          {/* Header */}
          <div className="mb-10 lg:mb-14 text-center">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-lufga font-bold text-white leading-tight">
              Contact Me
            </h2>
            <p className="text-white/80 font-lufga text-lg lg:text-xl mt-4">
              I’d love to hear from you. Fill out the form and I’ll get back to you soon.
            </p>
          </div>

          {/* Contact form */}
          <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-6 lg:p-8 mb-12">
            <form onSubmit={handleContactSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-white font-lufga text-sm">Name</label>
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    type="text"
                    name="name"
                    autoComplete="name"
                    className="w-full px-4 py-3 rounded-2xl bg-white text-gray-800 placeholder-gray-500 focus:outline-none"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-white font-lufga text-sm">Email</label>
                  <input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    type="email"
                    name="email"
                    autoComplete="email"
                    className="w-full px-4 py-3 rounded-2xl bg-white text-gray-800 placeholder-gray-500 focus:outline-none"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-white font-lufga text-sm">Subject</label>
                <input
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  type="text"
                  name="subject"
                  className="w-full px-4 py-3 rounded-2xl bg-white text-gray-800 placeholder-gray-500 focus:outline-none"
                  placeholder="Subject"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-white font-lufga text-sm">Message</label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  name="message"
                  rows={6}
                  className="w-full px-4 py-3 rounded-2xl bg-white text-gray-800 placeholder-gray-500 focus:outline-none"
                  placeholder="Write your message..."
                  required
                />
              </div>

              {contactError && (
                <div className="text-red-200 bg-red-500/20 border border-red-400/50 rounded-xl px-4 py-2">
                  {contactError}
                </div>
              )}
              {contactSuccess && (
                <div className="text-green-200 bg-green-500/20 border border-green-400/50 rounded-xl px-4 py-2">
                  {contactSuccess}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={contactLoading}
                  className="inline-flex items-center px-8 lg:px-10 py-4 lg:py-5 bg-orange rounded-full disabled:opacity-60"
                >
                  <span className="text-white font-lufga text-lg lg:text-xl font-bold">
                    {contactLoading ? "Sending..." : "Send Message"}
                  </span>
                </button>
              </div>
            </form>
          </div>

          <hr className="border-gray-lighter mb-8" />

          {/* Footer bottom */}
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <p className="text-white font-lufga text-lg lg:text-xl text-center lg:text-left">
              Copyright© 2023 Salma. All Rights Reserved.
            </p>
            <p className="text-white font-lufga text-lg lg:text-xl text-center lg:text-right">
              User Terms & Conditions | Privacy Policy
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
