export type VideoSource = {
  type: 'url' | 'youtube' | 'vimeo';
  src: string;
  videoId?: string; // For YouTube videos
};

export type DrawingTool = 'pencil' | 'line' | 'rectangle' | 'circle' | 'eraser';

export type Point = {
  x: number;
  y: number;
};

export type AnnotationData = {
  tool: DrawingTool;
  color: string;
  lineWidth: number;
  points: Point[];
};

export type Annotation = AnnotationData & {
  id: string;
  timestamp: number;
  startTime: number;
  endTime: number;
  debugInfo?: {
    created: number;
  };
};

export type Scene = {
  id: string;
  user_id: string;
  name: string;
  video_source: VideoSource;
  start_time: number;
  end_time: number;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Folder = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export interface YouTubePlayerState {
  player: any;
  playerState: number;
  currentTime: number;
  duration: number;
}