'use client';

import { useState, useEffect } from 'react';
import { AppleCard } from '@wattweiser/ui';
import { useAuthContext } from '@/contexts/auth-context';
import { getVideos, deleteVideo, downloadVideo, type Video } from '@/lib/api';
import { AvatarSelector } from '@/components/video/avatar-selector';
import { VideoRecorder } from '@/components/video/video-recorder';
import { Loader2, Trash2, Download, Play } from 'lucide-react';

export default function VideosPage() {
  const { tenantId } = useAuthContext();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState('alloy');
  const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');

  useEffect(() => {
    if (tenantId) {
      loadVideos();
    }
  }, [tenantId]);

  const loadVideos = async () => {
    if (!tenantId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await getVideos(tenantId);
      setVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Videos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!tenantId || !confirm('Möchten Sie dieses Video wirklich löschen?')) return;

    try {
      await deleteVideo(videoId, tenantId);
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen des Videos');
    }
  };

  const handleDownloadVideo = async (video: Video) => {
    if (!tenantId) return;

    try {
      const blob = await downloadVideo(video.id, tenantId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video.title}.${video.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Herunterladen des Videos');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Video-Avatare</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Video erstellen
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'gallery'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Galerie ({videos.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <AppleCard className="p-6">
              <h2 className="text-lg font-semibold mb-4">Konfiguration</h2>
              
              <div className="space-y-6">
                <AvatarSelector
                  selectedAvatarId={selectedAvatarId}
                  onAvatarSelect={setSelectedAvatarId}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text für Avatar
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Geben Sie den Text ein, den der Avatar sprechen soll..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stimme
                  </label>
                  <select
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="alloy">Alloy</option>
                    <option value="echo">Echo</option>
                    <option value="fable">Fable</option>
                    <option value="onyx">Onyx</option>
                    <option value="nova">Nova</option>
                    <option value="shimmer">Shimmer</option>
                  </select>
                </div>
              </div>
            </AppleCard>
          </div>

          <div className="lg:col-span-2">
            <AppleCard className="p-6">
              <h2 className="text-lg font-semibold mb-4">Video-Aufnahme</h2>
              <VideoRecorder
                agentId="default-agent"
                text={text}
                voiceId={voiceId}
                avatarId={selectedAvatarId}
                onVideoCreated={(videoId) => {
                  loadVideos();
                  setActiveTab('gallery');
                }}
              />
            </AppleCard>
          </div>
        </div>
      )}

      {activeTab === 'gallery' && (
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : videos.length === 0 ? (
            <AppleCard className="p-12 text-center">
              <p className="text-gray-500">Noch keine Videos erstellt</p>
              <p className="text-sm text-gray-400 mt-2">
                Erstellen Sie Ihr erstes Video, indem Sie auf "Video erstellen" klicken
              </p>
            </AppleCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <AppleCard key={video.id} className="p-4">
                  <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Play className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">{video.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {formatDuration(video.duration)} • {new Date(video.createdAt).toLocaleDateString('de-DE')}
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadVideo(video)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDeleteVideo(video.id)}
                      className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </AppleCard>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
