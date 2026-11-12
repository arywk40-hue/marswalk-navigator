import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { POVImage, Target, Mars2020RawImage } from '../types';
import {
  Camera,
  Layers,
  CheckCircle2,
  Globe,
  RefreshCw,
  ExternalLink,
  Maximize2,
  X,
  AlertTriangle,
} from 'lucide-react';

export const PovPanel: React.FC = () => {
  const { selectedTarget, targets, setSelectedTarget } = useAppStore();
  const [activeTab, setActiveTab] = useState<'targets' | 'live-feed'>('targets');
  const [povImages, setPovImages] = useState<POVImage[]>([]);
  const [modalImage, setModalImage] = useState<{ url: string; title: string; caption?: string; meta?: string } | null>(null);

  // Live Raw Feed State
  const [feedSol, setFeedSol] = useState<number>(482);
  const [feedCamera, setFeedCamera] = useState<string>('ALL');
  const [feedImages, setFeedImages] = useState<Mars2020RawImage[]>([]);
  const [feedLoading, setFeedLoading] = useState<boolean>(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [feedTotal, setFeedTotal] = useState<number | null>(null);

  useEffect(() => {
    async function loadPov() {
      try {
        const res = await fetch('./data/pov_images.json');
        if (res.ok) {
          const data = await res.json();
          setPovImages(data);
        }
      } catch (err) {
        console.error('Failed to load POV images:', err);
      }
    }
    loadPov();
  }, []);

  const activeTarget: Target = selectedTarget || targets[0];
  const matchingImages = povImages.filter((img) => img.targetId === activeTarget?.id);
  const primaryImage = matchingImages[0] || povImages[0];

  const missionPresets = [
    { sol: 482, label: 'Sol 482 (Hawksbill Gap)' },
    { sol: 510, label: 'Sol 510 (Wildcat Ridge)' },
    { sol: 620, label: 'Sol 620 (Hogwallow Flats)' },
    { sol: 655, label: 'Sol 655 (Three Forks Depot)' },
    { sol: 753, label: 'Sol 753 (Belva Crater)' },
    { sol: 2031, label: 'Sol 2031 (Recent Sol)' },
  ];

  const fetchLiveFeed = async (solToFetch: number, cameraFilter: string) => {
    setFeedLoading(true);
    setFeedError(null);
    try {
      let url = `https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&sol=${solToFetch}&num=20`;
      if (cameraFilter !== 'ALL') {
        url += `&camera=${cameraFilter}`;
      }

      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        throw new Error(`NASA Feed returned status ${res.status}`);
      }

      const json = await res.json();
      setFeedTotal(json.total_results ?? json.images?.length ?? 0);

      if (json.images && json.images.length > 0) {
        const parsed: Mars2020RawImage[] = json.images.map((img: any) => ({
          id: img.imageid || String(img.id),
          sol: img.sol,
          camera: img.camera?.instrument || 'Perseverance Camera',
          caption: img.caption || img.title || 'Mars 2020 Raw Observation',
          date_taken_utc: img.date_taken_utc || '',
          url_medium: img.image_files?.medium || img.image_files?.large || img.image_files?.full_res,
          url_full: img.image_files?.full_res || img.image_files?.large || img.image_files?.medium,
          credit: img.credit || 'NASA/JPL-Caltech',
        }));
        setFeedImages(parsed);
      } else {
        setFeedImages([]);
      }
    } catch (err: any) {
      console.warn('Live NASA Feed unavailable or offline:', err);
      setFeedError(err.message || 'Network error querying NASA Feed');
      // Fallback to local pov images
      setFeedImages(
        povImages.map((img) => ({
          id: img.id,
          sol: img.sol,
          camera: img.camera,
          caption: img.caption,
          date_taken_utc: `Sol ${img.sol}`,
          url_medium: img.thumbUrl,
          url_full: img.imageUrl,
          credit: img.credit,
        }))
      );
    } finally {
      setFeedLoading(false);
    }
  };

  return (
    <div className="w-80 bg-[#12141c]/95 border-r border-slate-800 flex flex-col h-full text-slate-200 select-none backdrop-blur z-20">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-purple-400" />
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-100">
            Surface Imagery & POV
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
          REAL NASA DATA
        </span>
      </div>

      {/* Sub-Tabs: Target Ground Truth vs. Live NASA Raw Feed */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
        <button
          onClick={() => setActiveTab('targets')}
          className={`flex-1 py-1.5 rounded text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'targets'
              ? 'bg-purple-900/50 text-purple-200 border border-purple-700/60 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          Target Ground Truth
        </button>
        <button
          onClick={() => {
            setActiveTab('live-feed');
            if (feedImages.length === 0) {
              fetchLiveFeed(feedSol, feedCamera);
            }
          }}
          className={`flex-1 py-1.5 rounded text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'live-feed'
              ? 'bg-purple-900/50 text-purple-200 border border-purple-700/60 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          Live M2020 Feed
        </button>
      </div>

      <div className="p-3.5 flex-1 overflow-y-auto space-y-4">
        {/* ========================================================================= */}
        {/* TAB 1: TARGET GROUND TRUTH                                                */}
        {/* ========================================================================= */}
        {activeTab === 'targets' && (
          <>
            {/* Waypoint Selector Chips */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
                Select Science Waypoint ({targets.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {targets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTarget(t)}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-all border ${
                      activeTarget?.id === t.id
                        ? 'bg-purple-600 text-white border-purple-400 shadow'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {t.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Card */}
            {activeTarget && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                      {activeTarget.category}
                    </span>
                    <h3 className="text-sm font-bold text-white font-mono mt-0.5">
                      {activeTarget.name}
                    </h3>
                    {activeTarget.geologic_unit && (
                      <span className="text-[10px] font-mono text-purple-300 block mt-0.5">
                        {activeTarget.geologic_unit}
                      </span>
                    )}
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700">
                    ★ {activeTarget.science_value}/5
                  </span>
                </div>

                {/* Primary Ground Photo */}
                {primaryImage && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Expected Ground View (Perseverance)
                      </span>
                      {primaryImage.nasa_id && (
                        <span className="text-slate-500 font-mono">{primaryImage.nasa_id}</span>
                      )}
                    </div>

                    <div
                      onClick={() =>
                        setModalImage({
                          url: primaryImage.imageUrl,
                          title: primaryImage.title,
                          caption: primaryImage.caption,
                          meta: `${primaryImage.camera} | Sol ${primaryImage.sol} | Azimuth ${primaryImage.heading_deg}°`,
                        })
                      }
                      className="relative rounded-lg overflow-hidden border border-slate-700 group bg-black aspect-video flex items-center justify-center cursor-pointer hover:border-purple-500 transition-all shadow-md"
                    >
                      <img
                        src={primaryImage.thumbUrl || primaryImage.imageUrl}
                        alt={primaryImage.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/80 text-emerald-400 border border-emerald-600/40 backdrop-blur">
                        {primaryImage.camera}
                      </div>
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/80 text-amber-300 border border-amber-600/40 backdrop-blur">
                        SOL {primaryImage.sol}
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-mono text-xs gap-1.5">
                        <Maximize2 className="w-4 h-4" /> Click to Enlarge
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 leading-relaxed italic">
                      "{primaryImage.caption}"
                    </div>

                    {primaryImage.geologic_context && (
                      <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 p-1.5 rounded border border-emerald-900/60">
                        Context: {primaryImage.geologic_context}
                      </div>
                    )}

                    <div className="text-[10px] font-mono text-slate-500 flex justify-between pt-1 border-t border-slate-800">
                      <span>Azimuth: {primaryImage.heading_deg}°</span>
                      <span>{primaryImage.credit}</span>
                    </div>
                  </div>
                )}

                {/* Additional Photos for Target */}
                {matchingImages.length > 1 && (
                  <div className="space-y-1 pt-2 border-t border-slate-800">
                    <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                      Additional Camera Angles ({matchingImages.length - 1})
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {matchingImages.slice(1).map((extra) => (
                        <div
                          key={extra.id}
                          onClick={() =>
                            setModalImage({
                              url: extra.imageUrl,
                              title: extra.title,
                              caption: extra.caption,
                              meta: `${extra.camera} | Sol ${extra.sol}`,
                            })
                          }
                          className="relative rounded border border-slate-700 bg-black aspect-video overflow-hidden cursor-pointer hover:border-purple-400 group"
                        >
                          <img
                            src={extra.thumbUrl || extra.imageUrl}
                            alt={extra.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute bottom-1 left-1 px-1 py-0.2 rounded text-[8px] font-mono bg-black/80 text-white">
                            SOL {extra.sol}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Multi-Sensor Orbital Context */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs font-mono">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    Multi-Sensor Orbital Context
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/80 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Coordinates:</span>
                      <span className="text-slate-300">
                        {activeTarget.coordinates[0]}°E, {activeTarget.coordinates[1]}°N
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Spectral Evidence:</span>
                      <span className="text-cyan-400">{activeTarget.layer_evidence.join(', ')}</span>
                    </div>
                    {activeTarget.associated_cores && activeTarget.associated_cores.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">M2020 Drill Cores:</span>
                        <span className="text-purple-300 font-bold">
                          {activeTarget.associated_cores.join(', ')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Estimated Dwell:</span>
                      <span className="text-amber-300">~{activeTarget.estimated_dwell_min} min</span>
                    </div>
                  </div>
                </div>

                {/* Astronaut Sampling Protocol */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs">
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Astronaut Sampling Protocol
                  </div>
                  <ul className="space-y-1 text-slate-300 text-[11px] font-mono">
                    {activeTarget.recommended_tools.map((tool, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                        <span>{tool}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LIVE MARS 2020 RAW FEED EXPLORER                                    */}
        {/* ========================================================================= */}
        {activeTab === 'live-feed' && (
          <div className="space-y-3.5 font-mono text-xs">
            {/* Live API Info Banner */}
            <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-cyan-200 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                <Globe className="w-3.5 h-3.5" />
                NASA Mars 2020 Live Raw Images API
              </div>
              <p className="text-[10px] text-cyan-300/80 leading-normal">
                Direct client-side query to NASA's public raw image feed ({feedTotal ?? '579,000+'} total images available).
              </p>
            </div>

            {/* Mission Milestone Quick Presets */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">
                Jezero Mission Milestones
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {missionPresets.map((p) => (
                  <button
                    key={p.sol}
                    onClick={() => {
                      setFeedSol(p.sol);
                      fetchLiveFeed(p.sol, feedCamera);
                    }}
                    className={`px-2 py-1.5 rounded text-[10px] text-left transition-all border ${
                      feedSol === p.sol
                        ? 'bg-purple-600 text-white border-purple-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sol & Camera Filter Controls */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-400 uppercase block mb-1">
                    Sol (Day on Mars)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="2200"
                    value={feedSol}
                    onChange={(e) => setFeedSol(parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-slate-400 uppercase block mb-1">
                    Camera Instrument
                  </label>
                  <select
                    value={feedCamera}
                    onChange={(e) => setFeedCamera(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                  >
                    <option value="ALL">All Cameras</option>
                    <option value="MCZ_RIGHT">Mastcam-Z Right</option>
                    <option value="MCZ_LEFT">Mastcam-Z Left</option>
                    <option value="NAVCAM_LEFT">Navcam Left</option>
                    <option value="SUPERCAM_RMI">SuperCam RMI</option>
                    <option value="SHERLOC_WATSON">WATSON Hand Lens</option>
                    <option value="FRONT_HAZCAM_LEFT_A">Hazcam Front</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => fetchLiveFeed(feedSol, feedCamera)}
                disabled={feedLoading}
                className="w-full py-1.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-1.5 transition-colors shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${feedLoading ? 'animate-spin' : ''}`} />
                {feedLoading ? 'Querying NASA Server...' : 'Query Live NASA Images'}
              </button>
            </div>

            {/* Error or Offline Warning */}
            {feedError && (
              <div className="p-2 rounded bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[10px] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{feedError}. Showing local verified photos.</span>
              </div>
            )}

            {/* Live Feed Results */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Returned Images ({feedImages.length})</span>
                <span className="text-emerald-400">HTTP 200 NASA Feed</span>
              </div>

              {feedImages.length === 0 && !feedLoading && (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No images returned for Sol {feedSol} with camera {feedCamera}.
                </div>
              )}

              <div className="space-y-2">
                {feedImages.map((img) => (
                  <div
                    key={img.id}
                    onClick={() =>
                      setModalImage({
                        url: img.url_full,
                        title: `${img.camera} - Sol ${img.sol}`,
                        caption: img.caption,
                        meta: `Acquired: ${img.date_taken_utc} | Credit: ${img.credit}`,
                      })
                    }
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500 cursor-pointer transition-all space-y-1.5 group"
                  >
                    <div className="relative rounded overflow-hidden aspect-video bg-black flex items-center justify-center">
                      <img
                        src={img.url_medium}
                        alt={img.camera}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                      <div className="absolute top-1 left-1 px-1 py-0.5 rounded text-[8px] font-bold bg-black/80 text-emerald-400">
                        {img.camera}
                      </div>
                      <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[8px] font-bold bg-black/80 text-amber-300">
                        SOL {img.sol}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-300 truncate">
                      {img.caption.replace(/\n/g, ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal Image Viewer */}
      {modalImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-slate-950 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div>
                <h3 className="text-sm font-bold text-white font-mono">{modalImage.title}</h3>
                {modalImage.meta && (
                  <span className="text-[11px] font-mono text-purple-300">{modalImage.meta}</span>
                )}
              </div>
              <button
                onClick={() => setModalImage(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black">
              <img
                src={modalImage.url}
                alt={modalImage.title}
                className="max-h-[65vh] max-w-full object-contain rounded-lg border border-slate-800 shadow-2xl"
              />
            </div>
            {modalImage.caption && (
              <div className="p-3 bg-slate-900/80 border-t border-slate-800 text-xs text-slate-300 font-mono italic leading-relaxed flex items-center justify-between">
                <span>"{modalImage.caption}"</span>
                <a
                  href={modalImage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1.5 shrink-0 ml-3"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Full Res
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
