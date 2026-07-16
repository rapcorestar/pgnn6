#import <AppKit/AppKit.h>
#import <AVFoundation/AVFoundation.h>
#import <AudioToolbox/AudioToolbox.h>
#import <CoreVideo/CoreVideo.h>

static void waitUntilReady(AVAssetWriterInput *input) {
  while (!input.readyForMoreMediaData) {
    [NSThread sleepForTimeInterval:0.002];
  }
}

int main(int argc, const char * argv[]) {
  @autoreleasepool {
    if (argc != 4 && argc != 7) {
      fprintf(stderr, "Usage: encode-demo-teaser <frames-dir> <music-file> <output-file> [width height frame-count]\\n");
      return 1;
    }

    NSURL *framesDirectory = [NSURL fileURLWithPath:[NSString stringWithUTF8String:argv[1]] isDirectory:YES];
    NSURL *musicURL = [NSURL fileURLWithPath:[NSString stringWithUTF8String:argv[2]]];
    NSURL *outputURL = [NSURL fileURLWithPath:[NSString stringWithUTF8String:argv[3]]];
    NSURL *videoURL = [[outputURL URLByDeletingPathExtension] URLByAppendingPathExtension:@"video.mp4"];
    const NSInteger width = argc == 7 ? MAX(1, [[NSString stringWithUTF8String:argv[4]] integerValue]) : 1280;
    const NSInteger height = argc == 7 ? MAX(1, [[NSString stringWithUTF8String:argv[5]] integerValue]) : 720;
    const int32_t fps = 30;
    const NSInteger frameCount = argc == 7 ? MAX(1, [[NSString stringWithUTF8String:argv[6]] integerValue]) : 540;
    CMTime duration = CMTimeMake(frameCount, fps);

    [[NSFileManager defaultManager] removeItemAtURL:outputURL error:nil];
    [[NSFileManager defaultManager] removeItemAtURL:videoURL error:nil];
    NSError *error = nil;
    AVAssetWriter *writer = [[AVAssetWriter alloc] initWithURL:videoURL fileType:AVFileTypeMPEG4 error:&error];
    if (!writer) {
      fprintf(stderr, "Could not create video writer: %s\\n", error.localizedDescription.UTF8String);
      return 1;
    }

    NSDictionary *videoSettings = @{
      AVVideoCodecKey: AVVideoCodecTypeH264,
      AVVideoWidthKey: @(width),
      AVVideoHeightKey: @(height),
      AVVideoCompressionPropertiesKey: @{
        AVVideoAverageBitRateKey: @9000000,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
      },
    };
    AVAssetWriterInput *videoInput = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeVideo outputSettings:videoSettings];
    videoInput.expectsMediaDataInRealTime = NO;
    NSDictionary *pixelBufferAttributes = @{
      (NSString *)kCVPixelBufferPixelFormatTypeKey: @(kCVPixelFormatType_32BGRA),
      (NSString *)kCVPixelBufferWidthKey: @(width),
      (NSString *)kCVPixelBufferHeightKey: @(height),
    };
    AVAssetWriterInputPixelBufferAdaptor *adaptor = [[AVAssetWriterInputPixelBufferAdaptor alloc] initWithAssetWriterInput:videoInput sourcePixelBufferAttributes:pixelBufferAttributes];
    if (![writer canAddInput:videoInput]) return 1;
    [writer addInput:videoInput];

    if (![writer startWriting]) {
      fprintf(stderr, "Could not start video writer: %s\\n", writer.error.localizedDescription.UTF8String);
      return 1;
    }
    [writer startSessionAtSourceTime:kCMTimeZero];

    for (NSInteger index = 0; index < frameCount; index += 1) {
      waitUntilReady(videoInput);
      NSString *frameName = [NSString stringWithFormat:@"frame-%04ld.png", (long)index];
      NSURL *frameURL = [framesDirectory URLByAppendingPathComponent:frameName];
      NSImage *image = [[NSImage alloc] initWithContentsOfURL:frameURL];
      CGImageRef cgImage = [image CGImageForProposedRect:nil context:nil hints:nil];
      if (!cgImage || !adaptor.pixelBufferPool) {
        fprintf(stderr, "Could not load %s\\n", frameName.UTF8String);
        return 1;
      }
      CVPixelBufferRef pixelBuffer = NULL;
      CVPixelBufferPoolCreatePixelBuffer(NULL, adaptor.pixelBufferPool, &pixelBuffer);
      if (!pixelBuffer) return 1;
      CVPixelBufferLockBaseAddress(pixelBuffer, 0);
      CGContextRef context = CGBitmapContextCreate(
        CVPixelBufferGetBaseAddress(pixelBuffer),
        width,
        height,
        8,
        CVPixelBufferGetBytesPerRow(pixelBuffer),
        CGColorSpaceCreateDeviceRGB(),
        kCGImageAlphaPremultipliedFirst | kCGBitmapByteOrder32Little
      );
      CGContextSetInterpolationQuality(context, kCGInterpolationHigh);
      CGContextDrawImage(context, CGRectMake(0, 0, width, height), cgImage);
      CGContextRelease(context);
      CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);
      BOOL appended = [adaptor appendPixelBuffer:pixelBuffer withPresentationTime:CMTimeMake(index, fps)];
      CVPixelBufferRelease(pixelBuffer);
      if (!appended) {
        fprintf(stderr, "Could not append video frame: %s\\n", writer.error.localizedDescription.UTF8String);
        return 1;
      }
    }
    [videoInput markAsFinished];

    dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
    [writer finishWritingWithCompletionHandler:^{ dispatch_semaphore_signal(semaphore); }];
    dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);
    if (writer.status != AVAssetWriterStatusCompleted) {
      fprintf(stderr, "Could not finish video: %s\\n", writer.error.localizedDescription.UTF8String);
      return 1;
    }
    AVURLAsset *videoAsset = [AVURLAsset URLAssetWithURL:videoURL options:nil];
    AVURLAsset *musicAsset = [AVURLAsset URLAssetWithURL:musicURL options:nil];
    AVAssetTrack *videoTrack = [[videoAsset tracksWithMediaType:AVMediaTypeVideo] firstObject];
    AVAssetTrack *audioTrack = [[musicAsset tracksWithMediaType:AVMediaTypeAudio] firstObject];
    if (!videoTrack || !audioTrack) {
      fprintf(stderr, "Could not prepare video or music for final export.\\n");
      return 1;
    }
    AVMutableComposition *composition = [AVMutableComposition composition];
    AVMutableCompositionTrack *compositionVideo = [composition addMutableTrackWithMediaType:AVMediaTypeVideo preferredTrackID:kCMPersistentTrackID_Invalid];
    AVMutableCompositionTrack *compositionAudio = [composition addMutableTrackWithMediaType:AVMediaTypeAudio preferredTrackID:kCMPersistentTrackID_Invalid];
    CMTimeRange exportRange = CMTimeRangeMake(kCMTimeZero, duration);
    if (![compositionVideo insertTimeRange:exportRange ofTrack:videoTrack atTime:kCMTimeZero error:&error] ||
        ![compositionAudio insertTimeRange:exportRange ofTrack:audioTrack atTime:kCMTimeZero error:&error]) {
      fprintf(stderr, "Could not assemble final teaser: %s\\n", error.localizedDescription.UTF8String);
      return 1;
    }

    AVAssetExportSession *exporter = [[AVAssetExportSession alloc] initWithAsset:composition presetName:AVAssetExportPresetHighestQuality];
    if (!exporter) {
      fprintf(stderr, "Could not create final exporter.\\n");
      return 1;
    }
    exporter.outputURL = outputURL;
    exporter.outputFileType = AVFileTypeMPEG4;
    exporter.shouldOptimizeForNetworkUse = YES;
    dispatch_semaphore_t exportSemaphore = dispatch_semaphore_create(0);
    [exporter exportAsynchronouslyWithCompletionHandler:^{ dispatch_semaphore_signal(exportSemaphore); }];
    dispatch_semaphore_wait(exportSemaphore, DISPATCH_TIME_FOREVER);
    [[NSFileManager defaultManager] removeItemAtURL:videoURL error:nil];
    if (exporter.status != AVAssetExportSessionStatusCompleted) {
      fprintf(stderr, "Could not export final teaser: %s\\n", exporter.error.localizedDescription.UTF8String);
      return 1;
    }
    printf("Encoded %ld frames at %d fps with music.\\n", (long)frameCount, fps);
  }
  return 0;
}
