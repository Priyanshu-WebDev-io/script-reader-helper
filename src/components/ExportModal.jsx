import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { X, Film, CheckCircle2, Trash2 } from 'lucide-react-native';
import { stitchTakes } from '../utils/videoStitcher';
import { useStudioStore } from '../store/useStudioStore';

export function ExportModal({
  visible,
  onClose,
  beats = [],
  recordingTakes = [],
  onClearSession
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const modalWidth = Math.min(windowWidth - 28, 520);
  const modalHeight = Math.min(windowHeight * 0.85, 620);

  const { currentScript, addSavedVideo } = useStudioStore();
  const [isStitching, setIsStitching] = useState(false);
  const [stitchProgress, setStitchProgress] = useState(0);
  const [finalVideoPath, setFinalVideoPath] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const recordedCount = (recordingTakes || []).filter(Boolean).length;

  const handleStitch = async () => {
    setIsStitching(true);
    setStitchProgress(5);
    setErrorMessage(null);

    const result = await stitchTakes(recordingTakes, (progress) => {
      setStitchProgress(progress);
    });

    setIsStitching(false);

    if (result.success) {
      setFinalVideoPath(result.outputPath);
      addSavedVideo({
        id: `video-${Date.now()}`,
        title: `${currentScript?.title || 'Studio'} Recording`,
        path: result.outputPath,
        date: new Date().toISOString(),
        duration: currentScript?.targetDuration || '1m',
        takesCount: recordedCount
      });
    } else {
      setErrorMessage(result.error || 'Failed to stitch takes');
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/80 items-center justify-center p-3">
        <View 
          className="bg-resolve-bg border border-resolve-border rounded-xs overflow-hidden flex-col"
          style={{ width: modalWidth, height: modalHeight }}
        >

          {/* Studio Deliver Header */}
          <View className="flex-row justify-between items-center px-4 py-3 bg-resolve-header border-b border-resolve-border">
            <View className="flex-row items-center gap-2">
              <View className="w-6 h-6 bg-resolve-panel border border-resolve-border rounded-xs items-center justify-center">
                <Film size={12} color="#F26D21" />
              </View>
              <View>
                <Text className="text-resolve-text text-xs font-bold uppercase tracking-wider font-mono">
                  STUDIO // TIMELINE RENDER
                </Text>
                <Text className="text-resolve-muted text-[10px] tracking-tight">
                  Clean native stream concatenation without HUD burn-in
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1 active:bg-resolve-panel" activeOpacity={0.7}>
              <X size={18} color="#888888" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View className="p-4 flex-1 justify-between">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-resolve-muted font-mono text-[10px] font-bold uppercase tracking-wider">
                TRACK CLIPS ({recordedCount}/{beats.length} ARMED)
              </Text>
              <Text className="text-resolve-accent font-mono text-[10px] uppercase">
                {recordedCount === beats.length ? 'ALL TAKES READY' : `${beats.length - recordedCount} PENDING`}
              </Text>
            </View>

            <ScrollView 
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              className="mb-3" 
              showsVerticalScrollIndicator={false}
            >
              {beats.map((beat, index) => {
                const hasTake = !!recordingTakes[index];
                return (
                  <View 
                    key={beat.id || index} 
                    className={`flex-row items-center justify-between p-2.5 mb-1.5 rounded-xs border ${
                      hasTake 
                        ? 'bg-resolve-panel border-resolve-border' 
                        : 'bg-resolve-recessed/60 border-resolve-border/40 opacity-60'
                    }`}
                  >
                    <View className="flex-row items-center gap-2 flex-1 mr-2">
                      <View className="w-5 h-5 bg-resolve-recessed border border-resolve-border rounded-none items-center justify-center">
                        <Text className="text-resolve-muted font-mono text-[9px] font-bold">
                          {index + 1}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-resolve-text text-[11px] font-bold uppercase font-mono">
                          {beat.section}
                        </Text>
                        <Text className="text-resolve-muted text-[10px]" numberOfLines={1}>
                          {beat.spokenText}
                        </Text>
                      </View>
                    </View>

                    <View>
                      {hasTake ? (
                        <View className="flex-row items-center gap-1 bg-resolve-recessed px-1.5 py-0.5 border border-resolve-border rounded-none">
                          <CheckCircle2 size={11} color="#F26D21" />
                          <Text className="text-resolve-accent font-mono text-[9px] font-bold">ARMED</Text>
                        </View>
                      ) : (
                        <Text className="text-resolve-dim font-mono text-[9px]">EMPTY</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Stitching Progress */}
            {isStitching && (
              <View className="p-3 bg-resolve-panel border border-resolve-border rounded-xs mb-3">
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-resolve-text font-mono text-[10px] font-bold uppercase">
                    RENDERING TIMELINE CONCATENATION...
                  </Text>
                  <Text className="text-resolve-accent font-mono text-[10px] font-bold">{stitchProgress}%</Text>
                </View>
                <View className="w-full h-1.5 bg-resolve-recessed rounded-none overflow-hidden">
                  <View 
                    className="h-full bg-resolve-accent" 
                    style={{ width: `${stitchProgress}%` }} 
                  />
                </View>
              </View>
            )}

            {/* Success Result */}
            {finalVideoPath && (
              <View className="p-3 bg-resolve-panel border border-resolve-accent rounded-xs mb-3 flex-row items-center gap-2">
                <CheckCircle2 size={16} color="#F26D21" />
                <View className="flex-1">
                  <Text className="text-resolve-text text-xs font-bold font-mono uppercase">
                    RENDER COMPLETE // TIMELINE SAVED
                  </Text>
                  <Text className="text-resolve-muted font-mono text-[9px]" numberOfLines={1}>
                    {finalVideoPath}
                  </Text>
                </View>
              </View>
            )}

            {errorMessage && (
              <View className="p-2.5 bg-resolve-crimson/20 border border-resolve-crimson rounded-xs mb-3">
                <Text className="text-resolve-crimson font-mono text-[10px]">{errorMessage}</Text>
              </View>
            )}

            {/* Actions */}
            <View className="gap-2">
              <TouchableOpacity
                className={`py-2.5 px-4 rounded-xs items-center justify-center flex-row gap-2 border ${
                  (isStitching || recordedCount === 0)
                    ? 'bg-resolve-panel border-resolve-border opacity-40'
                    : 'bg-resolve-accent border-resolve-accent active:opacity-90'
                }`}
                onPress={handleStitch}
                disabled={isStitching || recordedCount === 0}
                activeOpacity={0.85}
              >
                {isStitching ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <View className="w-2 h-2 bg-black rounded-none" />
                    <Text className="text-black font-mono text-xs font-bold uppercase tracking-wider">
                      RENDER TIMELINE ({recordedCount} TAKES)
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="py-2 px-4 rounded-xs border border-resolve-border bg-resolve-recessed items-center justify-center flex-row gap-1.5 active:bg-resolve-panel"
                onPress={() => {
                  onClearSession();
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Trash2 size={12} color="#888888" />
                <Text className="text-resolve-muted font-mono text-[10px] uppercase tracking-wider">
                  CLEAR TRACK SESSION
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </View>
    </Modal>
  );
}
