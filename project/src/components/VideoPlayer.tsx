import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import YouTube from 'react-youtube';
import { VideoSource } from '../types';

interface VideoPlayerProps {
  source: VideoSource | null;
  isPlaying?: boolean;
  playbackRate?: number;
  onTimeUpdate?: () => void;
  onDurationChange?: () => void;
  onReady?: () => void;
  initialTime?: number;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ source, isPlaying = false, playbackRate = 1, onTimeUpdate, onDurationChange, onReady, initialTime = 0 }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const youtubePlayerRef = useRef<any>(null);
    const [youtubeReady, setYoutubeReady] = useState(false);
    const timeUpdateIntervalRef = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isInitialSeekDone, setIsInitialSeekDone] = useState(false);
    
    // Forward the video element ref
    useImperativeHandle(ref, () => {
      // Create a proxy object that mimics the HTMLVideoElement interface
      const videoProxy = videoRef.current || {} as HTMLVideoElement;
      
      return {
        ...videoProxy,
        play: () => {
          if (source?.type === 'youtube' && youtubePlayerRef.current && youtubeReady) {
            try {
              youtubePlayerRef.current.playVideo();
              return Promise.resolve();
            } catch (error) {
              console.warn('Failed to play YouTube video:', error);
              return Promise.reject(error);
            }
          } else if (videoRef.current) {
            return videoRef.current.play();
          }
          return Promise.resolve();
        },
        pause: () => {
          if (source?.type === 'youtube' && youtubePlayerRef.current && youtubeReady) {
            try {
              youtubePlayerRef.current.pauseVideo();
            } catch (error) {
              console.warn('Failed to pause YouTube video:', error);
            }
          } else if (videoRef.current) {
            videoRef.current.pause();
          }
        },
        get currentTime() {
          if (source?.type === 'youtube' && youtubePlayerRef.current) {
            return youtubePlayerRef.current.getCurrentTime() || 0;
          } else if (videoRef.current) {
            return videoRef.current.currentTime;
          }
          return 0;
        },
        set currentTime(time: number) {
          if (source?.type === 'youtube' && youtubePlayerRef.current && youtubeReady) {
            try {
              youtubePlayerRef.current.seekTo(time, true);
            } catch (error) {
              console.warn('Failed to seek YouTube video:', error);
            }
          } else if (videoRef.current) {
            videoRef.current.currentTime = time;
          }
        },
        get duration() {
          if (source?.type === 'youtube' && youtubePlayerRef.current) {
            return youtubePlayerRef.current.getDuration() || 0;
          } else if (videoRef.current) {
            return videoRef.current.duration;
          }
          return 0;
        },
        get playbackRate() {
          if (source?.type === 'youtube' && youtubePlayerRef.current) {
            return youtubePlayerRef.current.getPlaybackRate() || 1;
          } else if (videoRef.current) {
            return videoRef.current.playbackRate;
          }
          return 1;
        },
        set playbackRate(rate: number) {
          if (source?.type === 'youtube' && youtubePlayerRef.current && youtubeReady) {
            try {
              youtubePlayerRef.current.setPlaybackRate(rate);
            } catch (error) {
              console.warn('Failed to set playback rate for YouTube video:', error);
            }
          } else if (videoRef.current) {
            videoRef.current.playbackRate = rate;
          }
        },
        getBoundingClientRect: () => {
          if (source?.type === 'youtube' && containerRef.current) {
            return containerRef.current.getBoundingClientRect();
          } else if (videoRef.current) {
            return videoRef.current.getBoundingClientRect();
          }
          return new DOMRect();
        }
      } as HTMLVideoElement;
    });

    // Reset initial seek state when source changes
    useEffect(() => {
      setIsInitialSeekDone(false);
    }, [source]);

    // Handle HTML5 video events
    useEffect(() => {
      if (!videoRef.current || source?.type !== 'url') return;

      const video = videoRef.current;

      const handleMetadata = () => {
        if (!isInitialSeekDone && initialTime > 0) {
          video.currentTime = initialTime;
          setIsInitialSeekDone(true);
        }
        onReady?.();
        onDurationChange?.();
      };

      video.addEventListener('loadedmetadata', handleMetadata);
      video.addEventListener('timeupdate', onTimeUpdate || (() => {}));
      video.addEventListener('durationchange', onDurationChange || (() => {}));

      return () => {
        video.removeEventListener('loadedmetadata', handleMetadata);
        video.removeEventListener('timeupdate', onTimeUpdate || (() => {}));
        video.removeEventListener('durationchange', onDurationChange || (() => {}));
      };
    }, [source, onTimeUpdate, onDurationChange, onReady, initialTime, isInitialSeekDone]);
    
    // Handle play/pause for HTML5 video
    useEffect(() => {
      if (source?.type === 'url' && videoRef.current) {
        if (isPlaying) {
          videoRef.current.play().catch(error => {
            console.error('Error playing video:', error);
          });
        } else {
          videoRef.current.pause();
        }
      }
    }, [isPlaying, source?.type]);
    
    // Handle play/pause for YouTube video
    useEffect(() => {
      if (source?.type === 'youtube' && youtubePlayerRef.current && youtubeReady) {
        if (isPlaying) {
          try {
            youtubePlayerRef.current.playVideo();
          } catch (error) {
            console.warn('Failed to play YouTube video:', error);
          }
        } else {
          try {
            youtubePlayerRef.current.pauseVideo();
          } catch (error) {
            console.warn('Failed to pause YouTube video:', error);
          }
        }
      }
    }, [isPlaying, source?.type, youtubeReady]);
    
    // Handle playback rate for HTML5 video
    useEffect(() => {
      if (source?.type === 'url' && videoRef.current) {
        videoRef.current.playbackRate = playbackRate;
      }
    }, [playbackRate, source?.type]);
    
    // Handle playback rate for YouTube video
    useEffect(() => {
      if (source?.type === 'youtube' && youtubePlayerRef.current && youtubeReady) {
        try {
          youtubePlayerRef.current.setPlaybackRate(playbackRate);
        } catch (error) {
          console.warn('Failed to set playback rate for YouTube video:', error);
        }
      }
    }, [playbackRate, source?.type, youtubeReady]);
    
    // Set up time update interval for YouTube videos
    useEffect(() => {
      if (source?.type === 'youtube' && youtubeReady && onTimeUpdate) {
        if (timeUpdateIntervalRef.current) {
          window.clearInterval(timeUpdateIntervalRef.current);
        }
        
        timeUpdateIntervalRef.current = window.setInterval(() => {
          if (youtubePlayerRef.current) {
            onTimeUpdate();
          }
        }, 250);
      }
      
      return () => {
        if (timeUpdateIntervalRef.current) {
          window.clearInterval(timeUpdateIntervalRef.current);
          timeUpdateIntervalRef.current = null;
        }
      };
    }, [source?.type, youtubeReady, onTimeUpdate]);
    
    // YouTube event handlers
    const onYouTubeReady = (event: any) => {
      youtubePlayerRef.current = event.target;
      setYoutubeReady(true);
      
      if (!isInitialSeekDone && initialTime > 0) {
        event.target.seekTo(initialTime, true);
        setIsInitialSeekDone(true);
      }
      
      onReady?.();
      onDurationChange?.();
      
      event.target.setPlaybackRate(playbackRate);
      
      if (isPlaying) {
        event.target.playVideo();
      }
    };
    
    const onYouTubeStateChange = (event: any) => {
      // YouTube state: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
      if (event.data === 0) {
        // Handle video end if needed
      }
    };
    
    const getYouTubeOptions = () => {
      return {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: isPlaying ? 1 : 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          start: Math.floor(initialTime)
        }
      };
    };
    
    if (!source) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
          <p>No video source selected</p>
        </div>
      );
    }
    
    if (source.type === 'url') {
      return (
        <video
          ref={videoRef}
          src={source.src}
          className="w-full h-auto"
          controls={false}
          crossOrigin="anonymous"
        />
      );
    }
    
    if (source.type === 'youtube' && source.videoId) {
      return (
        <div 
          id="youtube-player-container" 
          className="w-full h-0 pb-[56.25%] relative"
          ref={containerRef}
        >
          <YouTube
            videoId={source.videoId}
            opts={getYouTubeOptions()}
            onReady={onYouTubeReady}
            onStateChange={onYouTubeStateChange}
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
      );
    }
    
    if (source.type === 'vimeo') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black text-white">
          <p>Vimeo videos require the Vimeo Player API integration.</p>
        </div>
      );
    }
    
    return null; // Ensure the function returns a value
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;