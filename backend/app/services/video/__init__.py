"""Video detection services."""
from app.services.video.frame_analyzer import FrameAnalysis, FrameAnalyzer
from app.services.video.video_metadata_service import extract_video_metadata
from app.services.video.video_service import VideoAnalysisService, predict_video_file

__all__ = [
    "FrameAnalysis",
    "FrameAnalyzer",
    "VideoAnalysisService",
    "extract_video_metadata",
    "predict_video_file",
]
