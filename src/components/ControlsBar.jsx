import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
      {/* Top Action Row: Script Modal & Export Studio */}
      <View style={styles.topActionsRow}>
        <TouchableOpacity 
          style={styles.actionPill} 
          onPress={onOpenScript}
          disabled={isRecording}
        >
          <FileText size={14} color="#38BDF8" />
          <Text style={styles.actionPillText}>Script & Presets</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionPill, recordedCount > 0 && styles.exportReadyPill]} 
          onPress={onOpenExport}
          disabled={isRecording || recordedCount === 0}
        >
          <Film size={14} color={recordedCount > 0 ? '#10B981' : '#64748B'} />
          <Text style={[styles.actionPillText, recordedCount > 0 && styles.exportReadyText]}>
            Stitch & Export ({recordedCount}/{totalBeats})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Studio Record & Navigation Row */}
      <View style={styles.mainControlsRow}>
        
        {/* Previous Beat */}
        <TouchableOpacity
          style={[styles.circleNavBtn, (currentBeatIndex === 0 || isRecording) && styles.btnDisabled]}
          onPress={onPrevious}
          disabled={currentBeatIndex === 0 || isRecording}
        >
          <ChevronLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Big Studio Record Button */}
        {!isRecording ? (
          <TouchableOpacity
            style={styles.recordButton}
            onPress={onStartRecord}
          >
            <View style={styles.recordInnerDot} />
            <Text style={styles.recordBtnText}>BEAT #{currentBeatIndex + 1}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={onStopRecord}
          >
            <Square size={20} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.stopBtnText}>STOP BEAT</Text>
          </TouchableOpacity>
        )}

        {/* Next Beat */}
        <TouchableOpacity
          style={[styles.circleNavBtn, (currentBeatIndex === totalBeats - 1 || isRecording) && styles.btnDisabled]}
          onPress={onNext}
          disabled={currentBeatIndex === totalBeats - 1 || isRecording}
        >
          <ChevronRight size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Retake Button if Beat already has a take */}
      {hasTake && !isRecording && (
        <TouchableOpacity 
          style={styles.retakeBtn} 
          onPress={onRetake}
        >
          <RotateCcw size={14} color="#FBBF24" />
          <Text style={styles.retakeText}>Retake Beat #{currentBeatIndex + 1}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 12
  },
  topActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(9, 11, 16, 0.78)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)'
  },
  exportReadyPill: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
    backgroundColor: 'rgba(16, 185, 129, 0.2)'
  },
  actionPillText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600'
  },
  exportReadyText: {
    color: '#10B981'
  },
  mainControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    width: '100%'
  },
  circleNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  btnDisabled: {
    opacity: 0.3
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 35,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12
  },
  recordInnerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF'
  },
  recordBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#EF4444'
  },
  stopBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '800'
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)'
  },
  retakeText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '600'
  }
});
