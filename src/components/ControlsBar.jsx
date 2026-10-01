import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { 
  ChevronLeft, 
  ChevronRight, 
  Square, 
  RotateCcw, 
  Film, 
  FileText 
} from 'lucide-react-native';

export function ControlsBar({
  currentBeatIndex,
  totalBeats,
  isRecording,
  hasTake,
  recordedCount,
  onPrevious,
  onNext,
  onStartRecord,
  onStopRecord,
  onRetake,
  onOpenScript,
  onOpenExport
}) {
  return (
    <View className="w-full px-4 pb-4 items-center gap-2.5">
      {/* NLE Inspector Actions: Script & Timeline Export */}
      <View className="flex-row justify-between w-full">
        <TouchableOpacity 
          className="flex-row items-center gap-1.5 bg-resolve-panel border border-resolve-border px-3 py-1.5 rounded-xs active:bg-resolve-border" 
          onPress={onOpenScript}
          disabled={isRecording}
          activeOpacity={0.8}
        >
          <FileText size={12} color="#DEDEDE" />
          <Text className="text-resolve-text text-[11px] font-semibold uppercase tracking-wider">SCRIPT BIN</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xs border ${
            recordedCount > 0 
              ? 'bg-resolve-panel border-resolve-accent' 
              : 'bg-resolve-panel/50 border-resolve-border opacity-50'
          }`}
          onPress={onOpenExport}
          disabled={isRecording || recordedCount === 0}
          activeOpacity={0.8}
        >
          <Film size={12} color={recordedCount > 0 ? '#F26D21' : '#888888'} />
          <Text className={`text-[11px] font-semibold uppercase tracking-wider ${
            recordedCount > 0 ? 'text-resolve-accent' : 'text-resolve-muted'
          }`}>
            RENDER TIMELINE ({totalBeats > 1 ? `${recordedCount}/${totalBeats}` : recordedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hardware Transport Controls (Jog / Shuttle / Record) */}
      <View className="flex-row items-center justify-center gap-4 w-full">
        
        {/* Previous Beat (Jog Step Backward) */}
        <TouchableOpacity
          className={`w-11 h-11 bg-resolve-panel border border-resolve-border rounded-xs items-center justify-center active:bg-resolve-border ${
            (currentBeatIndex === 0 || isRecording || totalBeats <= 1) ? 'opacity-30' : ''
          }`}
          onPress={onPrevious}
          disabled={currentBeatIndex === 0 || isRecording || totalBeats <= 1}
          activeOpacity={0.7}
        >
          <ChevronLeft size={18} color="#DEDEDE" />
        </TouchableOpacity>

        {/* NLE Master Record / Punch-in Button */}
        {!isRecording ? (
          <TouchableOpacity
            className="flex-row items-center gap-2.5 bg-resolve-crimson border border-resolve-crimsonDark py-3 px-6 rounded-xs active:opacity-90"
            onPress={onStartRecord}
            activeOpacity={0.85}
          >
            <View className="w-2.5 h-2.5 bg-white rounded-none" />
            <Text className="text-white text-xs font-bold uppercase tracking-wider font-mono">
              {totalBeats > 1 ? `RECORD TAKE ${currentBeatIndex + 1}/${totalBeats}` : 'RECORD'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="flex-row items-center gap-2.5 bg-resolve-recessed border-2 border-resolve-crimson py-3 px-6 rounded-xs active:opacity-90"
            onPress={onStopRecord}
            activeOpacity={0.85}
          >
            <Square size={13} color="#C73B3B" fill="#C73B3B" />
            <Text className="text-resolve-crimson text-xs font-bold uppercase tracking-wider font-mono">
              STOP RECORDING
            </Text>
          </TouchableOpacity>
        )}

        {/* Next Beat (Jog Step Forward) */}
        <TouchableOpacity
          className={`w-11 h-11 bg-resolve-panel border border-resolve-border rounded-xs items-center justify-center active:bg-resolve-border ${
            (currentBeatIndex === totalBeats - 1 || isRecording) ? 'opacity-30' : ''
          }`}
          onPress={onNext}
          disabled={currentBeatIndex === totalBeats - 1 || isRecording}
          activeOpacity={0.7}
        >
          <ChevronRight size={18} color="#DEDEDE" />
        </TouchableOpacity>
      </View>

      {/* Retake Track Beat Button */}
      {hasTake && !isRecording && (
        <TouchableOpacity 
          className="flex-row items-center gap-1.5 bg-resolve-recessed border border-resolve-border px-2.5 py-1 rounded-xs active:bg-resolve-panel" 
          onPress={onRetake}
          activeOpacity={0.8}
        >
          <RotateCcw size={11} color="#888888" />
          <Text className="text-resolve-muted text-[10px] font-mono uppercase tracking-wider">
            RETAKE BEAT #{currentBeatIndex + 1}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
