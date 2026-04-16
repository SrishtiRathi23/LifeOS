import { useState, useRef, useEffect, useMemo } from "react";
import { useVisionStore } from "@/store/visionStore";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Settings, Printer, X, Trash, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useConfirm } from "@/contexts/ConfirmContext";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";

// Seeded random for consistent rotations without jumping
const getRotation = (seed: string | number) => {
  let h = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  const rand = Math.abs(h) / 2147483648; 
  return (rand * 8) - 4; // -4 to +4 degrees
};

// Base URL helper
const getImageUrl = (filename: string) => `http://localhost:4000/uploads/${filename}`;

function BoardSettingsPanel() {
  const { settings, saveSettings, isSettingsOpen, setSettingsOpen } = useVisionStore();

  if (!isSettingsOpen || !settings) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm transition-opacity" onClick={() => setSettingsOpen(false)} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm transform overflow-y-auto bg-cream p-6 shadow-2xl transition-transform duration-300 ease-out sm:w-96">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-2xl italic text-ink">Board Settings</h2>
          <button onClick={() => setSettingsOpen(false)} className="text-ink/60 hover:text-ink"><X size={20} /></button>
        </div>

        <div className="space-y-8">
          <section>
            <label className="block text-sm font-medium text-ink mb-3">Collage Layout</label>
            <div className="grid grid-cols-2 gap-3">
              {["polaroid", "masonry", "magazine", "film", "mood", "grid"].map((lyt) => (
                <button
                  key={lyt}
                  onClick={() => saveSettings({ layout: lyt })}
                  className={`rounded-xl border p-3 text-center transition-all ${settings.layout === lyt ? "border-terracotta bg-terracotta/5" : "border-line bg-white/50 hover:bg-white"}`}
                >
                  <span className="text-sm capitalize">{lyt}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <label className="block text-sm font-medium text-ink mb-3">Background</label>
            <div className="flex flex-wrap gap-2">
              {[
                { hex: "#FDF6EE", name: "Parchment" },
                { hex: "#FAFAFA", name: "White" },
                { hex: "#F9E8E4", name: "Blush" },
                { hex: "#E8EFE4", name: "Sage" },
                { hex: "#EAE4F2", name: "Lavender" },
                { hex: "#2C2420", name: "Dark" }
              ].map((bg) => (
                <button
                  key={bg.hex}
                  onClick={() => saveSettings({ background: bg.hex })}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${settings.background === bg.hex ? "border-terracotta scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: bg.hex }}
                  title={bg.name}
                />
              ))}
            </div>
          </section>

          <section>
            <label className="block text-sm font-medium text-ink mb-3">Frame Style</label>
            <select
              value={settings.frameStyle}
              onChange={(e) => saveSettings({ frameStyle: e.target.value })}
              className="w-full rounded-xl border border-line bg-white px-4 py-2.5 outline-none"
            >
              <option value="polaroid">Polaroid Photo</option>
              <option value="thin">Thin White Border</option>
              <option value="rounded">Soft Rounded (No Border)</option>
              <option value="none">No Frame</option>
            </select>
          </section>

          <section>
            <label className="block text-sm font-medium text-ink mb-3">Mood Filter</label>
            <select
              value={settings.moodFilter}
              onChange={(e) => saveSettings({ moodFilter: e.target.value })}
              className="w-full rounded-xl border border-line bg-white px-4 py-2.5 outline-none"
            >
              <option value="none">None</option>
              <option value="sepia(20%) saturate(110%)">Warm Vintage</option>
              <option value="hue-rotate(320deg) saturate(120%)">Rose Tint</option>
              <option value="opacity(85%) brightness(110%) contrast(90%)">Faded Dream</option>
              <option value="saturate(140%) contrast(105%)">Vivid Colors</option>
              <option value="grayscale(100%)">Black & White</option>
            </select>
          </section>

          <section>
            <label className="block text-sm font-medium text-ink mb-3">Aspect Ratio</label>
            <div className="flex gap-2 bg-white/50 p-1 rounded-lg border border-line">
              {['portrait', 'square', 'landscape'].map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => saveSettings({ aspectRatio: ratio })}
                  className={`flex-1 py-1.5 text-xs uppercase tracking-wider rounded-md transition-all ${settings.aspectRatio === ratio ? 'bg-terracotta text-white' : 'text-ink/60 hover:text-ink'}`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </section>

          <Button className="w-full" onClick={() => setSettingsOpen(false)}>Done</Button>
        </div>
      </div>
    </>
  );
}

function BoardPrintPreview({ boardRef }: { boardRef: React.RefObject<HTMLDivElement> }) {
  const { isPrintPreviewOpen, setPrintPreviewOpen, settings } = useVisionStore();
  const [quality, setQuality] = useState(2);
  const [isExporting, setIsExporting] = useState(false);

  if (!isPrintPreviewOpen) return null;

  const handleDownload = async () => {
    if (!boardRef.current) return;
    setIsExporting(true);
    toast.loading("Generating canvas...", { id: "print" });
    try {
      const canvas = await html2canvas(boardRef.current, {
        scale: quality,
        useCORS: true,
        backgroundColor: settings?.background || "#FDF6EE",
        logging: false
      });
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `Vision-Board-2026-${Date.now()}.png`;
      a.click();
      toast.success("Downloaded successfully!", { id: "print" });
      setPrintPreviewOpen(false);
    } catch (e) {
      toast.error("Failed to generate image.", { id: "print" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-ink/50 backdrop-blur-md" onClick={() => setPrintPreviewOpen(false)} />
      <div className="fixed left-1/2 top-1/2 z-[70] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-cream p-8 shadow-2xl">
        <h3 className="font-serif text-2xl italic text-ink mb-6">Print or Download</h3>
        
        <div className="space-y-4 mb-8">
          <div>
            <label className="text-sm font-medium text-ink block mb-2">Export Quality (Resolution Scale)</label>
            <div className="flex bg-white/50 border border-line rounded-xl p-1">
              {[1, 2, 3].map(scale => (
                <button
                  key={scale}
                  onClick={() => setQuality(scale)}
                  className={`flex-1 py-2 text-sm rounded-lg transition-colors ${quality === scale ? 'bg-terracotta text-white' : 'hover:bg-white'}`}
                >
                  {scale}x {scale === 3 ? '(HD)' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => window.print()} className="w-full">
            <Printer size={16} className="mr-2" /> PDF / Print
          </Button>
          <Button disabled={isExporting} onClick={handleDownload} className="w-full">
            {isExporting ? "Rendering..." : "Save Image"}
          </Button>
        </div>
      </div>
    </>
  );
}

function BoardManageView() {
  const { images, setManageMode, addImage, updateImage, deleteImage, replaceImage } = useVisionStore();
  const confirm = useConfirm();
  
  // Local state for the add form
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [affirmation, setAffirmation] = useState("");
  const [category, setCategory] = useState("Other");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return toast.error("Please select an image");
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("title", title);
      fd.append("affirmation", affirmation);
      fd.append("category", category);
      fd.append("year", year);
      await addImage(fd);
      setFile(null);
      setTitle("");
      setAffirmation("");
      toast.success("Image added to vision board");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-3xl italic text-ink">Manage Vision Images</h2>
        <Button variant="outline" onClick={() => setManageMode(false)}>
          <ArrowLeft size={16} className="mr-2" /> Back to Board
        </Button>
      </div>

      <div className="rounded-3xl border border-line bg-cream p-6 shadow-sm">
        <h3 className="font-serif text-xl text-ink mb-4">Add New Image</h3>
        <div className="grid gap-6 md:grid-cols-2">
          {/* File Drop Area */}
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-terracotta/30 bg-white/50 p-6 text-center hover:bg-white/80 transition-colors">
            {file ? (
              <div className="flex flex-col items-center">
                <p className="text-sm font-medium text-ink">{file.name}</p>
                <button onClick={() => setFile(null)} className="mt-2 text-xs text-terracotta hover:underline">Remove</button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center">
                <div className="rounded-full bg-terracotta/10 p-3 mb-3 text-terracotta"><ImageIcon size={24} /></div>
                <span className="text-sm font-medium">Click to upload</span>
                <span className="text-xs text-ink/50 mt-1">JPG, PNG, WEBP, GIF (Max 10MB)</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
            )}
          </div>

          <div className="space-y-3">
            <Input placeholder="Title (e.g. Dream House)" value={title} onChange={e => setTitle(e.target.value)} />
            <Input placeholder="Affirmation (I will...)" value={affirmation} onChange={e => setAffirmation(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <select value={category} onChange={e => setCategory(e.target.value)} className="rounded-xl border border-line px-3 py-2 text-sm outline-none bg-white">
                <option value="Career">Career</option>
                <option value="Finance">Finance</option>
                <option value="Health">Health</option>
                <option value="Travel">Travel</option>
                <option value="Relationships">Relationships</option>
                <option value="Other">Other</option>
              </select>
              <Input placeholder="Year" value={year} onChange={e => setYear(e.target.value)} />
            </div>
            <Button onClick={handleUpload} disabled={isUploading || !file} className="w-full">
              {isUploading ? "Uploading..." : "Add to Board"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img) => (
          <div key={img.id} className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all hover:shadow-md">
            <div className="relative aspect-square w-full bg-cream/50">
              <img src={getImageUrl(img.filename)} alt={img.title || "Vision"} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-ink/60 opacity-0 transition-opacity group-hover:opacity-100">
                <label className="cursor-pointer rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink shadow-lg hover:scale-105 transition-transform">
                  Replace
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && replaceImage(img.id, e.target.files[0])} />
                </label>
              </div>
            </div>
            <div className="flex flex-col flex-1 p-4">
              <input
                className="w-full bg-transparent font-serif text-lg text-ink outline-none mb-1 border-b border-transparent focus:border-line"
                value={img.title || ""}
                onChange={(e) => updateImage(img.id, { title: e.target.value })}
                placeholder="Title..."
              />
              <textarea
                className="w-full flex-1 resize-none bg-transparent text-sm text-ink/70 outline-none border-b border-transparent focus:border-line"
                value={img.affirmation || ""}
                onChange={(e) => updateImage(img.id, { affirmation: e.target.value })}
                placeholder="Affirmation..."
                rows={2}
              />
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <span className="text-xs uppercase tracking-widest text-ink/40">{img.category}</span>
                <button
                  type="button"
                  onClick={async () => {
                    if (await confirm({ title: "Delete Image", message: "Remove this from your board forever?" })) {
                      deleteImage(img.id);
                    }
                  }}
                  className="text-terracotta/60 hover:text-terracotta transition-colors"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoardCollageView() {
  const { images, settings } = useVisionStore();
  const boardRef = useRef<HTMLDivElement>(null);

  if (!settings) return null;

  if (images.length === 0) {
    return (
      <EmptyState
        title="Your vision awaits"
        description="Switch to Manage Mode to add your first images and start creating your manifestation collage."
      />
    );
  }

  // Styles dynamically computed from settings
  const aspectClass = settings.aspectRatio === 'square' ? 'aspect-square' : settings.aspectRatio === 'landscape' ? 'aspect-video' : 'min-h-[80vh]';
  const filterStyle = settings.moodFilter !== 'none' ? { filter: settings.moodFilter } : {};
  
  // Render based on Layout mapping
  return (
    <div 
      ref={boardRef}
      className={`relative w-full overflow-hidden rounded-[2rem] border border-line/20 shadow-2xl transition-all duration-700 ${aspectClass}`}
      style={{ backgroundColor: settings.background }}
    >
      <div className="absolute inset-0 p-8 sm:p-12 overflow-y-auto overflow-x-hidden custom-scrollbar">
        
        {settings.layout === "polaroid" && (
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 pb-20">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative bg-white p-3 sm:p-4 pb-12 sm:pb-16 shadow-[2px_8px_24px_rgba(0,0,0,0.12)] transition-all hover:z-10 hover:scale-105 hover:-translate-y-2 hover:shadow-[4px_12px_32px_rgba(0,0,0,0.2)]"
                style={{ 
                  width: 'calc(100% / 2 - 1rem)', 
                  maxWidth: '280px',
                  transform: `rotate(${getRotation(img.id)}deg)` 
                }}
              >
                <img src={getImageUrl(img.filename)} alt="" className="aspect-square w-full object-cover" style={filterStyle} />
                <p className="absolute bottom-4 left-6 right-6 text-center font-script text-xl text-ink leading-tight">{img.title}</p>
                
                {/* Hover Reveal Card */}
                <div className="absolute inset-x-0 bottom-0 top-1/2 flex flex-col items-center justify-end overflow-hidden border-t-2 border-white/20 bg-ink/90 p-4 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:top-0 group-hover:opacity-100">
                  <h4 className="font-serif text-xl italic text-white text-center mb-2">{img.title}</h4>
                  <p className="text-sm text-center text-white/80 line-clamp-3 italic mb-4">{img.affirmation}</p>
                  <span className="rounded-full bg-terracotta px-3 py-1 text-xs uppercase tracking-widest text-white">{img.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {settings.layout === "masonry" && (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
            {images.map((img) => (
              <div key={img.id} className="group relative break-inside-avoid overflow-hidden rounded-xl shadow-md transition-all hover:shadow-xl">
                <img src={getImageUrl(img.filename)} alt="" className="w-full object-cover block" style={filterStyle} />
                <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-ink/90 to-transparent p-5 pb-4 transition-transform duration-300 group-hover:translate-y-0">
                  <p className="font-serif text-lg italic text-white">{img.title}</p>
                  <p className="mt-1 text-xs text-white/80 line-clamp-2">{img.affirmation}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {settings.layout === "grid" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {images.map((img) => (
              <div key={img.id} className={`group relative overflow-hidden bg-white shadow-sm transition-all hover:shadow-lg ${settings.frameStyle === 'rounded' ? 'rounded-2xl' : settings.frameStyle === 'thin' ? 'border-[3px] border-white' : ''}`}>
                <img src={getImageUrl(img.filename)} alt="" className="aspect-square w-full object-cover" style={filterStyle} />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/80 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <p className="font-serif text-white">{img.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {settings.layout === "film" && (
          <div className="flex h-[400px] w-full gap-2 overflow-x-auto overflow-y-hidden border-[16px] border-[#1a1a1a] bg-[#1a1a1a] p-2 custom-scrollbar">
            {images.map((img) => (
              <div key={img.id} className="relative h-full shrink-0 bg-transparent group">
                 {/* Sprocket holes using borders */}
                <div className="absolute -top-6 left-0 right-0 h-4 flex justify-between px-2">
                  {[...Array(6)].map((_, i) => <div key={i} className="h-4 w-4 rounded-sm bg-cream"></div>)}
                </div>
                <img src={getImageUrl(img.filename)} alt="" className="h-full w-auto object-cover opacity-90 sepia-[.3]" style={filterStyle} />
                <div className="absolute -bottom-6 left-0 right-0 h-4 flex justify-between px-2">
                  {[...Array(6)].map((_, i) => <div key={i} className="h-4 w-4 rounded-sm bg-cream"></div>)}
                </div>
                {/* Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm">
                  <p className="text-white font-script text-3xl px-6 text-center">{img.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Simple Fallbacks for mood/magazine to map smoothly within space */}
        {(settings.layout === "magazine" || settings.layout === "mood") && (
           <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {images.map((img) => (
              <div key={img.id} className="group relative break-inside-avoid shadow-lg bg-white p-2">
                <img src={getImageUrl(img.filename)} alt="" className="w-full object-cover grayscale-[0.2] contrast-125" style={filterStyle} />
                <div className="p-4 bg-white border-t border-line/30">
                  <h3 className="font-serif text-2xl font-bold uppercase tracking-widest text-ink">{img.title}</h3>
                  <p className="mt-2 text-xs italic leading-relaxed text-ink/70">{img.affirmation}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export function VisionBoardPage() {
  const { fetchImages, fetchSettings, isManageMode, setManageMode, setSettingsOpen, setPrintPreviewOpen } = useVisionStore();
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSettings();
    fetchImages();
  }, []);

  return (
    <section className="relative mx-auto max-w-[1400px] min-h-[calc(100vh-6rem)] space-y-6 px-4 py-8 md:px-8">
      
      {/* Top Application Header */}
      {!isManageMode && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-30 bg-body/80 backdrop-blur-md pb-4 pt-2 -mt-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-terracotta mb-2 font-semibold">LifeOS</p>
            <h1 className="font-serif text-4xl italic text-ink">My Vision Board 2026</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="rounded-full px-5 text-sm" onClick={() => setPrintPreviewOpen(true)}>
              <Printer size={16} className="mr-2" /> Print & Export
            </Button>
            <Button variant="outline" className="rounded-full px-5 text-sm" onClick={() => setManageMode(true)}>
              <Settings size={16} className="mr-2" /> Manage Content
            </Button>
            <Button className="rounded-full px-5 text-sm shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5" onClick={() => setSettingsOpen(true)}>
              <Settings size={16} className="mr-2" /> Board Styles
            </Button>
          </div>
        </div>
      )}

      {/* Main Feature Modes */}
      <div ref={boardRef} className="print:block">
        {isManageMode ? <BoardManageView /> : <BoardCollageView />}
      </div>

      {/* Panels */}
      <BoardSettingsPanel />
      <BoardPrintPreview boardRef={boardRef} />
      
    </section>
  );
}
