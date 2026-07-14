import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Palette, 
  Type, 
  Layout, 
  Layers, 
  Activity, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  Info, 
  X, 
  FileCode, 
  Terminal, 
  Upload, 
  CheckCircle2, 
  Sliders, 
  Eye, 
  EyeOff,
  SlidersHorizontal,
  ChevronDown,
  ExternalLink,
  BookOpen,
  MousePointer,
  Maximize2
} from "lucide-react";
import { useToast } from "../ui/Toast";
import { Modal, Drawer } from "../ui/Dialogs";
import { DesignTokens } from "../../config/designTokens";

export default function DesignSystemShowcase() {
  const { success, error, info } = useToast();
  
  // Interactive navigation
  const [activeDSSection, setActiveDSSection] = useState<"foundations" | "inputs" | "components" | "playgrounds">("foundations");
  
  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form Fields State
  const [textInput, setTextInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedOption, setSelectedOption] = useState("Vercel");
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [switchToggled, setSwitchToggled] = useState(true);
  const [sliderValue, setSliderValue] = useState(80);

  // Accordion State
  const [accordionOpen, setAccordionOpen] = useState<{ [key: string]: boolean }>({
    sec1: true,
    sec2: false
  });

  // Drag and Drop File Simulation State
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Toast test handler
  const triggerToastTest = (type: "success" | "error" | "info" | "warning") => {
    switch (type) {
      case "success":
        success("System Sync Success", "Authored database fields successfully synchronized to Supabase cluster.");
        break;
      case "error":
        error("Action Aborted", "Security constraints rejected candidate code submission. Code contains unverified symbols.");
        break;
      case "warning":
        info("Trust Rating Warning", "Completing an active challenge late decreases candidate Trust multiplier.");
        break;
      case "info":
        info("Connection Restored", "Live communication websockets rejoined standard system cluster.");
        break;
    }
  };

  // Toggle Accordion Helper
  const toggleAccordion = (key: string) => {
    setAccordionOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Drag & Drop simulation handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setUploadedFiles(prev => [...prev, ...files]);
      success("Files Received", `Successfully uploaded ${files.length} code document(s).`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
      success("Files Selected", `Successfully added ${files.length} document(s).`);
    }
  };

  const clearFiles = () => {
    setUploadedFiles([]);
    info("Upload cleared", "All pending candidate assets have been deleted from local frame cache.");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50/50 p-6 space-y-8 select-none">
      
      {/* 1. MASTER HEADER WITH CONTEXTUAL METADATA */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-neutral-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 border border-neutral-200 text-neutral-500 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>SaaS Core v1.0.0-fndtn</span>
          </div>
          <h1 className="font-display font-black text-4xl text-neutral-900 tracking-tight">
            Design System & Guidelines
          </h1>
          <p className="font-sans text-xs text-neutral-400 mt-1 max-w-xl font-light leading-relaxed">
            A meticulous, high-integrity design framework engineered for KONEXA. Rooted in pure contrast layouts, 
            generous negative space, clean typography scales, and absolute visual rhythm.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 bg-neutral-900 text-white text-[11px] font-mono font-bold rounded-xl border border-neutral-850 shadow-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Theme: Slate Light
          </div>
        </div>
      </div>

      {/* 2. TABBED CONTROLS */}
      <div className="max-w-6xl mx-auto">
        <div className="flex border-b border-neutral-200 gap-1 overflow-x-auto">
          {(["foundations", "inputs", "components", "playgrounds"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveDSSection(tab)}
              className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeDSSection === tab
                  ? "border-black text-black font-black"
                  : "border-transparent text-neutral-400 hover:text-neutral-600 hover:border-neutral-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 3. DYNAMIC CONTENT PANEL */}
      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: FOUNDATIONS */}
          {activeDSSection === "foundations" && (
            <motion.div
              key="foundations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Color Swatches Grid */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-neutral-900" />
                  <h3 className="font-display font-extrabold text-lg text-neutral-900">1. Color Palette Swatches</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {/* Primary Black */}
                  <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-3">
                    <div className="w-full h-16 bg-black rounded-xl border border-neutral-900" />
                    <div>
                      <span className="font-sans font-bold text-xs text-neutral-800 block">Brand Primary</span>
                      <span className="font-mono text-[10px] text-neutral-400">#000000</span>
                    </div>
                  </div>
                  {/* Trust Emerald */}
                  <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-3">
                    <div className="w-full h-16 bg-emerald-500 rounded-xl border border-emerald-600" />
                    <div>
                      <span className="font-sans font-bold text-xs text-neutral-800 block">Trust Emerald</span>
                      <span className="font-mono text-[10px] text-neutral-400">#10B981</span>
                    </div>
                  </div>
                  {/* Border Light */}
                  <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-3">
                    <div className="w-full h-16 bg-neutral-200 rounded-xl" />
                    <div>
                      <span className="font-sans font-bold text-xs text-neutral-800 block">Border Gray</span>
                      <span className="font-mono text-[10px] text-neutral-400">#E5E5E5</span>
                    </div>
                  </div>
                  {/* Subtle Background */}
                  <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-3">
                    <div className="w-full h-16 bg-neutral-50 rounded-xl" />
                    <div>
                      <span className="font-sans font-bold text-xs text-neutral-800 block">Neutral Muted</span>
                      <span className="font-mono text-[10px] text-neutral-400">#FAFAFA</span>
                    </div>
                  </div>
                  {/* Threat Crimson */}
                  <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-3">
                    <div className="w-full h-16 bg-red-500 rounded-xl border border-red-600" />
                    <div>
                      <span className="font-sans font-bold text-xs text-neutral-800 block">Danger Red</span>
                      <span className="font-mono text-[10px] text-neutral-400">#EF4444</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography hierarchy */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Type className="w-5 h-5 text-neutral-900" />
                  <h3 className="font-display font-extrabold text-lg text-neutral-900">2. Typography Hierarchy</h3>
                </div>
                <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm divide-y divide-neutral-100">
                  <div className="py-4 first:pt-0 grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <span className="font-mono text-xs text-neutral-400">font-display/font-black/3xl</span>
                    <h1 className="md:col-span-3 font-display font-black text-3xl text-neutral-900 tracking-tight">
                      Project → Trust → Employment
                    </h1>
                  </div>
                  <div className="py-4 grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <span className="font-mono text-xs text-neutral-400">font-display/font-bold/lg</span>
                    <h3 className="md:col-span-3 font-display font-bold text-lg text-neutral-900">
                      Real engineering milestones build durable trust
                    </h3>
                  </div>
                  <div className="py-4 grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <span className="font-mono text-xs text-neutral-400">font-sans/font-regular/xs</span>
                    <p className="md:col-span-3 font-sans text-xs text-neutral-500 leading-relaxed font-light">
                      This is the primary body copy format designed for descriptions, explanations, and instructions. 
                      Legible, balanced negative space, and low-contrast details ensure high eye safety under lengthy review periods.
                    </p>
                  </div>
                  <div className="py-4 last:pb-0 grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <span className="font-mono text-xs text-neutral-400">font-mono/text-[10px]/bold</span>
                    <span className="md:col-span-3 font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                      SYSTEM_TRACE_LOG_VERIFIED: ok
                    </span>
                  </div>
                </div>
              </div>

              {/* Rhythm & Spacing documentation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-display font-bold text-base text-neutral-900 flex items-center gap-1.5">
                    <Sliders className="w-4.5 h-4.5 text-neutral-500" />
                    Rhythm Spacing Grid
                  </h4>
                  <div className="bg-white border border-neutral-200 rounded-3xl p-5 space-y-3.5 shadow-sm text-xs font-sans">
                    <p className="text-neutral-400 font-light">KONEXA enforces a modular 4px grid. Standard padding mappings:</p>
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="flex justify-between items-center bg-neutral-50 p-2.5 border border-neutral-200/50 rounded-xl">
                        <span className="font-bold">spacing-2 (8px)</span>
                        <span className="text-neutral-400">Small padding, labels, tag margins</span>
                      </div>
                      <div className="flex justify-between items-center bg-neutral-50 p-2.5 border border-neutral-200/50 rounded-xl">
                        <span className="font-bold">spacing-4 (16px)</span>
                        <span className="text-neutral-400">Standard buttons padding, inputs, item list spacing</span>
                      </div>
                      <div className="flex justify-between items-center bg-neutral-50 p-2.5 border border-neutral-200/50 rounded-xl">
                        <span className="font-bold">spacing-6 (24px)</span>
                        <span className="text-neutral-400">Main card contents, modal spacing, dashboard grid gaps</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-display font-bold text-base text-neutral-900 flex items-center gap-1.5">
                    <Layers className="w-4.5 h-4.5 text-neutral-500" />
                    Radius & Soft Elevations
                  </h4>
                  <div className="bg-white border border-neutral-200 rounded-3xl p-5 space-y-3.5 shadow-sm text-xs font-sans">
                    <p className="text-neutral-400 font-light">Elegance is established through matching corner radii with proper elevation:</p>
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="flex justify-between items-center bg-neutral-50 p-2.5 border border-neutral-200/50 rounded-xl">
                        <span className="font-bold">radius-sm (6px)</span>
                        <span className="text-neutral-400">Buttons, action tags</span>
                      </div>
                      <div className="flex justify-between items-center bg-neutral-50 p-2.5 border border-neutral-200/50 rounded-xl">
                        <span className="font-bold">radius-xl (16px)</span>
                        <span className="text-neutral-400">Primary workspace blocks</span>
                      </div>
                      <div className="flex justify-between items-center bg-neutral-50 p-2.5 border border-neutral-200/50 rounded-xl">
                        <span className="font-bold">radius-3xl (28px)</span>
                        <span className="text-neutral-400">Interactive modals & full panels</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: INPUTS & FORM CONTROLS */}
          {activeDSSection === "inputs" && (
            <motion.div
              key="inputs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {/* Interactive Form fields */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-5">
                <h4 className="font-display font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">Form Fields Playground</h4>
                
                {/* Text Field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Text Field Input</label>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type anything to test state change..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs font-sans text-neutral-700 focus:outline-hidden focus:border-black/60 focus:bg-white transition-all duration-200"
                  />
                  {textInput && (
                    <span className="text-[10px] text-neutral-400 font-mono block mt-1">Live value: <strong className="text-neutral-700">{textInput}</strong></span>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Secure Password Input</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter a secure verification token"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-4 pr-10 py-2.5 text-xs font-sans text-neutral-700 focus:outline-hidden focus:border-black/60 focus:bg-white transition-all duration-200"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Combobox Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Corporate Sponsor Combobox</label>
                  <div className="relative">
                    <select
                      value={selectedOption}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs font-sans text-neutral-700 focus:outline-hidden focus:border-black/60 focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="Vercel">▲ Vercel Partner (Sponsor)</option>
                      <option value="Stripe">⌗ Stripe Integrations</option>
                      <option value="Linear">⎋ Linear Task Force</option>
                      <option value="Figma">❖ Figma Design Systems</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Toggles & Checkbox Controls */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-6">
                <h4 className="font-display font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">Toggles & Checks</h4>
                
                {/* Checkbox item */}
                <div className="flex gap-3 items-start cursor-pointer select-none" onClick={() => setCheckboxChecked(!checkboxChecked)}>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    checkboxChecked ? "bg-black border-black text-white" : "bg-neutral-50 border-neutral-200"
                  }`}>
                    {checkboxChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-800 block">Required Security Checkbox</span>
                    <p className="text-[10px] text-neutral-400 font-light mt-0.5">I verify that all code submissions abide by the open-source license agreement.</p>
                  </div>
                </div>

                {/* Switch toggler */}
                <div className="flex gap-3 items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-neutral-800 block">Live Simulation Pipeline</span>
                    <p className="text-[10px] text-neutral-400 font-light mt-0.5">Bypasses production APIs to use instant mock data sandboxes.</p>
                  </div>
                  <button
                    onClick={() => setSwitchToggled(!switchToggled)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-all cursor-pointer ${
                      switchToggled ? "bg-emerald-500" : "bg-neutral-200"
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      switchToggled ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* Range Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-800">Minimum Trust Multiplier</span>
                    <span className="font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg text-[10px]">
                      {sliderValue}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    value={sliderValue}
                    onChange={(e) => setSliderValue(parseInt(e.target.value))}
                    className="w-full accent-black h-1.5 bg-neutral-100 rounded-lg cursor-pointer"
                  />
                  <span className="text-[9px] text-neutral-400 font-mono block">Limits matching indexes to high integrity students</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: COMMON COMPONENTS */}
          {activeDSSection === "components" && (
            <motion.div
              key="components"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Buttons gallery */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="font-display font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">SaaS Buttons Library</h4>
                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-sans text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm">
                    Primary Button
                  </button>
                  <button className="px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 font-sans text-xs font-semibold rounded-xl transition-all cursor-pointer">
                    Secondary Outlined
                  </button>
                  <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/10 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Success Verified
                  </button>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-sans text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-md shadow-red-600/10">
                    Destructive Action
                  </button>
                  <button disabled className="px-4 py-2 bg-neutral-100 text-neutral-300 font-sans text-xs font-semibold rounded-xl transition-all cursor-not-allowed">
                    Disabled State
                  </button>
                </div>
              </div>

              {/* Stat & Metric Cards */}
              <div className="space-y-4">
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Interactive Data Metrics</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-sm hover:shadow-premium transition-all duration-300 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">System Trust Score</span>
                      <h4 className="text-3xl font-display font-black text-neutral-900 mt-1">94%</h4>
                      <p className="text-[10px] text-neutral-400 font-light mt-0.5">Top tier corporate verified rating</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>

                  <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-sm hover:shadow-premium transition-all duration-300 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Escrow Ledger</span>
                      <h4 className="text-3xl font-display font-black text-neutral-900 mt-1">$12,400</h4>
                      <p className="text-[10px] text-neutral-400 font-light mt-0.5">Allocated active student payouts</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900 font-mono text-sm font-bold">
                      $
                    </div>
                  </div>

                  <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-sm hover:shadow-premium transition-all duration-300 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Completed Tasks</span>
                      <h4 className="text-3xl font-display font-black text-neutral-900 mt-1">1,248</h4>
                      <p className="text-[10px] text-neutral-400 font-light mt-0.5">Verified sandbox compilations</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400">
                      <FileCode className="w-5 h-5 text-neutral-700" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Accordion List Component */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="font-display font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">Visual Accordions</h4>
                <div className="space-y-3">
                  
                  {/* Item 1 */}
                  <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white">
                    <button
                      onClick={() => toggleAccordion("sec1")}
                      className="w-full p-4 flex justify-between items-center text-left hover:bg-neutral-50 transition-colors cursor-pointer font-sans font-bold text-xs text-neutral-800"
                    >
                      <span>1. What models evaluate the candidate submissions?</span>
                      <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${accordionOpen["sec1"] ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {accordionOpen["sec1"] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-neutral-100 bg-neutral-50/40"
                        >
                          <p className="p-4 text-[11px] text-neutral-400 font-light leading-relaxed">
                            KONEXA forwards code assets to a server-side sandbox coupled with Gemini 2.5 models. 
                            The pipeline scores syntactic cleanliness, types coverage, architectural consistency, and performance guidelines.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Item 2 */}
                  <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white">
                    <button
                      onClick={() => toggleAccordion("sec2")}
                      className="w-full p-4 flex justify-between items-center text-left hover:bg-neutral-50 transition-colors cursor-pointer font-sans font-bold text-xs text-neutral-800"
                    >
                      <span>2. Are my financial details stored on public nodes?</span>
                      <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${accordionOpen["sec2"] ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {accordionOpen["sec2"] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-neutral-100 bg-neutral-50/40"
                        >
                          <p className="p-4 text-[11px] text-neutral-400 font-light leading-relaxed">
                            Never. Financial routing and contract data are escrowed within highly secure, verified compliance accounts in our partner-isolated cloud databases.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: INTERACTIVE PLAYGROUNDS */}
          {activeDSSection === "playgrounds" && (
            <motion.div
              key="playgrounds"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Toasts and Modals launcher */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-5">
                <h4 className="font-display font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">Toasts & Portal Launchers</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Toasts tester row */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">1. Trigger Global Alerts</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => triggerToastTest("success")}
                        className="px-3 py-2 text-[10px] font-bold border border-neutral-200 rounded-xl bg-white hover:bg-neutral-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-neutral-700"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Success Toast</span>
                      </button>
                      <button
                        onClick={() => triggerToastTest("error")}
                        className="px-3 py-2 text-[10px] font-bold border border-neutral-200 rounded-xl bg-white hover:bg-neutral-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-neutral-700"
                      >
                        <X className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                        <span>Error Toast</span>
                      </button>
                      <button
                        onClick={() => triggerToastTest("warning")}
                        className="px-3 py-2 text-[10px] font-bold border border-neutral-200 rounded-xl bg-white hover:bg-neutral-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-neutral-700"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <span>Warning Toast</span>
                      </button>
                      <button
                        onClick={() => triggerToastTest("info")}
                        className="px-3 py-2 text-[10px] font-bold border border-neutral-200 rounded-xl bg-white hover:bg-neutral-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-neutral-700"
                      >
                        <Info className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Info Toast</span>
                      </button>
                    </div>
                  </div>

                  {/* Overlays launchers */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">2. Standard Overlays Portal</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Open Modal Layout</span>
                      </button>
                      <button
                        onClick={() => setIsDrawerOpen(true)}
                        className="flex-1 px-4 py-2.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Layout className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Open Side Drawer</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive File Drag & Drop Simulation */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                  <h4 className="font-display font-bold text-sm text-neutral-900">Drag & Drop Sandbox Uploader</h4>
                  {uploadedFiles.length > 0 && (
                    <button
                      onClick={clearFiles}
                      className="text-[10px] font-mono font-bold text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      Clear Files Cache
                    </button>
                  )}
                </div>

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`w-full min-h-[160px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center transition-all ${
                    dragActive 
                      ? "border-emerald-500 bg-emerald-50/20" 
                      : "border-neutral-200 bg-neutral-50 hover:bg-neutral-50/80"
                  }`}
                >
                  <Upload className={`w-8 h-8 mb-3 transition-transform ${dragActive ? "text-emerald-500 scale-110" : "text-neutral-400"}`} />
                  <div>
                    <span className="text-xs font-bold text-neutral-800 block">Drag & Drop code files here</span>
                    <p className="text-[10px] text-neutral-400 font-light mt-0.5">Supports TS, TSX, JS, or JSON up to 10MB</p>
                  </div>
                  <label className="mt-4 px-3.5 py-1.5 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl text-[10px] font-bold text-neutral-700 cursor-pointer shadow-xs">
                    Choose Local Files
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Staged Documents:</span>
                    <div className="divide-y divide-neutral-100 border border-neutral-200/60 rounded-xl overflow-hidden bg-neutral-50/30">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between text-xs font-sans text-neutral-600">
                          <div className="flex items-center gap-2">
                            <FileCode className="w-4 h-4 text-neutral-400 shrink-0" />
                            <span className="font-bold text-neutral-800 truncate max-w-xs">{file.name}</span>
                          </div>
                          <span className="font-mono text-[10px] text-neutral-400">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* 4. MODALS & DRAWERS RENDERING TEST PORTAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Sample Overlay Modal Framework"
      >
        <div className="space-y-4 font-sans text-xs">
          <p className="text-neutral-500 leading-relaxed font-light">
            You are viewing the core system overlay dialog window. It features automatic body-scroll lock overrides, 
            smooth spring animation scaling, backdrop blur filters, and direct accessibility-compliant focus bounds.
          </p>
          <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl flex gap-2 items-start text-neutral-600">
            <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-neutral-800">Accessibility Compliant:</span>
              <p className="mt-0.5 text-[11px] font-light leading-relaxed">This overlay handles escape key bindings and focuses the primary action on trigger.</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-3 border-t border-neutral-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-neutral-200 rounded-xl font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                setIsModalOpen(false);
                success("Action Verified", "Confirmation event emitted successfully.");
              }}
              className="px-5 py-2 bg-black text-white hover:bg-neutral-800 rounded-xl font-bold cursor-pointer"
            >
              Verify Action
            </button>
          </div>
        </div>
      </Modal>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Interactive System Settings"
      >
        <div className="space-y-5 font-sans text-xs h-full flex flex-col justify-between">
          <div className="space-y-4">
            <p className="text-neutral-500 leading-relaxed font-light">
              Drawers slide cleanly from the right margin. Perfect for advanced configuration sliders, logs, 
              or quick profile edits.
            </p>
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">System Preferences</span>
              <div className="flex justify-between items-center">
                <span>Enable Audio Synthesis</span>
                <button
                  onClick={() => setSwitchToggled(!switchToggled)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-all cursor-pointer ${
                    switchToggled ? "bg-emerald-500" : "bg-neutral-200"
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    switchToggled ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              setIsDrawerOpen(false);
              success("Preferences Saved", "Updated parameters written to browser memory.");
            }}
            className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl cursor-pointer"
          >
            Save Drawer Configuration
          </button>
        </div>
      </Drawer>

    </div>
  );
}
